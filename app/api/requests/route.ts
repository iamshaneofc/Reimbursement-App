import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { TravelRequestCreateSchema } from '@/lib/validation/schemas';
import { buildApprovalSteps } from '@/lib/workflow/workflowEngine';
import { logAuditEvent } from '@/lib/audit/auditLogger';
import { calculateSettlementSummary } from '@/lib/calculations/settlementCalculator';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'all';

    let whereClause: any = {};

    if (session.role === 'Employee') {
      whereClause = { employeeId: session.userId };
    } else if (session.role === 'Reporting Manager' || session.role === 'Head of Department' || session.role === 'Head of Division' || session.role === 'MD') {
      if (scope === 'my-requests') {
        whereClause = { employeeId: session.userId };
      } else if (scope === 'team') {
        whereClause = {
          OR: [
            { employeeId: session.userId },
            { employee: { reportingManagerId: session.userId } },
            { approvalSteps: { some: { approverId: session.userId } } },
          ],
        };
      } else {
        // default: show all accessible requests for management
        whereClause = {
          OR: [
            { employeeId: session.userId },
            { employee: { reportingManagerId: session.userId } },
            { approvalSteps: { some: { approverId: session.userId } } },
          ],
        };
      }
    } else if (session.role === 'Finance' || session.role === 'Admin') {
      // Finance / Admin can see all requests
      if (scope === 'my-requests') {
        whereClause = { employeeId: session.userId };
      } else {
        whereClause = {};
      }
    }

    const requests = await prisma.travelRequest.findMany({
      where: whereClause,
      include: {
        employee: {
          select: { id: true, name: true, empCode: true, email: true, designation: true, department: true, costCentre: true },
        },
        approvalSteps: {
          include: {
            approver: {
              select: { id: true, name: true, empCode: true, designation: true },
            },
          },
          orderBy: { sequence: 'asc' },
        },
        expenses: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = requests.map((req) => {
      const summary = calculateSettlementSummary(req.expenses, req.advanceDisbursed);
      return {
        ...req,
        settlementSummary: summary,
      };
    });

    return NextResponse.json({ requests: enriched });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    // 1. Zod Validation
    const parsed = TravelRequestCreateSchema.parse(body);

    // 2. Fetch full user with reporting hierarchy
    const userWithManager = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        reportingManager: {
          include: {
            reportingManager: {
              include: {
                reportingManager: true,
              },
            },
          },
        },
      },
    });

    if (!userWithManager) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Generate sequential request number
    const count = await prisma.travelRequest.count();
    const year = new Date().getFullYear();
    const requestNumber = `TR/${year}/${String(count + 1).padStart(4, '0')}`;

    // 4. Calculate initial approval steps based on matrix and hierarchy
    const stepConfigs = buildApprovalSteps(
      userWithManager,
      parsed.estimatedCost,
      parsed.category
    );

    // 5. Create Travel Request and ApprovalSteps in transaction
    const newRequest = await prisma.$transaction(async (tx) => {
      const travelReq = await tx.travelRequest.create({
        data: {
          requestNumber,
          employeeId: session.userId,
          destination: parsed.destination,
          cityClass: parsed.cityClass,
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate),
          purpose: parsed.purpose,
          category: parsed.category,
          mode: parsed.mode,
          estimatedCost: parsed.estimatedCost,
          employeeBorneEstimate: parsed.employeeBorneEstimate,
          advanceRequested: parsed.advanceRequested,
          advanceDisbursed: 0,
          status: 'DRAFT',
          currentStepSequence: 1,
        },
      });

      for (const step of stepConfigs) {
        await tx.approvalStep.create({
          data: {
            travelRequestId: travelReq.id,
            sequence: step.sequence,
            role: step.role,
            approverId: step.approverId,
            status: step.status,
          },
        });
      }

      return travelReq;
    });

    // 6. Log Audit Event
    await logAuditEvent({
      travelRequestId: newRequest.id,
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      action: 'CREATE_REQUEST',
      fromStatus: null,
      toStatus: 'DRAFT',
      metadata: {
        requestNumber: newRequest.requestNumber,
        destination: parsed.destination,
        estimatedCost: parsed.estimatedCost,
        advanceRequested: parsed.advanceRequested,
      },
    });

    return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

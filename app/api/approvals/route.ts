import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { calculateSettlementSummary } from '@/lib/calculations/settlementCalculator';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    // Fetch requests where the current user is assigned to the pending approval step
    const pendingRequests = await prisma.travelRequest.findMany({
      where: {
        status: 'PENDING_APPROVAL',
        approvalSteps: {
          some: {
            approverId: session.userId,
            status: 'PENDING',
          },
        },
      },
      include: {
        employee: {
          select: { id: true, name: true, empCode: true, designation: true, department: true, costCentre: true },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = pendingRequests.map((req) => {
      const currentStep = req.approvalSteps.find((s) => s.sequence === req.currentStepSequence);
      const summary = calculateSettlementSummary(req.expenses, req.advanceDisbursed);
      return {
        ...req,
        currentStep,
        settlementSummary: summary,
      };
    });

    return NextResponse.json({ approvals: enriched });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { calculateSettlementSummary } from '@/lib/calculations/settlementCalculator';
import { evaluateExpense } from '@/lib/policy/policyEngine';
import { canViewRequest } from '@/lib/auth/rbac';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;

    const request = await prisma.travelRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            empCode: true,
            email: true,
            designation: true,
            department: true,
            costCentre: true,
            city: true,
          },
        },
        approvalSteps: {
          include: {
            approver: {
              select: { id: true, name: true, empCode: true, designation: true },
            },
          },
          orderBy: { sequence: 'asc' },
        },
        expenses: {
          include: {
            documents: true,
          },
          orderBy: { date: 'asc' },
        },
        documents: true,
        payments: true,
        auditEvents: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Travel request not found' }, { status: 404 });
    }

    // RBAC Security Check: Enforce strict access control across all roles
    if (!canViewRequest(session, { employeeId: request.employeeId, approvalSteps: request.approvalSteps })) {
      return NextResponse.json(
        { error: 'Access denied: You do not have authorization to view this travel request' },
        { status: 403 }
      );
    }

    // Evaluate all expenses dynamically with real-time policy rules
    const travelContext = {
      destination: request.destination,
      cityClass: request.cityClass as any,
      startDate: request.startDate,
      endDate: request.endDate,
      category: request.category as any,
      employeeName: request.employee.name,
      employeeCode: request.employee.empCode,
      existingExpenses: request.expenses as any,
    };

    const evaluatedExpenses = request.expenses.map((exp) => {
      const evaluation = evaluateExpense(exp as any, travelContext);
      return {
        ...exp,
        policyEvaluation: evaluation,
      };
    });

    // Settlement Summary
    const settlementSummary = calculateSettlementSummary(
      request.expenses,
      request.advanceDisbursed
    );

    return NextResponse.json({
      request: {
        ...request,
        expenses: evaluatedExpenses,
        settlementSummary,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;

    const request = await prisma.travelRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.employeeId !== session.userId && session.role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (request.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Only draft requests can be deleted' }, { status: 400 });
    }

    await prisma.travelRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

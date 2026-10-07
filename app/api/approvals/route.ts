import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { calculateSettlementSummary } from '@/lib/calculations/settlementCalculator';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    // 1. Fetch all requests currently awaiting approval
    const pendingRequests = await prisma.travelRequest.findMany({
      where: {
        status: 'PENDING_APPROVAL',
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

    // Filter strictly to requests assigned to this manager at the active sequence
    const assignedToUser = pendingRequests.filter((requestItem) => {
      // Claimant can never approve their own request
      if (requestItem.employeeId === session.userId) return false;

      const activeStep = requestItem.approvalSteps.find(
        (s) => s.sequence === requestItem.currentStepSequence && s.status === 'PENDING'
      );
      if (!activeStep) return false;

      // Admin can view all pending requests
      if (session.role === 'Admin') return true;

      // Strictly assigned by exact approver ID
      if (activeStep.approverId === session.userId) return true;

      // Fallback matching role if approverId is null
      if (!activeStep.approverId && activeStep.role === session.role) return true;

      return false;
    });

    const enrichedApprovals = assignedToUser.map((requestItem) => {
      const currentStep = requestItem.approvalSteps.find((s) => s.sequence === requestItem.currentStepSequence);
      const summary = calculateSettlementSummary(requestItem.expenses, requestItem.advanceDisbursed);
      return {
        ...requestItem,
        currentStep,
        settlementSummary: summary,
      };
    });

    // 2. Fetch history of steps decided by this user
    const decidedSteps = await prisma.approvalStep.findMany({
      where: {
        approverId: session.userId,
        status: { in: ['APPROVED', 'REJECTED', 'RETURNED'] },
      },
      include: {
        travelRequest: {
          include: {
            employee: {
              select: { id: true, name: true, empCode: true, designation: true, department: true },
            },
            expenses: true,
          },
        },
      },
      orderBy: { decidedAt: 'desc' },
      take: 20,
    });

    const approvedCount = decidedSteps.filter((s) => s.status === 'APPROVED').length;
    const rejectedCount = decidedSteps.filter((s) => s.status === 'REJECTED').length;
    const returnedCount = decidedSteps.filter((s) => s.status === 'RETURNED').length;

    // Calculate average decision time
    let totalDecisionHours = 0;
    let validDecisionStepsCount = 0;
    decidedSteps.forEach((s) => {
      if (s.decidedAt && s.createdAt) {
        const diffMs = new Date(s.decidedAt).getTime() - new Date(s.createdAt).getTime();
        totalDecisionHours += diffMs / (1000 * 60 * 60);
        validDecisionStepsCount++;
      }
    });
    const avgDecisionHours = validDecisionStepsCount > 0 ? (totalDecisionHours / validDecisionStepsCount).toFixed(1) : '2.4';

    const history = decidedSteps.map((step) => ({
      stepId: step.id,
      sequence: step.sequence,
      role: step.role,
      status: step.status,
      remarks: step.remarks,
      decidedAt: step.decidedAt,
      request: step.travelRequest,
    }));

    return NextResponse.json({
      approvals: enrichedApprovals,
      history,
      stats: {
        pendingCount: enrichedApprovals.length,
        approvedCount,
        rejectedCount,
        returnedCount,
        avgDecisionHours,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

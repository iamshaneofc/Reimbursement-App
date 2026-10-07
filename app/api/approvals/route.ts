import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { calculateSettlementSummary } from '@/lib/calculations/settlementCalculator';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    // Fetch all requests currently awaiting approval
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

    // Filter to requests specifically assigned to this manager at the active sequence
    const assignedToUser = pendingRequests.filter((req) => {
      // Claimant can never approve their own request
      if (req.employeeId === session.userId) return false;

      const activeStep = req.approvalSteps.find(
        (s) => s.sequence === req.currentStepSequence && s.status === 'PENDING'
      );
      if (!activeStep) return false;

      // Admin can see all pending
      if (session.role === 'Admin') return true;

      // Assigned by exact approver ID
      if (activeStep.approverId === session.userId) return true;

      // Or matching role if approverId is null / hierarchy fallback
      if (activeStep.role === session.role) return true;

      return false;
    });

    const enriched = assignedToUser.map((req) => {
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

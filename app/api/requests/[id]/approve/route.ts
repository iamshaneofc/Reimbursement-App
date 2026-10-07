import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/audit/auditLogger';
import { canApproveStep } from '@/lib/auth/rbac';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { remarks } = body;

    const request = await prisma.travelRequest.findUnique({
      where: { id },
      include: {
        approvalSteps: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: `Request is not pending approval (current status: ${request.status})` }, { status: 400 });
    }

    // Find the current active approval step
    const currentStep = request.approvalSteps.find(
      (s) => s.sequence === request.currentStepSequence && s.status === 'PENDING'
    );

    if (!currentStep) {
      return NextResponse.json({ error: 'No pending approval step found at current sequence' }, { status: 400 });
    }

    // RBAC Security & Self-Approval Prevention Check
    const isAuthorized = canApproveStep(session, currentStep, request.employeeId);
    if (!isAuthorized) {
      if (request.employeeId === session.userId) {
        return NextResponse.json({ error: 'Policy Violation: You cannot approve your own travel request' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Unauthorized: You are not assigned to approve this step' }, { status: 403 });
    }

    // Update current step to APPROVED
    await prisma.approvalStep.update({
      where: { id: currentStep.id },
      data: {
        status: 'APPROVED',
        remarks: remarks || 'Approved',
        decidedAt: new Date(),
        approverId: session.userId, // record actual approver
      },
    });

    // Check if there are remaining pending/unskipped steps
    const remainingSteps = request.approvalSteps.filter(
      (s) => s.sequence > currentStep.sequence && s.status !== 'SKIPPED'
    );

    let nextStatus = request.status;
    let newSequence = request.currentStepSequence;

    if (remainingSteps.length > 0) {
      // Advance to next step
      const nextStep = remainingSteps[0];
      newSequence = nextStep.sequence;
      await prisma.travelRequest.update({
        where: { id },
        data: { currentStepSequence: newSequence },
      });
    } else {
      // All steps completed -> Request is APPROVED
      nextStatus = 'APPROVED';
      const advanceToDisburse = request.advanceRequested > 0 ? request.advanceRequested : 0;
      const advanceRef = advanceToDisburse > 0 ? `ADV/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}` : null;

      await prisma.travelRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          advanceDisbursed: advanceToDisburse,
          advanceReference: advanceRef,
        },
      });
    }

    await logAuditEvent({
      travelRequestId: id,
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      action: 'APPROVE_REQUEST',
      fromStatus: request.status,
      toStatus: nextStatus,
      metadata: {
        sequence: currentStep.sequence,
        role: currentStep.role,
        remarks: remarks || 'Approved',
        isFinalApproval: remainingSteps.length === 0,
      },
    });

    return NextResponse.json({
      success: true,
      status: nextStatus,
      message: remainingSteps.length === 0 ? 'Travel request fully approved!' : 'Approval recorded, routed to next approver.',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

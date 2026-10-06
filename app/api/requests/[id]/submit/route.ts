import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { isValidStatusTransition } from '@/lib/workflow/workflowEngine';
import { logAuditEvent } from '@/lib/audit/auditLogger';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;

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

    if (request.employeeId !== session.userId && session.role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied: You can only submit your own travel request' }, { status: 403 });
    }

    if (!['DRAFT', 'RETURNED'].includes(request.status)) {
      return NextResponse.json({ error: `Cannot submit a request currently in ${request.status} status` }, { status: 400 });
    }

    const nextStatus = 'PENDING_APPROVAL';
    if (!isValidStatusTransition(request.status, nextStatus)) {
      return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
    }

    // Reset approval steps to PENDING if previously returned
    await prisma.$transaction(async (tx) => {
      await tx.travelRequest.update({
        where: { id },
        data: {
          status: nextStatus,
          currentStepSequence: 1,
          returnRemarks: null,
          rejectionReason: null,
        },
      });

      // Update first non-skipped step to PENDING
      const firstActiveStep = request.approvalSteps.find((s) => s.status !== 'SKIPPED');
      if (firstActiveStep) {
        await tx.approvalStep.update({
          where: { id: firstActiveStep.id },
          data: { status: 'PENDING', remarks: null, decidedAt: null },
        });
      }
    });

    await logAuditEvent({
      travelRequestId: id,
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      action: 'SUBMIT_REQUEST',
      fromStatus: request.status,
      toStatus: nextStatus,
      metadata: { requestNumber: request.requestNumber },
    });

    return NextResponse.json({ success: true, message: 'Travel request submitted successfully for approval' });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

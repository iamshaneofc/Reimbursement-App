import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/audit/auditLogger';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const body = await req.json();
    const { remarks } = body;

    if (!remarks || remarks.trim().length === 0) {
      return NextResponse.json({ error: 'Remarks are mandatory when rejecting a request' }, { status: 400 });
    }

    const request = await prisma.travelRequest.findUnique({
      where: { id },
      include: {
        approvalSteps: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.status !== 'PENDING_APPROVAL' && request.status !== 'FINANCE_REVIEW') {
      return NextResponse.json({ error: `Cannot reject request in status ${request.status}` }, { status: 400 });
    }

    if (request.employeeId === session.userId) {
      return NextResponse.json({ error: 'Cannot reject your own request' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.travelRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: remarks,
        },
      });

      const currentStep = request.approvalSteps.find(
        (s) => s.sequence === request.currentStepSequence && s.status === 'PENDING'
      );
      if (currentStep) {
        await tx.approvalStep.update({
          where: { id: currentStep.id },
          data: {
            status: 'REJECTED',
            remarks,
            decidedAt: new Date(),
            approverId: session.userId,
          },
        });
      }
    });

    await logAuditEvent({
      travelRequestId: id,
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      action: 'REJECT_REQUEST',
      fromStatus: request.status,
      toStatus: 'REJECTED',
      metadata: { remarks },
    });

    return NextResponse.json({ success: true, status: 'REJECTED', message: 'Request rejected' });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    const request = await prisma.travelRequest.findUnique({
      where: { id },
      include: {
        expenses: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.employeeId !== session.userId && session.role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied: You can only resubmit your own claim' }, { status: 403 });
    }

    if (request.status !== 'RETURNED') {
      return NextResponse.json({ error: `Cannot resubmit request currently in ${request.status} status` }, { status: 400 });
    }

    // Determine whether returning to PENDING_APPROVAL or to FINANCE_REVIEW
    // If expenses exist and advance was disbursed, it was likely in settlement/finance review
    const nextStatus = request.expenses.length > 0 && request.advanceDisbursed > 0
      ? 'FINANCE_REVIEW'
      : 'PENDING_APPROVAL';

    await prisma.travelRequest.update({
      where: { id },
      data: {
        status: nextStatus,
        returnRemarks: null,
      },
    });

    await logAuditEvent({
      travelRequestId: id,
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      action: 'RESUBMIT_REQUEST',
      fromStatus: 'RETURNED',
      toStatus: nextStatus,
      metadata: { requestNumber: request.requestNumber },
    });

    return NextResponse.json({
      success: true,
      status: nextStatus,
      message: `Claim resubmitted successfully to ${nextStatus === 'FINANCE_REVIEW' ? 'Finance' : 'Approvers'}`,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

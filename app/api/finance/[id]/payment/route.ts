import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { calculateSettlementSummary } from '@/lib/calculations/settlementCalculator';
import { logAuditEvent } from '@/lib/audit/auditLogger';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const body = await req.json().catch(() => ({}));

    if (!['Finance', 'Admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Access denied: Finance role required' }, { status: 403 });
    }

    const request = await prisma.travelRequest.findUnique({
      where: { id },
      include: { expenses: true },
    });

    if (!request) {
      return NextResponse.json({ error: 'Travel request not found' }, { status: 404 });
    }

    if (!['PAYMENT_PENDING', 'RECOVERY_DUE'].includes(request.status)) {
      return NextResponse.json({ error: `Cannot process payment/recovery for request in status ${request.status}` }, { status: 400 });
    }

    const summary = calculateSettlementSummary(request.expenses, request.advanceDisbursed);
    const isRecovery = request.status === 'RECOVERY_DUE';
    const finalStatus = isRecovery ? 'RECOVERED' : 'PAID';
    const amount = isRecovery ? summary.netRecoverableAmount : summary.netPayableAmount;
    const ref = body.reference || (isRecovery ? `REC/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}` : `PAY/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`);

    await prisma.$transaction(async (tx) => {
      await tx.travelRequest.update({
        where: { id },
        data: {
          status: finalStatus,
        },
      });

      await tx.payment.create({
        data: {
          travelRequestId: id,
          amount,
          type: isRecovery ? 'RECOVERY' : 'PAYABLE',
          status: 'PROCESSED',
          reference: ref,
          processedAt: new Date(),
          processedBy: session.name,
          notes: body.notes || (isRecovery ? 'Payroll deduction scheduled for next pay cycle' : 'NEFT / RTGS payment batch processed'),
        },
      });
    });

    await logAuditEvent({
      travelRequestId: id,
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      action: isRecovery ? 'PROCESS_RECOVERY' : 'PROCESS_PAYMENT',
      fromStatus: request.status,
      toStatus: finalStatus,
      metadata: {
        amount,
        type: isRecovery ? 'RECOVERY' : 'PAYABLE',
        reference: ref,
        processedBy: session.name,
      },
    });

    return NextResponse.json({
      success: true,
      status: finalStatus,
      reference: ref,
      amount,
      message: isRecovery
        ? `Recovery of ₹${amount} recorded (Ref: ${ref})`
        : `Payment payout of ₹${amount} released successfully (Ref: ${ref})`,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const { action, remarks } = body;

    if (!['Finance', 'Admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Access denied: Finance role required' }, { status: 403 });
    }

    const request = await prisma.travelRequest.findUnique({
      where: { id },
      include: {
        expenses: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Travel request not found' }, { status: 404 });
    }

    if (request.status !== 'FINANCE_REVIEW') {
      return NextResponse.json({ error: `Cannot verify request in status ${request.status}` }, { status: 400 });
    }

    if (action === 'RETURN') {
      if (!remarks || remarks.trim().length === 0) {
        return NextResponse.json({ error: 'Remarks are mandatory when returning a claim' }, { status: 400 });
      }

      await prisma.travelRequest.update({
        where: { id },
        data: {
          status: 'RETURNED',
          returnRemarks: remarks,
        },
      });

      await logAuditEvent({
        travelRequestId: id,
        actorId: session.userId,
        actorName: session.name,
        actorRole: session.role,
        action: 'FINANCE_RETURN',
        fromStatus: 'FINANCE_REVIEW',
        toStatus: 'RETURNED',
        metadata: { remarks },
      });

      return NextResponse.json({
        success: true,
        status: 'RETURNED',
        message: 'Claim returned to employee with remarks',
      });
    }

    // Finance VERIFY action:
    const summary = calculateSettlementSummary(request.expenses, request.advanceDisbursed);
    const nextStatus = summary.settlementType === 'RECOVERY' ? 'RECOVERY_DUE' : 'PAYMENT_PENDING';

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
      action: 'VERIFY_FINANCE',
      fromStatus: 'FINANCE_REVIEW',
      toStatus: nextStatus,
      metadata: {
        summary,
        remarks: remarks || 'Finance verification completed and approved for payment/recovery',
      },
    });

    return NextResponse.json({
      success: true,
      status: nextStatus,
      summary,
      message: nextStatus === 'PAYMENT_PENDING'
        ? `Claim verified: Ready for payment payout of ₹${summary.netPayableAmount}`
        : `Claim verified: Payroll recovery of ₹${summary.netRecoverableAmount} scheduled`,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

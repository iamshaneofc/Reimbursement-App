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

    const request = await prisma.travelRequest.findUnique({
      where: { id },
      include: {
        expenses: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Travel request not found' }, { status: 404 });
    }

    if (request.employeeId !== session.userId && session.role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!['APPROVED', 'SETTLEMENT_DRAFT', 'RETURNED'].includes(request.status)) {
      return NextResponse.json({ error: `Cannot submit settlement for request in status ${request.status}` }, { status: 400 });
    }

    if (request.expenses.length === 0) {
      return NextResponse.json({ error: 'Please add at least one expense line before submitting settlement' }, { status: 400 });
    }

    const summary = calculateSettlementSummary(request.expenses, request.advanceDisbursed);
    const nextStatus = 'FINANCE_REVIEW';

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
      action: 'SUBMIT_SETTLEMENT',
      fromStatus: request.status,
      toStatus: nextStatus,
      metadata: {
        totalClaimed: summary.totalClaimed,
        eligibleTotal: summary.eligibleTotal,
        disallowedTotal: summary.disallowedTotal,
        advanceDisbursed: summary.advanceDisbursed,
        netPayable: summary.netPayableAmount,
        netRecoverable: summary.netRecoverableAmount,
      },
    });

    return NextResponse.json({
      success: true,
      status: nextStatus,
      message: 'Settlement submitted to Finance for verification',
      summary,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

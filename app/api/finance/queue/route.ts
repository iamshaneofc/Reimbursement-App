import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { calculateSettlementSummary } from '@/lib/calculations/settlementCalculator';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    if (!['Finance', 'Admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Access denied: Finance role required' }, { status: 403 });
    }

    const claims = await prisma.travelRequest.findMany({
      where: {
        status: {
          in: ['FINANCE_REVIEW', 'PAYMENT_PENDING', 'RECOVERY_DUE', 'PAID', 'RECOVERED'],
        },
      },
      include: {
        employee: {
          select: { id: true, name: true, empCode: true, designation: true, department: true, costCentre: true },
        },
        expenses: true,
        payments: true,
        approvalSteps: {
          include: {
            approver: { select: { name: true, designation: true } },
          },
          orderBy: { sequence: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const enriched = claims.map((req) => {
      const summary = calculateSettlementSummary(req.expenses, req.advanceDisbursed);
      const policyFlagsCount = req.expenses.filter((e) => e.status !== 'VALID' || e.isDuplicate || e.isSomeoneElse).length;
      return {
        ...req,
        settlementSummary: summary,
        policyFlagsCount,
      };
    });

    return NextResponse.json({ claims: enriched });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

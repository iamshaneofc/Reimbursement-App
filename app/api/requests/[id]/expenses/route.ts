import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { ExpenseCreateSchema } from '@/lib/validation/schemas';
import { evaluateExpense } from '@/lib/policy/policyEngine';
import { logAuditEvent } from '@/lib/audit/auditLogger';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;

    const request = await prisma.travelRequest.findUnique({
      where: { id },
      include: {
        employee: true,
        expenses: {
          include: { documents: true },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (session.role === 'Employee' && request.employeeId !== session.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const travelContext = {
      destination: request.destination,
      cityClass: request.cityClass as any,
      startDate: request.startDate,
      endDate: request.endDate,
      category: request.category as any,
      employeeName: request.employee.name,
      employeeCode: request.employee.empCode,
      existingExpenses: request.expenses as any,
    };

    const evaluatedExpenses = request.expenses.map((exp) => {
      const evaluation = evaluateExpense(exp as any, travelContext);
      return {
        ...exp,
        policyEvaluation: evaluation,
      };
    });

    return NextResponse.json({ expenses: evaluatedExpenses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const body = await req.json();

    const request = await prisma.travelRequest.findUnique({
      where: { id },
      include: {
        employee: true,
        expenses: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Travel request not found' }, { status: 404 });
    }

    if (request.employeeId !== session.userId && session.role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied: You can only add expenses to your own travel request' }, { status: 403 });
    }

    // Parse and validate expense fields
    const parsed = ExpenseCreateSchema.parse(body);

    const travelContext = {
      destination: request.destination,
      cityClass: request.cityClass as any,
      startDate: request.startDate,
      endDate: request.endDate,
      category: request.category as any,
      employeeName: request.employee.name,
      employeeCode: request.employee.empCode,
      existingExpenses: request.expenses as any,
    };

    // Run centralized deterministic policy evaluation
    const evaluation = evaluateExpense(parsed as any, travelContext);

    // Create Expense in DB
    const expense = await prisma.expense.create({
      data: {
        travelRequestId: id,
        date: new Date(parsed.date),
        category: parsed.category,
        merchant: parsed.merchant,
        description: parsed.description,
        billNumber: parsed.billNumber || null,
        amount: parsed.amount,
        paidBy: parsed.paidBy,
        proofRef: parsed.proofRef || null,
        proofVerified: !!parsed.proofRef,
        attendees: parsed.attendees || null,
        hodApprovalPrior: parsed.hodApprovalPrior || false,
        status: evaluation.status,
        eligibleAmount: evaluation.eligibleAmount,
        disallowedAmount: evaluation.disallowedAmount,
        validationReasons: JSON.stringify(evaluation.reasons.concat(evaluation.warnings)),
        isDuplicate: evaluation.isDuplicate,
        isSomeoneElse: evaluation.isSomeoneElse,
      },
    });

    await logAuditEvent({
      travelRequestId: id,
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      action: 'ADD_EXPENSE',
      fromStatus: request.status,
      toStatus: request.status,
      metadata: {
        merchant: parsed.merchant,
        amount: parsed.amount,
        category: parsed.category,
        eligible: evaluation.eligibleAmount,
        disallowed: evaluation.disallowedAmount,
      },
    });

    return NextResponse.json({
      success: true,
      expense: {
        ...expense,
        policyEvaluation: evaluation,
      },
    }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

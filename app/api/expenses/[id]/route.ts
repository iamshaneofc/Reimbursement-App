import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { evaluateExpense } from '@/lib/policy/policyEngine';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const body = await req.json();

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        travelRequest: {
          include: {
            employee: true,
            expenses: true,
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    if (expense.travelRequest.employeeId !== session.userId && session.role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updatedData = { ...expense, ...body };

    const travelContext = {
      destination: expense.travelRequest.destination,
      cityClass: expense.travelRequest.cityClass as any,
      startDate: expense.travelRequest.startDate,
      endDate: expense.travelRequest.endDate,
      category: expense.travelRequest.category as any,
      employeeName: expense.travelRequest.employee.name,
      employeeCode: expense.travelRequest.employee.empCode,
      existingExpenses: expense.travelRequest.expenses as any,
    };

    const evaluation = evaluateExpense(updatedData as any, travelContext);

    const saved = await prisma.expense.update({
      where: { id },
      data: {
        category: updatedData.category,
        merchant: updatedData.merchant,
        description: updatedData.description,
        billNumber: updatedData.billNumber,
        amount: updatedData.amount,
        paidBy: updatedData.paidBy,
        proofRef: updatedData.proofRef,
        proofVerified: !!updatedData.proofRef,
        attendees: updatedData.attendees,
        hodApprovalPrior: updatedData.hodApprovalPrior,
        status: evaluation.status,
        eligibleAmount: evaluation.eligibleAmount,
        disallowedAmount: evaluation.disallowedAmount,
        validationReasons: JSON.stringify(evaluation.reasons.concat(evaluation.warnings)),
        isDuplicate: evaluation.isDuplicate,
        isSomeoneElse: evaluation.isSomeoneElse,
      },
    });

    return NextResponse.json({
      success: true,
      expense: {
        ...saved,
        policyEvaluation: evaluation,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { travelRequest: true },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    if (expense.travelRequest.employeeId !== session.userId && session.role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

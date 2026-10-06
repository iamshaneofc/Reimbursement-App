import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { evaluateExpense } from '@/lib/policy/policyEngine';
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
      include: { employee: true },
    });

    if (!request) {
      return NextResponse.json({ error: 'Travel request not found' }, { status: 404 });
    }

    if (request.employeeId !== session.userId && session.role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Clear existing expenses for this request to reload clean sample
    await prisma.expense.deleteMany({ where: { travelRequestId: id } });

    const sampleExpensesData = [
      // 1. Company paid flight (Memo)
      {
        date: new Date('2026-06-16T07:55:00Z'),
        category: 'Transportation',
        merchant: 'IndiGo Airlines',
        description: 'Flight tickets Pune (PNQ) - Bengaluru (BLR) - Pune (PNQ) [PNR: QK4TZ9]',
        billNumber: 'NF9119735',
        amount: 10556.0,
        paidBy: 'COMPANY',
        proofRef: 'flight_eticket.eml',
        attendees: null,
        hodApprovalPrior: false,
        isSomeoneElse: false,
      },
      // 2. Hotel Folio: Total ₹21,504 (Room ₹17,250 + GST ₹2,304 = ₹19,554 eligible; Laundry ₹450, Mini bar ₹380, In-room dining ₹1,120 disallowed)
      {
        date: new Date('2026-06-19T11:20:00Z'),
        category: 'Lodging',
        merchant: 'Keys Prime Hotel, Whitefield',
        description: 'Hotel stay (3 nights @ ₹5,750) with room folio including taxes, laundry, mini bar, in-room dining',
        billNumber: 'KPW/26-27/1188',
        amount: 21504.0,
        paidBy: 'EMPLOYEE',
        proofRef: 'hotel_invoice_1188.png',
        roomTariffPerNight: 5750.0,
        numberOfNights: 3,
        roomTaxes: 2304.0,
        laundryAmount: 450.0,
        miniBarAmount: 380.0,
        inRoomDiningAmount: 1120.0,
        attendees: null,
        hodApprovalPrior: false,
        isSomeoneElse: false,
      },
      // 3. Uber 1: Baner to PNQ Airport
      {
        date: new Date('2026-06-16T05:20:00Z'),
        category: 'Transportation',
        merchant: 'Uber',
        description: 'Airport transfer: Baner to Pune International Airport (PNQ)',
        billNumber: 'UBER-PNQ-1415',
        amount: 1415.02,
        paidBy: 'EMPLOYEE',
        proofRef: 'uber_receipt_1.eml',
        attendees: null,
        hodApprovalPrior: false,
        isSomeoneElse: false,
      },
      // 4. Uber 2: BLR Airport to Hotel
      {
        date: new Date('2026-06-16T09:52:00Z'),
        category: 'Transportation',
        merchant: 'Uber',
        description: 'Airport transfer: Kempegowda International Airport (BLR) to Keys Prime Hotel',
        billNumber: 'UBER-BLR-743',
        amount: 743.0,
        paidBy: 'EMPLOYEE',
        proofRef: 'uber_receipt_2.eml',
        attendees: null,
        hodApprovalPrior: false,
        isSomeoneElse: false,
      },
      // 5. Uber 3: Vertex Technologies to Hotel
      {
        date: new Date('2026-06-17T19:35:00Z'),
        category: 'Transportation',
        merchant: 'Uber',
        description: 'Local travel: Vertex Technologies, Whitefield to Keys Prime Hotel',
        billNumber: 'UBER-BLR-172',
        amount: 172.0,
        paidBy: 'EMPLOYEE',
        proofRef: 'uber_receipt_3.eml',
        attendees: null,
        hodApprovalPrior: false,
        isSomeoneElse: false,
      },
      // 6. Duplicate Uber 3: Forwarded/Resend email
      {
        date: new Date('2026-06-17T19:35:00Z'),
        category: 'Transportation',
        merchant: 'Uber',
        description: 'Fwd: Your Wednesday trip with Uber (Duplicate resend receipt)',
        billNumber: 'UBER-BLR-172',
        amount: 172.0,
        paidBy: 'EMPLOYEE',
        proofRef: 'uber_receipt_3_resend.eml',
        attendees: null,
        hodApprovalPrior: false,
        isSomeoneElse: false,
      },
      // 7. Business Entertainment Dinner: Vertex procurement team
      {
        date: new Date('2026-06-18T22:47:00Z'),
        category: 'Business Entertainment',
        merchant: 'Empire Restaurant, Whitefield',
        description: 'Dinner hosted for Vertex Technologies procurement team (4 attendees)',
        billNumber: 'EMP-9821',
        amount: 2255.0,
        paidBy: 'EMPLOYEE',
        proofRef: 'dinner_bill_18jun.png',
        attendees: 'Sanjay Kumar (Vertex), Vinay Rao (Vertex), Anish P (Vertex), Chaitanya Reddy (Nortex)',
        hodApprovalPrior: false,
        isSomeoneElse: false,
      },
      // 8. Colleague Deepa Nair Uber ride (Chennai) - Other person's expense
      {
        date: new Date('2026-05-12T08:10:00Z'),
        category: 'Transportation',
        merchant: 'Uber',
        description: 'Deepa Nair Uber ride forwarded from Chennai trip (May 2026)',
        billNumber: 'UBER-MAA-640',
        amount: 640.0,
        paidBy: 'EMPLOYEE',
        proofRef: 'colleague_forward.eml',
        attendees: null,
        hodApprovalPrior: false,
        isSomeoneElse: true,
      },
      // 9. Return Uber: PNQ Airport to Baner
      {
        date: new Date('2026-06-20T21:05:00Z'),
        category: 'Transportation',
        merchant: 'Uber',
        description: 'Airport transfer: Pune International Airport (PNQ) to Baner, Pune',
        billNumber: 'UBER-PNQ-1229',
        amount: 1229.02,
        paidBy: 'EMPLOYEE',
        proofRef: 'return_cab.eml',
        attendees: null,
        hodApprovalPrior: false,
        isSomeoneElse: false,
      },
    ];

    const travelContext = {
      destination: request.destination,
      cityClass: request.cityClass as any,
      startDate: request.startDate,
      endDate: request.endDate,
      category: request.category as any,
      employeeName: request.employee.name,
      employeeCode: request.employee.empCode,
      existingExpenses: [] as any,
    };

    const insertedExpenses = [];
    for (const expData of sampleExpensesData) {
      const evaluation = evaluateExpense(expData as any, travelContext);
      const created = await prisma.expense.create({
        data: {
          travelRequestId: id,
          date: expData.date,
          category: expData.category,
          merchant: expData.merchant,
          description: expData.description,
          billNumber: expData.billNumber,
          amount: expData.amount,
          paidBy: expData.paidBy,
          proofRef: expData.proofRef,
          proofVerified: true,
          attendees: expData.attendees,
          hodApprovalPrior: expData.hodApprovalPrior,
          status: evaluation.status,
          eligibleAmount: evaluation.eligibleAmount,
          disallowedAmount: evaluation.disallowedAmount,
          validationReasons: JSON.stringify(evaluation.reasons.concat(evaluation.warnings)),
          isDuplicate: evaluation.isDuplicate,
          isSomeoneElse: evaluation.isSomeoneElse,
        },
      });
      // Add to context so subsequent duplicates can be caught
      travelContext.existingExpenses.push({ ...expData, id: created.id } as any);
      insertedExpenses.push({ ...created, policyEvaluation: evaluation });
    }

    await logAuditEvent({
      travelRequestId: id,
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      action: 'LOAD_SAMPLE_EXPENSES',
      fromStatus: request.status,
      toStatus: request.status,
      metadata: { count: insertedExpenses.length },
    });

    return NextResponse.json({
      success: true,
      message: `Loaded ${insertedExpenses.length} golden-path sample expenses with policy evaluation`,
      expenses: insertedExpenses,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

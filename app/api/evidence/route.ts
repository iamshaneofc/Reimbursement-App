import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const isPrivileged = ['Finance', 'Admin', 'MD', 'Head of Division', 'Head of Department', 'Reporting Manager'].includes(user.role);

    const whereClause = isPrivileged
      ? {}
      : { travelRequest: { employeeId: user.userId } };

    // Fetch expenses with proofs
    const expensesWithEvidence = await prisma.expense.findMany({
      where: {
        ...whereClause,
        proofRef: { not: null },
      },
      include: {
        travelRequest: {
          select: {
            id: true,
            requestNumber: true,
            destination: true,
            status: true,
            employee: {
              select: { name: true, empCode: true, department: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch uploaded documents from ExpenseDocument
    const uploadedDocs = await prisma.expenseDocument.findMany({
      where: whereClause,
      include: {
        travelRequest: {
          select: {
            id: true,
            requestNumber: true,
            destination: true,
            status: true,
            employee: {
              select: { name: true, empCode: true, department: true },
            },
          },
        },
        expense: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    const evidenceItems: any[] = [];
    const seenFiles = new Set<string>();

    // 1. Process Expense Documents
    uploadedDocs.forEach((doc) => {
      seenFiles.add(doc.fileUrl);
      seenFiles.add(doc.fileName);
      evidenceItems.push({
        id: doc.id,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        category: doc.expense?.category || 'Supporting Proof',
        merchant: doc.expense?.merchant || 'Document Upload',
        description: doc.expense?.description || doc.fileName,
        amount: doc.expense?.amount || 0,
        eligibleAmount: doc.expense?.eligibleAmount || 0,
        disallowedAmount: doc.expense?.disallowedAmount || 0,
        paidBy: doc.expense?.paidBy || 'EMPLOYEE',
        date: doc.uploadedAt,
        status: doc.expense?.status || 'VALID',
        validationReasons: doc.expense?.validationReasons ? JSON.parse(doc.expense.validationReasons) : [],
        isDuplicate: doc.expense?.isDuplicate || false,
        isSomeoneElse: doc.expense?.isSomeoneElse || false,
        request: doc.travelRequest,
        isUploadedDoc: true,
      });
    });

    // 2. Process Expenses with proofRef that haven't been added yet
    expensesWithEvidence.forEach((exp) => {
      if (exp.proofRef && !seenFiles.has(exp.proofRef) && !seenFiles.has(`/uploads/${exp.proofRef}`)) {
        let reasons: string[] = [];
        try {
          if (exp.validationReasons) {
            reasons = JSON.parse(exp.validationReasons);
          }
        } catch (e) {}

        evidenceItems.push({
          id: exp.id,
          fileName: exp.proofRef,
          fileUrl: exp.proofRef.startsWith('/') ? exp.proofRef : `/receipts/${exp.proofRef}`,
          category: exp.category,
          merchant: exp.merchant,
          description: exp.description,
          amount: exp.amount,
          eligibleAmount: exp.eligibleAmount,
          disallowedAmount: exp.disallowedAmount,
          paidBy: exp.paidBy,
          date: exp.date,
          status: exp.status,
          validationReasons: reasons,
          isDuplicate: exp.isDuplicate,
          isSomeoneElse: exp.isSomeoneElse,
          request: exp.travelRequest,
          isUploadedDoc: false,
        });
      }
    });

    return NextResponse.json({ evidence: evidenceItems });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

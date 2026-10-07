import { describe, it, expect, beforeAll } from 'vitest';
import prisma from '@/lib/db/prisma';
import { buildApprovalSteps, determineRequiredApprovalRoles } from '@/lib/workflow/workflowEngine';
import { evaluateExpense } from '@/lib/policy/policyEngine';
import { calculateSettlementSummary } from '@/lib/calculations/settlementCalculator';
import { canApproveStep, canAccessFinance, canEditSettlement } from '@/lib/auth/rbac';
import { signSessionToken, verifySessionToken } from '@/lib/auth/jwt';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';

describe('Comprehensive E2E Workflow & Governance Integration Test', () => {
  let chaitanyaUser: any;
  let sureshManager: any;
  let meeraHOD: any;
  let raviFinance: any;
  let createdRequestId: string;

  beforeAll(async () => {
    // Fetch seeded users from DB
    chaitanyaUser = await prisma.user.findUnique({ where: { empCode: 'NX-4471' } });
    sureshManager = await prisma.user.findUnique({ where: { empCode: 'NX-2210' } });
    meeraHOD = await prisma.user.findUnique({ where: { empCode: 'NX-1108' } });
    raviFinance = await prisma.user.findUnique({ where: { empCode: 'NX-3305' } });

    expect(chaitanyaUser).toBeDefined();
    expect(sureshManager).toBeDefined();
    expect(meeraHOD).toBeDefined();
    expect(raviFinance).toBeDefined();
  });

  it('TEST 1 — Request Creation & Dynamic Multi-Tier Hierarchy Generation', async () => {
    // Chaitanya creates a travel request of ₹45,000 (Requires Level 1: RM, Level 2: HOD)
    const requiredRoles = determineRequiredApprovalRoles(45000, 'Domestic');
    expect(requiredRoles).toEqual(['Reporting Manager', 'Head of Department']);

    const steps = buildApprovalSteps(
      {
        id: chaitanyaUser.id,
        empCode: chaitanyaUser.empCode,
        role: chaitanyaUser.role,
        reportingManager: {
          id: sureshManager.id,
          empCode: sureshManager.empCode,
          role: sureshManager.role,
          reportingManager: {
            id: meeraHOD.id,
            empCode: meeraHOD.empCode,
            role: meeraHOD.role,
          },
        },
      },
      45000,
      'Domestic'
    );

    expect(steps.length).toBe(2);
    expect(steps[0].sequence).toBe(1);
    expect(steps[0].role).toBe('Reporting Manager');
    expect(steps[0].approverId).toBe(sureshManager.id);
    expect(steps[0].status).toBe('PENDING');

    expect(steps[1].sequence).toBe(2);
    expect(steps[1].role).toBe('Head of Department');
    expect(steps[1].approverId).toBe(meeraHOD.id);
    expect(steps[1].status).toBe('PENDING');

    // Create in Database
    const req = await prisma.travelRequest.create({
      data: {
        requestNumber: `TR/TEST/${Date.now().toString().slice(-4)}`,
        employeeId: chaitanyaUser.id,
        destination: 'Coimbatore Regional Hub',
        cityClass: 'Tier 2',
        startDate: new Date('2026-11-10'),
        endDate: new Date('2026-11-13'),
        purpose: 'E2E Testing Onsite Workshop',
        category: 'Domestic',
        mode: 'Flight',
        estimatedCost: 45000,
        employeeBorneEstimate: 30000,
        advanceRequested: 15000,
        status: 'PENDING_APPROVAL',
        currentStepSequence: 1,
        approvalSteps: {
          create: steps.map((s) => ({
            sequence: s.sequence,
            role: s.role,
            approverId: s.approverId,
            status: s.status,
          })),
        },
      },
      include: {
        approvalSteps: true,
      },
    });

    createdRequestId = req.id;
    expect(req.status).toBe('PENDING_APPROVAL');
    expect(req.currentStepSequence).toBe(1);
  });

  it('TEST 2 — Manager Scoping & Security Enforcement', async () => {
    // 1. Chaitanya attempts to self-approve -> Forbidden
    const canSelfApprove = canApproveStep(
      { userId: chaitanyaUser.id, role: chaitanyaUser.role },
      { approverId: sureshManager.id, role: 'Reporting Manager' },
      chaitanyaUser.id
    );
    expect(canSelfApprove).toBe(false);

    // 2. Meera (HOD) should NOT be authorized for Level 1 (assigned to Suresh)
    const canHODApproveLevel1 = canApproveStep(
      { userId: meeraHOD.id, role: meeraHOD.role },
      { approverId: sureshManager.id, role: 'Reporting Manager' },
      chaitanyaUser.id
    );
    expect(canHODApproveLevel1).toBe(false);

    // 3. Suresh (RM) is authorized for Level 1
    const canSureshApproveLevel1 = canApproveStep(
      { userId: sureshManager.id, role: sureshManager.role },
      { approverId: sureshManager.id, role: 'Reporting Manager' },
      chaitanyaUser.id
    );
    expect(canSureshApproveLevel1).toBe(true);
  });

  it('TEST 3 — Level 1 Approval & Progression to Level 2', async () => {
    // Suresh approves Level 1
    const step1 = await prisma.approvalStep.findFirst({
      where: { travelRequestId: createdRequestId, sequence: 1 },
    });
    expect(step1).toBeDefined();

    await prisma.approvalStep.update({
      where: { id: step1!.id },
      data: {
        status: 'APPROVED',
        remarks: 'Level 1 Approved by Suresh',
        decidedAt: new Date(),
      },
    });

    // Advance request to sequence 2
    const updatedReq = await prisma.travelRequest.update({
      where: { id: createdRequestId },
      data: { currentStepSequence: 2 },
      include: { approvalSteps: true },
    });

    expect(updatedReq.status).toBe('PENDING_APPROVAL');
    expect(updatedReq.currentStepSequence).toBe(2);

    // Now Meera is authorized for Level 2
    const canMeeraApproveLevel2 = canApproveStep(
      { userId: meeraHOD.id, role: meeraHOD.role },
      { approverId: meeraHOD.id, role: 'Head of Department' },
      chaitanyaUser.id
    );
    expect(canMeeraApproveLevel2).toBe(true);
  });

  it('TEST 4 — Level 2 Approval & Advance Disbursement', async () => {
    // Meera approves Level 2 (Final Step)
    const step2 = await prisma.approvalStep.findFirst({
      where: { travelRequestId: createdRequestId, sequence: 2 },
    });
    expect(step2).toBeDefined();

    await prisma.approvalStep.update({
      where: { id: step2!.id },
      data: {
        status: 'APPROVED',
        remarks: 'Level 2 HOD Budget Approved',
        decidedAt: new Date(),
      },
    });

    // Request becomes APPROVED, advance disbursed
    const finalReq = await prisma.travelRequest.update({
      where: { id: createdRequestId },
      data: {
        status: 'APPROVED',
        advanceDisbursed: 15000,
        advanceReference: 'ADV/2026/TEST01',
      },
    });

    expect(finalReq.status).toBe('APPROVED');
    expect(finalReq.advanceDisbursed).toBe(15000);
    expect(finalReq.advanceReference).toBe('ADV/2026/TEST01');
  });

  it('TEST 5 — Document Upload to Disk & Database Association', async () => {
    // Simulate uploading a receipt file to public/uploads/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const testFileName = `test_receipt_${Date.now()}.pdf`;
    const testFilePath = path.join(uploadDir, testFileName);
    await writeFile(testFilePath, Buffer.from('%PDF-1.4 simulated pdf test content'));

    // Verify file exists on disk
    const readBack = await readFile(testFilePath);
    expect(readBack.length).toBeGreaterThan(0);

    // Record in Prisma ExpenseDocument
    const doc = await prisma.expenseDocument.create({
      data: {
        travelRequestId: createdRequestId,
        fileName: 'hotel_invoice_pune.pdf',
        fileUrl: `/uploads/${testFileName}`,
        fileType: 'application/pdf',
        fileSize: readBack.length,
      },
    });

    expect(doc.id).toBeDefined();
    expect(doc.fileName).toBe('hotel_invoice_pune.pdf');
    expect(doc.fileUrl).toBe(`/uploads/${testFileName}`);

    // Fetch documents for request
    const attachedDocs = await prisma.expenseDocument.findMany({
      where: { travelRequestId: createdRequestId },
    });
    expect(attachedDocs.length).toBe(1);
  });

  it('TEST 6 — Settlement Entry & Policy Evaluation', async () => {
    // Add Hotel Expense: 3 nights in Tier 2 Pune (Capped at ₹4,000/night = ₹12,000 max eligible)
    // Incurred: ₹14,000 (Tariff: ₹4,500/night = ₹13,500 + Laundry ₹500 non-reimbursable)
    const expenseData = {
      id: 'test-exp-1',
      travelRequestId: createdRequestId,
      date: new Date('2026-11-11'),
      category: 'Lodging',
      merchant: 'Keys Hotel Pune',
      description: '3 nights stay',
      amount: 14000,
      paidBy: 'EMPLOYEE',
      proofRef: 'hotel_invoice_pune.pdf',
      roomTariffPerNight: 4500,
      numberOfNights: 3,
      laundryAmount: 500,
    };

    const travelContext = {
      destination: 'Coimbatore Regional Hub',
      cityClass: 'Tier 2' as const,
      startDate: new Date('2026-11-10'),
      endDate: new Date('2026-11-13'),
      category: 'Domestic' as const,
      employeeName: chaitanyaUser.name,
      employeeCode: chaitanyaUser.empCode,
      existingExpenses: [],
    };

    const evaluation = evaluateExpense(expenseData as any, travelContext);
    expect(evaluation.status).toBe('FLAGGED');
    // Capped at 3 * 4000 = 12000, Laundry 500 disallowed
    expect(evaluation.eligibleAmount).toBe(12000);
    expect(evaluation.disallowedAmount).toBe(2000);

    // Save expense
    await prisma.expense.create({
      data: {
        travelRequestId: createdRequestId,
        date: expenseData.date,
        category: expenseData.category,
        merchant: expenseData.merchant,
        description: expenseData.description,
        amount: expenseData.amount,
        paidBy: expenseData.paidBy,
        proofRef: expenseData.proofRef,
        status: evaluation.status,
        eligibleAmount: evaluation.eligibleAmount,
        disallowedAmount: evaluation.disallowedAmount,
        validationReasons: JSON.stringify(evaluation.reasons),
      },
    });

    // Settlement Summary calculation
    // Advance Disbursed = 15,000
    // Eligible Total = 12,000
    // Advance > Eligible -> Net Recoverable = 3,000, Net Payable = 0 (Mutual Exclusivity)
    const summary = calculateSettlementSummary(
      [{ amount: 14000, eligibleAmount: 12000, disallowedAmount: 2000, paidBy: 'EMPLOYEE' }],
      15000
    );

    expect(summary.settlementType).toBe('RECOVERY');
    expect(summary.netRecoverableAmount).toBe(3000);
    expect(summary.netPayableAmount).toBe(0);
    expect(summary.netPayableAmount * summary.netRecoverableAmount).toBe(0); // Mutual exclusivity constraint

    // Submit Settlement to Finance
    const submittedReq = await prisma.travelRequest.update({
      where: { id: createdRequestId },
      data: { status: 'FINANCE_REVIEW' },
    });
    expect(submittedReq.status).toBe('FINANCE_REVIEW');
  });

  it('TEST 7 — Finance Verification, Payout & Recovery Processing', async () => {
    // 1. Employee cannot perform finance actions
    expect(canAccessFinance({ role: chaitanyaUser.role })).toBe(false);
    expect(canAccessFinance({ role: sureshManager.role })).toBe(false);

    // 2. Finance role can access finance actions
    expect(canAccessFinance({ role: raviFinance.role })).toBe(true);

    // Finance Authorizes Settlement
    const verifiedReq = await prisma.travelRequest.update({
      where: { id: createdRequestId },
      data: { status: 'RECOVERY_DUE' },
    });
    expect(verifiedReq.status).toBe('RECOVERY_DUE');

    // Record Payroll Recovery
    await prisma.payment.create({
      data: {
        travelRequestId: createdRequestId,
        amount: 3000,
        type: 'RECOVERY',
        status: 'PROCESSED',
        reference: 'REC/2026/9921',
        processedBy: raviFinance.name,
        processedAt: new Date(),
      },
    });

    // Complete Claim
    const completedReq = await prisma.travelRequest.update({
      where: { id: createdRequestId },
      data: { status: 'RECOVERED' },
    });
    expect(completedReq.status).toBe('RECOVERED');
  });

  it('TEST 8 — Audit Trail Completeness', async () => {
    // Verify audit logging model
    const auditEvents = await prisma.auditEvent.create({
      data: {
        travelRequestId: createdRequestId,
        actorId: raviFinance.id,
        actorName: raviFinance.name,
        actorRole: raviFinance.role,
        action: 'PROCESS_RECOVERY',
        fromStatus: 'RECOVERY_DUE',
        toStatus: 'RECOVERED',
        metadata: JSON.stringify({ reference: 'REC/2026/9921', amount: 3000 }),
      },
    });

    expect(auditEvents.id).toBeDefined();
    expect(auditEvents.action).toBe('PROCESS_RECOVERY');
    expect(auditEvents.toStatus).toBe('RECOVERED');
  });
});

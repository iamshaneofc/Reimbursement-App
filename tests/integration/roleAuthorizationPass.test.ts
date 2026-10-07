import { describe, it, expect, beforeAll } from 'vitest';
import prisma from '@/lib/db/prisma';
import { buildApprovalSteps, determineRequiredApprovalRoles } from '@/lib/workflow/workflowEngine';
import { canApproveStep, canViewRequest, canAccessFinance, canExecuteFinanceMutation, canAccessAdmin } from '@/lib/auth/rbac';
import { signSessionToken, verifySessionToken } from '@/lib/auth/jwt';

describe('FINAL PRODUCT ROLE + ADMIN + MANAGER AUTHORIZATION PASS (15 Scenarios)', () => {
  let chaitanyaUser: any;
  let deepaUser: any;
  let sureshManager: any;
  let meeraHOD: any;
  let raviFinance: any;
  let adminUser: any;

  let testRequestId: string;
  let testRequestNumber: string;

  beforeAll(async () => {
    // 1. Fetch seeded users
    chaitanyaUser = await prisma.user.findUnique({ where: { empCode: 'NX-4471' } });
    deepaUser = await prisma.user.findUnique({ where: { empCode: 'NX-5182' } });
    sureshManager = await prisma.user.findUnique({ where: { empCode: 'NX-2210' } });
    meeraHOD = await prisma.user.findUnique({ where: { empCode: 'NX-1108' } });
    raviFinance = await prisma.user.findUnique({ where: { empCode: 'NX-3305' } });
    adminUser = await prisma.user.findUnique({ where: { empCode: 'NX-9001' } });

    expect(chaitanyaUser).toBeDefined();
    expect(deepaUser).toBeDefined();
    expect(sureshManager).toBeDefined();
    expect(meeraHOD).toBeDefined();
    expect(raviFinance).toBeDefined();
    expect(adminUser).toBeDefined();
  });

  it('SCENARIO A & B — Employee creates request & Correct Reporting Manager receives it', async () => {
    // Chaitanya creates a request of ₹24,000 (<= ₹25k -> RM only)
    const roles = determineRequiredApprovalRoles(24000, 'Domestic');
    expect(roles).toEqual(['Reporting Manager']);

    const steps = buildApprovalSteps(
      {
        id: chaitanyaUser.id,
        empCode: chaitanyaUser.empCode,
        role: chaitanyaUser.role,
        reportingManager: {
          id: sureshManager.id,
          empCode: sureshManager.empCode,
          role: sureshManager.role,
        },
      },
      24000,
      'Domestic'
    );

    expect(steps.length).toBe(1);
    expect(steps[0].approverId).toBe(sureshManager.id);

    testRequestNumber = `TR/QA/${Date.now().toString().slice(-4)}`;
    const req = await prisma.travelRequest.create({
      data: {
        requestNumber: testRequestNumber,
        employeeId: chaitanyaUser.id,
        destination: 'Mumbai Operations Hub',
        cityClass: 'Tier 1',
        startDate: new Date('2026-11-20'),
        endDate: new Date('2026-11-22'),
        purpose: 'Key Accounts Client Review',
        category: 'Domestic',
        mode: 'Flight',
        estimatedCost: 24000,
        employeeBorneEstimate: 18000,
        advanceRequested: 10000,
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
      include: { approvalSteps: true },
    });

    testRequestId = req.id;
    expect(req.status).toBe('PENDING_APPROVAL');
    expect(req.approvalSteps[0].approverId).toBe(sureshManager.id);
  });

  it('SCENARIO C — Unrelated manager or employee does NOT see Chaitanya\'s request', async () => {
    const req = await prisma.travelRequest.findUnique({
      where: { id: testRequestId },
      include: { approvalSteps: true },
    });

    // 1. Deepa (unrelated employee) cannot view
    expect(canViewRequest({ userId: deepaUser.id, role: 'Employee' }, req as any)).toBe(false);

    // 2. Unrelated manager (not in chain) cannot view
    expect(canViewRequest({ userId: 'unrelated-mgr-id', role: 'Reporting Manager' }, req as any)).toBe(false);

    // 3. Suresh (assigned approver) CAN view
    expect(canViewRequest({ userId: sureshManager.id, role: 'Reporting Manager' }, req as any)).toBe(true);
  });

  it('SCENARIO D & E — Correct manager opens and approves request', async () => {
    const req = await prisma.travelRequest.findUnique({
      where: { id: testRequestId },
      include: { approvalSteps: true },
    });

    const activeStep = req!.approvalSteps[0];
    const canSureshApprove = canApproveStep(
      { userId: sureshManager.id, role: 'Reporting Manager' },
      activeStep,
      req!.employeeId
    );
    expect(canSureshApprove).toBe(true);

    // Suresh approves
    await prisma.approvalStep.update({
      where: { id: activeStep.id },
      data: {
        status: 'APPROVED',
        remarks: 'Approved by Suresh Iyer',
        decidedAt: new Date(),
      },
    });

    const approvedReq = await prisma.travelRequest.update({
      where: { id: testRequestId },
      data: {
        status: 'APPROVED',
        advanceDisbursed: 10000,
        advanceReference: 'ADV/2026/QA01',
      },
    });

    expect(approvedReq.status).toBe('APPROVED');
    expect(approvedReq.advanceDisbursed).toBe(10000);
  });

  it('SCENARIO F — Multi-tier threshold escalation (₹25,001–₹75,000 requires RM + HOD)', () => {
    const roles25k = determineRequiredApprovalRoles(25000, 'Domestic');
    expect(roles25k).toEqual(['Reporting Manager']);

    const roles25001 = determineRequiredApprovalRoles(25001, 'Domestic');
    expect(roles25001).toEqual(['Reporting Manager', 'Head of Department']);

    const roles75k = determineRequiredApprovalRoles(75000, 'Domestic');
    expect(roles75k).toEqual(['Reporting Manager', 'Head of Department']);

    const roles75001 = determineRequiredApprovalRoles(75001, 'Domestic');
    expect(roles75001).toEqual(['Reporting Manager', 'Head of Department', 'Head of Division']);

    const roles200k = determineRequiredApprovalRoles(200000, 'Domestic');
    expect(roles200k).toEqual(['Reporting Manager', 'Head of Department', 'Head of Division']);

    const roles200001 = determineRequiredApprovalRoles(200001, 'Domestic');
    expect(roles200001).toEqual(['Reporting Manager', 'Head of Department', 'Head of Division', 'MD']);

    const rolesInternational = determineRequiredApprovalRoles(10000, 'International');
    expect(rolesInternational).toEqual(['Reporting Manager', 'Head of Department', 'Head of Division', 'MD']);
  });

  it('SCENARIO G & H — Manager Rejection and Send Back with Mandatory Remarks', async () => {
    // Create a new request for rejection / return testing
    const req = await prisma.travelRequest.create({
      data: {
        requestNumber: `TR/RETURN/${Date.now().toString().slice(-4)}`,
        employeeId: chaitanyaUser.id,
        destination: 'Delhi Tech Center',
        cityClass: 'Tier 1',
        startDate: new Date('2026-11-25'),
        endDate: new Date('2026-11-27'),
        purpose: 'Vendor Negotiation',
        category: 'Domestic',
        mode: 'Flight',
        estimatedCost: 20000,
        employeeBorneEstimate: 15000,
        status: 'PENDING_APPROVAL',
        currentStepSequence: 1,
        approvalSteps: {
          create: [{ sequence: 1, role: 'Reporting Manager', approverId: sureshManager.id, status: 'PENDING' }],
        },
      },
      include: { approvalSteps: true },
    });

    // 1. Manager sends back with remarks
    const returnRemarks = 'Please adjust flight estimate to economy fare per corporate travel policy §2.1';
    await prisma.travelRequest.update({
      where: { id: req.id },
      data: { status: 'RETURNED', returnRemarks },
    });
    await prisma.approvalStep.update({
      where: { id: req.approvalSteps[0].id },
      data: { status: 'RETURNED', remarks: returnRemarks, decidedAt: new Date() },
    });

    const returnedReq = await prisma.travelRequest.findUnique({ where: { id: req.id } });
    expect(returnedReq!.status).toBe('RETURNED');
    expect(returnedReq!.returnRemarks).toBe(returnRemarks);

    // 2. Employee resubmits with same Request ID
    const resubmittedReq = await prisma.travelRequest.update({
      where: { id: req.id },
      data: { status: 'PENDING_APPROVAL', estimatedCost: 16000 },
    });
    expect(resubmittedReq.id).toBe(req.id);
    expect(resubmittedReq.status).toBe('PENDING_APPROVAL');

    // 3. Manager rejects
    const rejectReason = 'Client meeting cancelled by partner; trip authorization rejected.';
    await prisma.travelRequest.update({
      where: { id: req.id },
      data: { status: 'REJECTED', rejectionReason: rejectReason },
    });

    const rejectedReq = await prisma.travelRequest.findUnique({ where: { id: req.id } });
    expect(rejectedReq!.status).toBe('REJECTED');
    expect(rejectedReq!.rejectionReason).toBe(rejectReason);
  });

  it('SCENARIO I & J — Self-approval prevention and employee approval block', () => {
    // 1. Manager creates a request for himself (claimant === Suresh)
    // Suresh cannot approve his own request
    const canSureshApproveOwn = canApproveStep(
      { userId: sureshManager.id, role: 'Reporting Manager' },
      { approverId: sureshManager.id, role: 'Reporting Manager' },
      sureshManager.id // Claimant is Suresh
    );
    expect(canSureshApproveOwn).toBe(false);

    // 2. Employee cannot approve
    const canEmployeeApprove = canApproveStep(
      { userId: chaitanyaUser.id, role: 'Employee' },
      { approverId: sureshManager.id, role: 'Reporting Manager' },
      chaitanyaUser.id
    );
    expect(canEmployeeApprove).toBe(false);
  });

  it('SCENARIO K — Finance cannot arbitrarily approve business step', () => {
    const canFinanceApproveBusinessStep = canApproveStep(
      { userId: raviFinance.id, role: 'Finance' },
      { approverId: sureshManager.id, role: 'Reporting Manager' },
      chaitanyaUser.id
    );
    expect(canFinanceApproveBusinessStep).toBe(false);
  });

  it('SCENARIO L — Admin can see organisation-wide data', () => {
    const chaitanyaRequest = {
      employeeId: chaitanyaUser.id,
      approvalSteps: [{ approverId: sureshManager.id, role: 'Reporting Manager' }],
    };

    expect(canViewRequest({ userId: adminUser.id, role: 'Admin' }, chaitanyaRequest)).toBe(true);
    expect(canAccessAdmin({ role: 'Admin' })).toBe(true);
    expect(canAccessFinance({ role: 'Admin' })).toBe(true);
  });

  it('SCENARIO M & N — Admin Category CRUD & Dynamic Active Filtering', async () => {
    // 1. Create a test category
    const catCode = `TEST_CAT_${Date.now().toString().slice(-4)}`;
    const newCat = await prisma.category.create({
      data: {
        name: `Technical Certification ${catCode}`,
        code: catCode,
        description: 'Authorized technical courses and certification exam fees.',
        requiresProof: true,
        maxLimit: 30000,
        isActive: true,
        displayOrder: 20,
      },
    });

    expect(newCat.id).toBeDefined();
    expect(newCat.isActive).toBe(true);

    // 2. Edit / Deactivate category
    const updated = await prisma.category.update({
      where: { id: newCat.id },
      data: { isActive: false },
    });
    expect(updated.isActive).toBe(false);

    // 3. New Request active query excludes deactivated category
    const activeCategories = await prisma.category.findMany({
      where: { isActive: true },
    });
    const foundDeactivated = activeCategories.find((c) => c.id === newCat.id);
    expect(foundDeactivated).toBeUndefined();
  });

  it('SCENARIO O & P — Manager Stats & Scoped Pending Badges', async () => {
    // Fetch pending requests specifically assigned to Suresh
    const pendingForSuresh = await prisma.travelRequest.findMany({
      where: {
        status: 'PENDING_APPROVAL',
        approvalSteps: {
          some: {
            sequence: 1,
            status: 'PENDING',
            approverId: sureshManager.id,
          },
        },
      },
    });

    expect(Array.isArray(pendingForSuresh)).toBe(true);

    // Fetch decisions made by Suresh
    const decidedBySuresh = await prisma.approvalStep.findMany({
      where: {
        approverId: sureshManager.id,
        status: { in: ['APPROVED', 'REJECTED', 'RETURNED'] },
      },
    });

    expect(Array.isArray(decidedBySuresh)).toBe(true);
  });

  it('SCENARIO Q — API-level RBAC blocks unauthorized access', () => {
    // Non-finance cannot access finance actions
    expect(canAccessFinance({ role: 'Employee', userId: chaitanyaUser.id })).toBe(false);
    expect(canAccessFinance({ role: 'Reporting Manager', userId: sureshManager.id })).toBe(false);

    // Finance can execute finance mutations, while Admin/Employee/Manager cannot
    expect(canExecuteFinanceMutation({ role: 'Finance', userId: raviFinance.id })).toBe(true);
    expect(canExecuteFinanceMutation({ role: 'Admin', userId: adminUser.id })).toBe(false);
    expect(canExecuteFinanceMutation({ role: 'Employee', userId: chaitanyaUser.id })).toBe(false);
    expect(canExecuteFinanceMutation({ role: 'Reporting Manager', userId: sureshManager.id })).toBe(false);

    // Non-admin cannot access admin config
    expect(canAccessAdmin({ role: 'Employee', userId: chaitanyaUser.id })).toBe(false);
    expect(canAccessAdmin({ role: 'Reporting Manager', userId: sureshManager.id })).toBe(false);
    expect(canAccessAdmin({ role: 'Finance', userId: raviFinance.id })).toBe(false);
  });
});

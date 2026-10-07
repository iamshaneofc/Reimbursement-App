import { describe, it, expect } from 'vitest';
import { signSessionToken, verifySessionToken } from '@/lib/auth/jwt';
import { canApproveStep, canViewRequest, canAccessFinance, canExecuteFinanceMutation, canAccessAdmin } from '@/lib/auth/rbac';

describe('RBAC & Security Token Tests', () => {
  it('1. JWT Session Token correctly encapsulates role and cannot be forged without secret', async () => {
    const employeePayload = {
      userId: 'user-chaitanya',
      empCode: 'NX-4471',
      name: 'Chaitanya Reddy',
      email: 'chaitanya.reddy@nortexindustries.com',
      role: 'Employee',
      department: 'Sales',
      costCentre: 'CE110',
    };

    const token = await signSessionToken(employeePayload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe('user-chaitanya');
    expect(verified?.role).toBe('Employee');

    // Invalid/tampered token fails verification
    const tamperedToken = token.slice(0, -5) + 'abcde';
    const tamperedResult = await verifySessionToken(tamperedToken);
    expect(tamperedResult).toBeNull();
  });

  it('2. Employee cannot perform Manager Approval actions', () => {
    const isAllowed = canApproveStep(
      { role: 'Employee', userId: 'user-chaitanya' },
      { approverId: 'user-suresh', role: 'Reporting Manager' },
      'user-chaitanya' // Claimant is Chaitanya
    );
    expect(isAllowed).toBe(false);
  });

  it('3. Claimant cannot self-approve even if they hold management role', () => {
    const isAllowed = canApproveStep(
      { role: 'Reporting Manager', userId: 'user-suresh' },
      { approverId: 'user-suresh', role: 'Reporting Manager' },
      'user-suresh' // Claimant is Suresh himself
    );
    expect(isAllowed).toBe(false);
  });

  it('4. Assigned Reporting Manager can approve Level 1 Step', () => {
    const isAllowed = canApproveStep(
      { role: 'Reporting Manager', userId: 'user-suresh' },
      { approverId: 'user-suresh', role: 'Reporting Manager' },
      'user-chaitanya' // Claimant is Chaitanya
    );
    expect(isAllowed).toBe(true);
  });

  it('5. Unassigned manager cannot approve another manager step', () => {
    const isAllowed = canApproveStep(
      { role: 'Reporting Manager', userId: 'user-other-manager' },
      { approverId: 'user-suresh', role: 'Reporting Manager' },
      'user-chaitanya'
    );
    expect(isAllowed).toBe(false);
  });

  it('6. Employee request visibility scoping: own request allowed, unrelated employee forbidden', () => {
    const chaitanyaRequest = {
      employeeId: 'user-chaitanya',
      approvalSteps: [{ approverId: 'user-suresh', role: 'Reporting Manager' }],
    };

    // Chaitanya views own request -> Allowed
    expect(canViewRequest({ role: 'Employee', userId: 'user-chaitanya' }, chaitanyaRequest)).toBe(true);

    // Deepa (unrelated employee) views Chaitanya's request -> Forbidden
    expect(canViewRequest({ role: 'Employee', userId: 'user-deepa' }, chaitanyaRequest)).toBe(false);
  });

  it('7. Manager request visibility scoping: own request allowed, assigned claim allowed, unrelated claim forbidden', () => {
    const chaitanyaRequest = {
      employeeId: 'user-chaitanya',
      approvalSteps: [{ approverId: 'user-suresh', role: 'Reporting Manager' }],
    };

    // Suresh (assigned RM) views Chaitanya's request -> Allowed
    expect(canViewRequest({ role: 'Reporting Manager', userId: 'user-suresh' }, chaitanyaRequest)).toBe(true);

    // Suresh views his own request -> Allowed
    const sureshOwnRequest = {
      employeeId: 'user-suresh',
      approvalSteps: [{ approverId: 'user-meera', role: 'Head of Department' }],
    };
    expect(canViewRequest({ role: 'Reporting Manager', userId: 'user-suresh' }, sureshOwnRequest)).toBe(true);

    // Unrelated manager (e.g. from another division) views Chaitanya's request -> Forbidden
    expect(canViewRequest({ role: 'Reporting Manager', userId: 'user-unrelated-mgr' }, chaitanyaRequest)).toBe(false);
  });

  it('8. Finance & Admin org-wide read visibility & mutation separation', () => {
    const chaitanyaRequest = {
      employeeId: 'user-chaitanya',
      approvalSteps: [{ approverId: 'user-suresh', role: 'Reporting Manager' }],
    };

    // Finance can view claim for audit/payout review AND execute financial mutations
    expect(canViewRequest({ role: 'Finance', userId: 'user-ravi' }, chaitanyaRequest)).toBe(true);
    expect(canAccessFinance({ role: 'Finance' })).toBe(true);
    expect(canExecuteFinanceMutation({ role: 'Finance' })).toBe(true);
    expect(canAccessAdmin({ role: 'Finance' })).toBe(false);

    // Admin has org-wide read and admin config access, but CANNOT execute financial mutations
    expect(canViewRequest({ role: 'Admin', userId: 'user-admin' }, chaitanyaRequest)).toBe(true);
    expect(canAccessAdmin({ role: 'Admin' })).toBe(true);
    expect(canAccessFinance({ role: 'Admin' })).toBe(true); // Read access to queue
    expect(canExecuteFinanceMutation({ role: 'Admin' })).toBe(false); // Mutations strictly forbidden for Admin

    // Employee & Manager cannot execute finance mutations
    expect(canExecuteFinanceMutation({ role: 'Employee' })).toBe(false);
    expect(canExecuteFinanceMutation({ role: 'Reporting Manager' })).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { signSessionToken, verifySessionToken } from '@/lib/auth/jwt';
import { canApproveStep, canAccessFinance } from '@/lib/auth/rbac';

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
      { role: 'Head of Department', userId: 'user-meera' },
      { approverId: 'user-meera', role: 'Head of Department' },
      'user-meera' // Claimant is Meera
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
      { role: 'Reporting Manager', userId: 'user-other' },
      { approverId: 'user-suresh', role: 'Reporting Manager' },
      'user-chaitanya'
    );
    expect(isAllowed).toBe(false);
  });

  it('6. Employee cannot access Finance Console or Actions', () => {
    expect(canAccessFinance({ role: 'Employee' })).toBe(false);
    expect(canAccessFinance({ role: 'Reporting Manager' })).toBe(false);
    expect(canAccessFinance({ role: 'Head of Department' })).toBe(false);
    expect(canAccessFinance({ role: 'Finance' })).toBe(true);
    expect(canAccessFinance({ role: 'Admin' })).toBe(true);
  });
});

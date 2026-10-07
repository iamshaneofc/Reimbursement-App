import { describe, it, expect } from 'vitest';
import {
  determineRequiredApprovalRoles,
  buildApprovalSteps,
  isValidStatusTransition,
} from '@/lib/workflow/workflowEngine';

describe('Workflow Engine - Unit Tests', () => {
  it('15. <= ₹25,000 requires Reporting Manager only', () => {
    const roles = determineRequiredApprovalRoles(25000, 'Domestic');
    expect(roles).toEqual(['Reporting Manager']);
  });

  it('16. ₹25,001 requires Reporting Manager + Head of Department', () => {
    const roles = determineRequiredApprovalRoles(25001, 'Domestic');
    expect(roles).toEqual(['Reporting Manager', 'Head of Department']);
  });

  it('17. ₹75,000 requires Reporting Manager + Head of Department', () => {
    const roles = determineRequiredApprovalRoles(75000, 'Domestic');
    expect(roles).toEqual(['Reporting Manager', 'Head of Department']);
  });

  it('18. ₹75,001 requires Reporting Manager + Head of Department + Head of Division', () => {
    const roles = determineRequiredApprovalRoles(75001, 'Domestic');
    expect(roles).toEqual(['Reporting Manager', 'Head of Department', 'Head of Division']);
  });

  it('19. ₹2,00,000 requires Reporting Manager + Head of Department + Head of Division', () => {
    const roles = determineRequiredApprovalRoles(200000, 'Domestic');
    expect(roles).toEqual(['Reporting Manager', 'Head of Department', 'Head of Division']);
  });

  it('20. > ₹2,00,000 requires all four levels including MD/CEO', () => {
    const roles = determineRequiredApprovalRoles(200001, 'Domestic');
    expect(roles).toEqual(['Reporting Manager', 'Head of Department', 'Head of Division', 'MD']);
  });

  it('21. International travel requires MD/CEO regardless of amount', () => {
    const roles = determineRequiredApprovalRoles(15000, 'International');
    expect(roles).toEqual(['Reporting Manager', 'Head of Department', 'Head of Division', 'MD']);
  });

  it('22. Self-approval is prevented and skipped', () => {
    // Meera Krishnan (HOD) submits a request for 50,000 (which normally requires RM + HOD)
    const claimantMeera = {
      id: 'meera-id',
      empCode: 'NX-1108',
      role: 'Head of Department',
      reportingManager: {
        id: 'arvind-id',
        empCode: 'NX-1002',
        role: 'Head of Division',
        reportingManager: {
          id: 'nandita-id',
          empCode: 'NX-1000',
          role: 'MD',
        },
      },
    };

    const steps = buildApprovalSteps(claimantMeera, 50000, 'Domestic');
    // Step 1: Reporting Manager (Arvind) -> PENDING
    // Step 2: HOD (Meera herself) -> SKIPPED
    expect(steps[0].status).toBe('PENDING');
    expect(steps[0].approverId).toBe('arvind-id');
    expect(steps[1].role).toBe('Head of Department');
    expect(steps[1].status).toBe('SKIPPED');
  });

  it('22b. Reporting Manager submitting request skips self and routes to HOD', () => {
    // Suresh Iyer (Reporting Manager) submits a request for 15,000 (which normally requires RM only)
    const claimantSuresh = {
      id: 'suresh-id',
      empCode: 'NX-2210',
      role: 'Reporting Manager',
      reportingManager: {
        id: 'meera-id',
        empCode: 'NX-1108',
        role: 'Head of Department',
        reportingManager: {
          id: 'arvind-id',
          empCode: 'NX-1002',
          role: 'Head of Division',
        },
      },
    };

    const steps15k = buildApprovalSteps(claimantSuresh, 15000, 'Domestic');
    // Step 1: Reporting Manager (Suresh himself) -> SKIPPED
    // Step 2: Next approver up hierarchy -> HOD (Meera) -> PENDING
    expect(steps15k[0].status).toBe('SKIPPED');
    expect(steps15k[0].approverId).toBe('suresh-id');
    expect(steps15k[1].status).toBe('PENDING');
    expect(steps15k[1].approverId).toBe('meera-id');
    expect(steps15k[1].role).toBe('Head of Department');

    // Suresh submits 50,000 (requires RM + HOD)
    const steps50k = buildApprovalSteps(claimantSuresh, 50000, 'Domestic');
    expect(steps50k[0].status).toBe('SKIPPED');
    expect(steps50k[1].status).toBe('PENDING');
    expect(steps50k[1].approverId).toBe('meera-id');
  });

  it('23-26. Workflow State Machine Validations', () => {
    // Valid transitions
    expect(isValidStatusTransition('DRAFT', 'SUBMITTED')).toBe(true);
    expect(isValidStatusTransition('SUBMITTED', 'PENDING_APPROVAL')).toBe(true);
    expect(isValidStatusTransition('PENDING_APPROVAL', 'APPROVED')).toBe(true);
    expect(isValidStatusTransition('PENDING_APPROVAL', 'RETURNED')).toBe(true);
    expect(isValidStatusTransition('PENDING_APPROVAL', 'REJECTED')).toBe(true);
    expect(isValidStatusTransition('RETURNED', 'PENDING_APPROVAL')).toBe(true);
    expect(isValidStatusTransition('APPROVED', 'SETTLEMENT_SUBMITTED')).toBe(true);
    expect(isValidStatusTransition('FINANCE_REVIEW', 'PAYMENT_PENDING')).toBe(true);
    expect(isValidStatusTransition('PAYMENT_PENDING', 'PAID')).toBe(true);
    expect(isValidStatusTransition('FINANCE_REVIEW', 'RECOVERY_DUE')).toBe(true);
    expect(isValidStatusTransition('RECOVERY_DUE', 'RECOVERED')).toBe(true);

    // Invalid transitions (must be blocked)
    expect(isValidStatusTransition('PAID', 'SUBMITTED')).toBe(false);
    expect(isValidStatusTransition('REJECTED', 'APPROVED')).toBe(false);
    expect(isValidStatusTransition('DRAFT', 'PAID')).toBe(false);
    expect(isValidStatusTransition('PENDING_APPROVAL', 'PAID')).toBe(false);
  });
});

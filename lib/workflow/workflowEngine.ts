export interface ApprovalRequirement {
  sequence: number;
  role: 'Reporting Manager' | 'Head of Department' | 'Head of Division' | 'MD';
  approverEmpCode?: string;
}

export interface UserHierarchyNode {
  id: string;
  empCode: string;
  name: string;
  role: string;
  reportingManagerId?: string | null;
  reportingManager?: UserHierarchyNode | null;
}

/**
 * Computes the required approval roles based on estimated/claimed cost and travel category
 */
export function determineRequiredApprovalRoles(
  amount: number,
  category: string = 'Domestic'
): Array<'Reporting Manager' | 'Head of Department' | 'Head of Division' | 'MD'> {
  if (category === 'International' || amount > 200000) {
    return ['Reporting Manager', 'Head of Department', 'Head of Division', 'MD'];
  }
  if (amount > 75000) {
    return ['Reporting Manager', 'Head of Department', 'Head of Division'];
  }
  if (amount > 25000) {
    return ['Reporting Manager', 'Head of Department'];
  }
  return ['Reporting Manager'];
}

/**
 * Builds the sequence of approval steps for a specific claimant,
 * correctly skipping self-approvals and navigating the reporting hierarchy.
 */
export function buildApprovalSteps(
  claimant: {
    id: string;
    empCode: string;
    role: string;
    reportingManager?: {
      id: string;
      empCode: string;
      role: string;
      reportingManager?: {
        id: string;
        empCode: string;
        role: string;
        reportingManager?: {
          id: string;
          empCode: string;
          role: string;
        } | null;
      } | null;
    } | null;
  },
  amount: number,
  category: string = 'Domestic'
) {
  const requiredRoles = determineRequiredApprovalRoles(amount, category);
  const steps: Array<{
    sequence: number;
    role: string;
    approverId: string | null;
    status: 'PENDING' | 'SKIPPED';
  }> = [];

  // Traverse hierarchy up from claimant
  const hierarchyChain: Array<{ id: string; empCode: string; role: string }> = [];
  let currentManager = claimant.reportingManager;
  while (currentManager) {
    hierarchyChain.push({
      id: currentManager.id,
      empCode: currentManager.empCode,
      role: currentManager.role,
    });
    currentManager = (currentManager as any).reportingManager;
  }

  let seq = 1;
  for (const role of requiredRoles) {
    // Check if claimant themselves holds this role
    if (claimant.role === role) {
      // Self-approval forbidden: skip this step
      steps.push({
        sequence: seq++,
        role,
        approverId: claimant.id,
        status: 'SKIPPED',
      });
      continue;
    }

    // Find the closest manager up the chain that matches or fulfills this role
    // Role matching priority: exact role match, or first higher manager
    const matchedApprover = hierarchyChain.find((m) => {
      if (role === 'Reporting Manager') return true; // Direct manager
      if (role === 'Head of Department') return m.role === 'Head of Department' || m.role === 'Head of Division' || m.role === 'MD';
      if (role === 'Head of Division') return m.role === 'Head of Division' || m.role === 'MD';
      if (role === 'MD') return m.role === 'MD';
      return false;
    });

    const approverId = matchedApprover ? matchedApprover.id : (hierarchyChain[0]?.id || null);

    // If the approver would be the claimant, skip it
    if (approverId === claimant.id) {
      steps.push({
        sequence: seq++,
        role,
        approverId,
        status: 'SKIPPED',
      });
    } else {
      steps.push({
        sequence: seq++,
        role,
        approverId,
        status: 'PENDING',
      });
    }
  }

  return steps;
}

/**
 * Validates whether a state transition is permitted.
 */
export function isValidStatusTransition(fromStatus: string, toStatus: string): boolean {
  const allowedTransitions: Record<string, string[]> = {
    DRAFT: ['SUBMITTED', 'PENDING_APPROVAL'],
    SUBMITTED: ['PENDING_APPROVAL', 'APPROVED', 'RETURNED', 'REJECTED'],
    PENDING_APPROVAL: ['PENDING_APPROVAL', 'APPROVED', 'RETURNED', 'REJECTED'],
    APPROVED: ['SETTLEMENT_DRAFT', 'SETTLEMENT_SUBMITTED', 'FINANCE_REVIEW'],
    RETURNED: ['PENDING_APPROVAL', 'SUBMITTED', 'SETTLEMENT_SUBMITTED', 'FINANCE_REVIEW'],
    REJECTED: [], // Terminal
    SETTLEMENT_DRAFT: ['SETTLEMENT_SUBMITTED', 'FINANCE_REVIEW'],
    SETTLEMENT_SUBMITTED: ['FINANCE_REVIEW', 'RETURNED'],
    FINANCE_REVIEW: ['PAYMENT_PENDING', 'RECOVERY_DUE', 'PAID', 'RECOVERED', 'RETURNED'],
    PAYMENT_PENDING: ['PAID'],
    RECOVERY_DUE: ['RECOVERED'],
    PAID: [], // Terminal
    RECOVERED: [], // Terminal
  };

  const allowed = allowedTransitions[fromStatus] || [];
  return allowed.includes(toStatus);
}

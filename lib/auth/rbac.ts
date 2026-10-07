export interface SessionUser {
  userId?: string;
  role: string;
}

export interface ApprovalStepTarget {
  approverId?: string | null;
  role: string;
}

export interface RequestTarget {
  employeeId: string;
  approvalSteps?: Array<{
    approverId?: string | null;
    role?: string;
  }>;
}

/**
 * Checks if a session user is authorized to approve, reject, or return an approval step.
 * - Self-approval is strictly forbidden (returns false).
 * - If step has a designated approverId, only that exact user can approve.
 * - If step has only a role designation, user must hold that exact role.
 * - Admins do NOT bypass manager business approvals unless explicitly assigned.
 */
export function canApproveStep(
  user: SessionUser,
  step: ApprovalStepTarget,
  claimantId: string
): boolean {
  // 1. Self-approval is strictly prohibited
  if (user.userId && user.userId === claimantId) {
    return false;
  }

  // 2. Admin is an organisation/platform oversight role and has no business approval authority
  if (user.role === 'Admin') {
    return false;
  }

  // 3. If directly assigned to a specific manager ID, only that manager can act
  if (step.approverId) {
    return user.userId === step.approverId;
  }

  // 4. Fallback to role-level matching if no specific approverId is bound
  const managementRoles = ['Reporting Manager', 'Head of Department', 'Head of Division', 'MD', 'Manager'];
  if (!managementRoles.includes(user.role)) {
    return false;
  }

  return step.role === user.role;
}

/**
 * Checks if a session user has permission to view a travel request details and evidence.
 * - Claimant can always view their own request.
 * - Admin has organisation-wide read visibility.
 * - Finance has organisation-wide read visibility for financial auditing and settlement review.
 * - Managers can view if they are assigned anywhere in the approval chain.
 * - Unrelated employees and unrelated managers are strictly forbidden (403).
 */
export function canViewRequest(
  user: SessionUser,
  request: RequestTarget
): boolean {
  // 1. Claimant can always view their own request
  if (user.userId && user.userId === request.employeeId) {
    return true;
  }

  // 2. Admin has org-wide read visibility
  if (user.role === 'Admin') {
    return true;
  }

  // 3. Finance has org-wide read visibility
  if (user.role === 'Finance') {
    return true;
  }

  // 4. Managers assigned in the approval chain can view
  if (request.approvalSteps && user.userId) {
    const isInChain = request.approvalSteps.some(
      (s) => s.approverId === user.userId
    );
    if (isInChain) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a user has read access to the finance queue and reports
 */
export function canAccessFinance(user: SessionUser): boolean {
  return ['Finance', 'Admin'].includes(user.role);
}

/**
 * Checks if a user has authority to execute financial mutations
 * (settlement verification, payment release, payroll recovery).
 * Strictly requires Finance role per corporate governance.
 */
export function canExecuteFinanceMutation(user: SessionUser): boolean {
  return user.role === 'Finance';
}

/**
 * Checks if a user has access to admin configuration (categories, org oversight)
 */
export function canAccessAdmin(user: SessionUser): boolean {
  return user.role === 'Admin';
}

/**
 * Checks if a user can edit / submit expenses on a travel claim
 */
export function canEditSettlement(
  user: SessionUser,
  claimantId: string,
  requestStatus: string
): boolean {
  const isOwner = user.userId === claimantId;
  const editableStatuses = ['APPROVED', 'SETTLEMENT_DRAFT', 'RETURNED'];
  return isOwner && editableStatuses.includes(requestStatus);
}

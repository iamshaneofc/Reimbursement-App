export interface SessionUser {
  userId?: string;
  role: string;
}

export interface ApprovalStepTarget {
  approverId?: string | null;
  role: string;
}

/**
 * Checks if a session user is authorized to approve a given approval step
 */
export function canApproveStep(
  user: SessionUser,
  step: ApprovalStepTarget,
  claimantId: string
): boolean {
  // Self-approval is strictly prohibited
  if (user.userId && user.userId === claimantId) {
    return false;
  }

  // Admin has global governance override
  if (user.role === 'Admin') {
    return true;
  }

  // Non-management cannot approve
  const managementRoles = ['Reporting Manager', 'Head of Department', 'Head of Division', 'MD'];
  if (!managementRoles.includes(user.role)) {
    return false;
  }

  // If directly assigned to a specific manager ID, only that manager can approve
  if (step.approverId) {
    return user.userId === step.approverId;
  }

  // If no specific approverId assigned, match by required role
  return step.role === user.role;
}

/**
 * Checks if a user has access to finance actions
 */
export function canAccessFinance(user: SessionUser): boolean {
  return ['Finance', 'Admin'].includes(user.role);
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

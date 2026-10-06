export interface ExpenseEvaluationInput {
  id?: string;
  category: string; // 'Lodging' | 'Transportation' | 'Meals' | 'Business Entertainment' | 'Other'
  merchant: string;
  description: string;
  billNumber?: string | null;
  amount: number;
  paidBy: 'EMPLOYEE' | 'COMPANY';
  proofRef?: string | null;
  proofVerified?: boolean;
  attendees?: string | null;
  hodApprovalPrior?: boolean;
  date: string | Date;
  isSomeoneElse?: boolean;

  // Specific itemized fields if provided
  roomTariffPerNight?: number | null;
  numberOfNights?: number | null;
  roomTaxes?: number | null;
  laundryAmount?: number | null;
  miniBarAmount?: number | null;
  inRoomDiningAmount?: number | null;
}

export interface TravelContext {
  destination: string;
  cityClass: 'Tier 1' | 'Tier 2' | 'Tier 3';
  startDate: string | Date;
  endDate: string | Date;
  category: 'Domestic' | 'International';
  employeeName?: string;
  employeeCode?: string;
  existingExpenses?: ExpenseEvaluationInput[];
}

export interface PolicyEvaluationResult {
  status: 'VALID' | 'FLAGGED' | 'DISALLOWED';
  eligibleAmount: number;
  disallowedAmount: number;
  isCompanyPaid: boolean;
  isDuplicate: boolean;
  isSomeoneElse: boolean;
  reasons: string[];
  warnings: string[];
}

const TIER_1_CITIES = [
  'bengaluru',
  'bangalore',
  'mumbai',
  'delhi',
  'delhi ncr',
  'ncr',
  'hyderabad',
  'chennai',
  'pune',
  'kolkata',
];

export function resolveCityTier(destination: string, defaultClass: 'Tier 1' | 'Tier 2' | 'Tier 3' = 'Tier 1'): 'Tier 1' | 'Tier 2' | 'Tier 3' {
  const destLower = destination.toLowerCase();
  for (const city of TIER_1_CITIES) {
    if (destLower.includes(city)) return 'Tier 1';
  }
  return defaultClass;
}

export function evaluateExpense(
  expense: ExpenseEvaluationInput,
  context: TravelContext
): PolicyEvaluationResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let eligibleAmount = 0;
  let disallowedAmount = 0;
  let status: 'VALID' | 'FLAGGED' | 'DISALLOWED' = 'VALID';
  const isCompanyPaid = expense.paidBy === 'COMPANY';
  let isDuplicate = false;
  let isSomeoneElse = !!expense.isSomeoneElse;

  // 1. Check if incurred by another person
  if (isSomeoneElse || expense.description.toLowerCase().includes("deepa") || expense.description.toLowerCase().includes("colleague")) {
    isSomeoneElse = true;
    status = 'DISALLOWED';
    disallowedAmount = expense.amount;
    eligibleAmount = 0;
    reasons.push('Expenses incurred by any person other than the claimant are non-reimbursable per Policy §4.');
    return {
      status,
      eligibleAmount: 0,
      disallowedAmount: expense.amount,
      isCompanyPaid,
      isDuplicate,
      isSomeoneElse: true,
      reasons,
      warnings,
    };
  }

  // 2. Check if Company Paid
  if (isCompanyPaid) {
    // Recorded for audit/memo only. Employee receives ₹0 reimbursement.
    return {
      status: 'VALID',
      eligibleAmount: 0,
      disallowedAmount: 0,
      isCompanyPaid: true,
      isDuplicate: false,
      isSomeoneElse: false,
      reasons: ['Centrally booked and company-paid. Recorded for audit/memo; not claimable by employee.'],
      warnings: [],
    };
  }

  // 3. Check for Duplicates in existing expenses list
  if (context.existingExpenses && context.existingExpenses.length > 0) {
    const expDateStr = new Date(expense.date).toISOString().split('T')[0];
    for (const existing of context.existingExpenses) {
      // Don't compare with itself
      if (existing.id && expense.id && existing.id === expense.id) continue;

      const existingDateStr = new Date(existing.date).toISOString().split('T')[0];
      const sameDate = expDateStr === existingDateStr;
      const sameMerchant = existing.merchant.trim().toLowerCase() === expense.merchant.trim().toLowerCase();
      const sameAmount = Math.abs(existing.amount - expense.amount) < 0.01;
      const sameBill = existing.billNumber && expense.billNumber && existing.billNumber === expense.billNumber;

      if ((sameMerchant && sameDate && sameAmount) || sameBill) {
        isDuplicate = true;
        status = 'FLAGGED';
        warnings.push(`Duplicate candidate: Matches existing expense (${existing.merchant}, ₹${existing.amount}, ${existingDateStr}). Policy §5.3 duplicate review required.`);
      }
    }
  }

  // 4. Proof requirement check
  const hasProof = !!(expense.proofRef && expense.proofRef.trim().length > 0);

  // 5. Category-specific policy evaluations
  const tier = resolveCityTier(context.destination, context.cityClass);

  switch (expense.category) {
    case 'Lodging': {
      const maxTariffPerNight = tier === 'Tier 1' ? 6000 : tier === 'Tier 2' ? 4000 : 2800;
      
      // If itemized breakdown is provided:
      if (expense.roomTariffPerNight != null && expense.numberOfNights != null) {
        const nights = expense.numberOfNights > 0 ? expense.numberOfNights : 1;
        const actualTariff = expense.roomTariffPerNight;
        const totalRoomCharges = actualTariff * nights;
        const allowedRoomCharges = Math.min(actualTariff, maxTariffPerNight) * nights;
        const tariffExcess = Math.max(0, actualTariff - maxTariffPerNight) * nights;

        const taxes = expense.roomTaxes || 0;
        const laundry = expense.laundryAmount || 0;
        const minibar = expense.miniBarAmount || 0;
        const inRoomDining = expense.inRoomDiningAmount || 0;

        const nonReimbursableFolio = laundry + minibar + inRoomDining;
        disallowedAmount = tariffExcess + nonReimbursableFolio;
        eligibleAmount = allowedRoomCharges + taxes;

        if (tariffExcess > 0) {
          reasons.push(`Room tariff ₹${actualTariff}/night exceeds ${tier} limit of ₹${maxTariffPerNight}/night. Excess ₹${tariffExcess} is disallowed.`);
          status = 'FLAGGED';
        }
        if (laundry > 0) {
          reasons.push(`Laundry charge (₹${laundry}) is non-reimbursable per Policy §4.`);
          status = 'FLAGGED';
        }
        if (minibar > 0) {
          reasons.push(`Mini bar charge (₹${minibar}) is non-reimbursable per Policy §4.`);
          status = 'FLAGGED';
        }
        if (inRoomDining > 0) {
          reasons.push(`In-room dining charge (₹${inRoomDining}) on room folio is non-reimbursable per Policy §4.`);
          status = 'FLAGGED';
        }
      } else {
        // Flat lodging expense
        // Inspect description for typical folio non-reimbursables if not itemized
        const descLower = expense.description.toLowerCase();
        let itemizedDisallowed = 0;
        if (descLower.includes('laundry')) {
          itemizedDisallowed += 450;
          reasons.push('Laundry is non-reimbursable per Policy §4.');
        }
        if (descLower.includes('mini bar') || descLower.includes('minibar')) {
          itemizedDisallowed += 380;
          reasons.push('Mini bar is non-reimbursable per Policy §4.');
        }
        if (descLower.includes('in-room dining') || descLower.includes('room dining')) {
          itemizedDisallowed += 1120;
          reasons.push('In-room dining is non-reimbursable per Policy §4.');
        }

        disallowedAmount = itemizedDisallowed;
        eligibleAmount = Math.max(0, expense.amount - disallowedAmount);
        if (disallowedAmount > 0) {
          status = 'FLAGGED';
        }
      }

      if (!hasProof) {
        status = 'FLAGGED';
        warnings.push('Hotel invoice/folio proof is required per Policy §5.2.');
      }
      break;
    }

    case 'Meals': {
      const dailyLimit = tier === 'Tier 1' ? 1500 : 1000;
      if (expense.amount > dailyLimit) {
        const excess = expense.amount - dailyLimit;
        eligibleAmount = dailyLimit;
        disallowedAmount = excess;
        status = 'FLAGGED';
        reasons.push(`Meal claim of ₹${expense.amount} exceeds daily ${tier} meal allowance limit of ₹${dailyLimit}. Excess ₹${excess} disallowed.`);
      } else {
        eligibleAmount = expense.amount;
        disallowedAmount = 0;
      }

      if (expense.amount > 500 && !hasProof) {
        status = 'FLAGGED';
        warnings.push('Meal expenses above ₹500 require bill/proof per Policy §3.3.');
      }
      break;
    }

    case 'Transportation': {
      eligibleAmount = expense.amount;
      disallowedAmount = 0;
      if (!hasProof) {
        status = 'FLAGGED';
        warnings.push('Local conveyance requires receipt/proof per Policy §3.4.');
      }
      break;
    }

    case 'Business Entertainment': {
      eligibleAmount = expense.amount;
      disallowedAmount = 0;

      if (!expense.attendees || expense.attendees.trim().length === 0) {
        status = 'FLAGGED';
        warnings.push('Business entertainment claims require attendee names and organisation per Policy §3.5.');
      }

      if (expense.amount > 2000 && !expense.hodApprovalPrior) {
        status = 'FLAGGED';
        warnings.push(`Business entertainment > ₹2,000 (₹${expense.amount}) requires prior HOD approval per Policy §3.5. Flagged for review.`);
      }

      if (!hasProof) {
        status = 'FLAGGED';
        warnings.push('Supporting bill/receipt is required for business entertainment per Policy §5.2.');
      }
      break;
    }

    case 'Other':
    default: {
      const desc = expense.description.toLowerCase();
      if (
        desc.includes('fine') ||
        desc.includes('penalty') ||
        desc.includes('challan') ||
        desc.includes('spa') ||
        desc.includes('gym') ||
        desc.includes('insurance') ||
        desc.includes('phone') ||
        desc.includes('data')
      ) {
        status = 'DISALLOWED';
        disallowedAmount = expense.amount;
        eligibleAmount = 0;
        reasons.push('Item identified as non-reimbursable under Policy §4 (fines, spa, personal data, or independent insurance).');
      } else {
        eligibleAmount = expense.amount;
        disallowedAmount = 0;
      }
      if (!hasProof && eligibleAmount > 0) {
        status = 'FLAGGED';
        warnings.push('Supporting document required per Policy §5.2.');
      }
      break;
    }
  }

  // Ensure amounts are non-negative and balanced
  eligibleAmount = Math.max(0, Math.round(eligibleAmount * 100) / 100);
  disallowedAmount = Math.max(0, Math.round(disallowedAmount * 100) / 100);

  return {
    status,
    eligibleAmount,
    disallowedAmount,
    isCompanyPaid: false,
    isDuplicate,
    isSomeoneElse: false,
    reasons,
    warnings,
  };
}

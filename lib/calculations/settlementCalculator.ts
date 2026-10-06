export interface ExpenseCalculationItem {
  id?: string;
  amount: number;
  paidBy: string; // 'EMPLOYEE' | 'COMPANY'
  eligibleAmount: number;
  disallowedAmount: number;
  isSomeoneElse?: boolean;
}

export interface SettlementSummary {
  totalClaimed: number;
  companyPaidTotal: number;
  employeePaidTotal: number;
  disallowedTotal: number;
  eligibleTotal: number;
  advanceDisbursed: number;
  netPayableAmount: number;
  netRecoverableAmount: number;
  settlementType: 'PAYABLE' | 'RECOVERY' | 'SETTLED';
}

/**
 * Rounds an amount safely to 2 decimal places to prevent floating point inaccuracies.
 */
function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates complete settlement financials server-side from raw expenses and advance.
 */
export function calculateSettlementSummary(
  expenses: ExpenseCalculationItem[],
  advanceDisbursed: number = 0
): SettlementSummary {
  let totalClaimed = 0;
  let companyPaidTotal = 0;
  let employeePaidTotal = 0;
  let disallowedTotal = 0;
  let eligibleTotal = 0;

  for (const exp of expenses) {
    const rawAmt = roundMoney(exp.amount || 0);
    totalClaimed = roundMoney(totalClaimed + rawAmt);

    if (exp.paidBy === 'COMPANY') {
      companyPaidTotal = roundMoney(companyPaidTotal + rawAmt);
    } else {
      employeePaidTotal = roundMoney(employeePaidTotal + rawAmt);
      const dis = roundMoney(exp.disallowedAmount || 0);
      const elig = roundMoney(exp.eligibleAmount || 0);
      disallowedTotal = roundMoney(disallowedTotal + dis);
      eligibleTotal = roundMoney(eligibleTotal + elig);
    }
  }

  const safeAdvance = roundMoney(advanceDisbursed || 0);
  const netBalance = roundMoney(eligibleTotal - safeAdvance);

  let netPayableAmount = 0;
  let netRecoverableAmount = 0;
  let settlementType: 'PAYABLE' | 'RECOVERY' | 'SETTLED' = 'SETTLED';

  if (netBalance > 0) {
    netPayableAmount = netBalance;
    netRecoverableAmount = 0;
    settlementType = 'PAYABLE';
  } else if (netBalance < 0) {
    netPayableAmount = 0;
    netRecoverableAmount = roundMoney(Math.abs(netBalance));
    settlementType = 'RECOVERY';
  } else {
    netPayableAmount = 0;
    netRecoverableAmount = 0;
    settlementType = 'SETTLED';
  }

  return {
    totalClaimed,
    companyPaidTotal,
    employeePaidTotal,
    disallowedTotal,
    eligibleTotal,
    advanceDisbursed: safeAdvance,
    netPayableAmount,
    netRecoverableAmount,
    settlementType,
  };
}

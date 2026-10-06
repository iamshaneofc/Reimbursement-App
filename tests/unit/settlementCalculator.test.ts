import { describe, it, expect } from 'vitest';
import { calculateSettlementSummary } from '@/lib/calculations/settlementCalculator';

describe('Settlement Calculator - Financial Unit Tests', () => {
  it('27-31. Financial calculation on Golden Path Bengaluru trip', () => {
    const expenses = [
      // 1. Company paid flight (Memo only, ₹0 employee reimbursement)
      {
        amount: 10556.0,
        paidBy: 'COMPANY',
        eligibleAmount: 0,
        disallowedAmount: 0,
      },
      // 2. Hotel Folio: Total 21,504 (Room 17,250 + Taxes 2,304 = 19,554 eligible; 1,950 disallowed)
      {
        amount: 21504.0,
        paidBy: 'EMPLOYEE',
        eligibleAmount: 19554.0,
        disallowedAmount: 1950.0,
      },
      // 3. Uber 1 (Pune Baner to PNQ)
      {
        amount: 1415.02,
        paidBy: 'EMPLOYEE',
        eligibleAmount: 1415.02,
        disallowedAmount: 0,
      },
      // 4. Uber 2 (BLR to Hotel)
      {
        amount: 743.0,
        paidBy: 'EMPLOYEE',
        eligibleAmount: 743.0,
        disallowedAmount: 0,
      },
      // 5. Uber 3 (Vertex to Hotel)
      {
        amount: 172.0,
        paidBy: 'EMPLOYEE',
        eligibleAmount: 172.0,
        disallowedAmount: 0,
      },
      // 6. Dinner bill (Business Entertainment)
      {
        amount: 2255.0,
        paidBy: 'EMPLOYEE',
        eligibleAmount: 2255.0,
        disallowedAmount: 0,
      },
      // 7. Return Uber (PNQ to Baner)
      {
        amount: 1229.02,
        paidBy: 'EMPLOYEE',
        eligibleAmount: 1229.02,
        disallowedAmount: 0,
      },
      // 8. Colleague (Deepa Nair) Uber - Disallowed
      {
        amount: 640.0,
        paidBy: 'EMPLOYEE',
        eligibleAmount: 0,
        disallowedAmount: 640.0,
      },
    ];

    const advanceDisbursed = 20000.0;

    const summary = calculateSettlementSummary(expenses, advanceDisbursed);

    // Total employee paid claimed: 21504 + 1415.02 + 743 + 172 + 2255 + 1229.02 + 640 = 27958.04
    expect(summary.employeePaidTotal).toBe(27958.04);
    // Company paid memo: 10556.00
    expect(summary.companyPaidTotal).toBe(10556.0);
    // Disallowed: 1950 (hotel) + 640 (Deepa) = 2590.00
    expect(summary.disallowedTotal).toBe(2590.0);
    // Eligible Total: 19554 + 1415.02 + 743 + 172 + 2255 + 1229.02 = 25368.04
    expect(summary.eligibleTotal).toBe(25368.04);
    // Advance disbursed: 20000.00
    expect(summary.advanceDisbursed).toBe(20000.0);
    // Net Payable: 25368.04 - 20000 = 5368.04
    expect(summary.netPayableAmount).toBe(5368.04);
    // Net Recoverable: must be 0
    expect(summary.netRecoverableAmount).toBe(0);
    expect(summary.settlementType).toBe('PAYABLE');
  });

  it('29-30. Advance Exceeds Eligible Claim -> Recovery Due', () => {
    const expenses = [
      {
        amount: 12000.0,
        paidBy: 'EMPLOYEE',
        eligibleAmount: 12000.0,
        disallowedAmount: 0,
      },
    ];
    const advanceDisbursed = 15000.0;

    const summary = calculateSettlementSummary(expenses, advanceDisbursed);

    expect(summary.eligibleTotal).toBe(12000.0);
    expect(summary.advanceDisbursed).toBe(15000.0);
    expect(summary.netPayableAmount).toBe(0);
    expect(summary.netRecoverableAmount).toBe(3000.0);
    expect(summary.settlementType).toBe('RECOVERY');
  });

  it('31. Payable and Recoverable are strictly mutually exclusive', () => {
    const summary1 = calculateSettlementSummary([], 5000);
    expect(summary1.netPayableAmount === 0 || summary1.netRecoverableAmount === 0).toBe(true);
    expect(summary1.netPayableAmount > 0 && summary1.netRecoverableAmount > 0).toBe(false);

    const summary2 = calculateSettlementSummary([{ amount: 10000, paidBy: 'EMPLOYEE', eligibleAmount: 10000, disallowedAmount: 0 }], 5000);
    expect(summary2.netPayableAmount === 0 || summary2.netRecoverableAmount === 0).toBe(true);
    expect(summary2.netPayableAmount > 0 && summary2.netRecoverableAmount > 0).toBe(false);
  });
});

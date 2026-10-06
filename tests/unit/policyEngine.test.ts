import { describe, it, expect } from 'vitest';
import { evaluateExpense, TravelContext } from '@/lib/policy/policyEngine';

describe('Policy Engine - Unit Tests', () => {
  const defaultContext: TravelContext = {
    destination: 'Bengaluru / Vertex Technologies',
    cityClass: 'Tier 1',
    startDate: '2026-06-16',
    endDate: '2026-06-20',
    category: 'Domestic',
    employeeName: 'Chaitanya Reddy',
    employeeCode: 'NX-4471',
    existingExpenses: [],
  };

  it('1. Tier 1 hotel within limit (<= ₹6,000/night) is fully eligible', () => {
    const result = evaluateExpense(
      {
        category: 'Lodging',
        merchant: 'Keys Prime Hotel',
        description: '3 nights stay',
        amount: 19320,
        paidBy: 'EMPLOYEE',
        proofRef: 'hotel_invoice_1188.png',
        roomTariffPerNight: 5750,
        numberOfNights: 3,
        roomTaxes: 2070,
        date: '2026-06-19',
      },
      defaultContext
    );

    expect(result.status).toBe('VALID');
    expect(result.eligibleAmount).toBe(19320);
    expect(result.disallowedAmount).toBe(0);
  });

  it('2. Tier 1 hotel exceeding limit (> ₹6,000/night) has excess disallowed', () => {
    const result = evaluateExpense(
      {
        category: 'Lodging',
        merchant: 'Luxury Grand Hotel',
        description: '2 nights stay at 6500 per night',
        amount: 15340,
        paidBy: 'EMPLOYEE',
        proofRef: 'folio.pdf',
        roomTariffPerNight: 6500,
        numberOfNights: 2,
        roomTaxes: 2340,
        date: '2026-06-18',
      },
      defaultContext
    );

    // Max allowed tariff: 6000 * 2 = 12000 + 2340 taxes = 14340 eligible. Disallowed: 500 * 2 = 1000.
    expect(result.status).toBe('FLAGGED');
    expect(result.eligibleAmount).toBe(14340);
    expect(result.disallowedAmount).toBe(1000);
    expect(result.reasons.some((r) => r.includes('exceeds Tier 1 limit'))).toBe(true);
  });

  it('3. Taxes on room tariff are fully reimbursable', () => {
    const result = evaluateExpense(
      {
        category: 'Lodging',
        merchant: 'Keys Prime Hotel',
        description: 'Room charges plus GST',
        amount: 19554, // 17250 + 2304 taxes
        paidBy: 'EMPLOYEE',
        proofRef: 'hotel_invoice_1188.png',
        roomTariffPerNight: 5750,
        numberOfNights: 3,
        roomTaxes: 2304,
        date: '2026-06-19',
      },
      defaultContext
    );

    expect(result.eligibleAmount).toBe(19554);
    expect(result.disallowedAmount).toBe(0);
  });

  it('4, 5, 6. Hotel Folio Non-Reimbursables: Laundry (450), Mini Bar (380), In-room dining (1120) are disallowed', () => {
    const result = evaluateExpense(
      {
        category: 'Lodging',
        merchant: 'Keys Prime Whitefield',
        description: 'Tax Invoice with folio breakdown',
        amount: 21504,
        paidBy: 'EMPLOYEE',
        proofRef: 'hotel_invoice_1188.png',
        roomTariffPerNight: 5750,
        numberOfNights: 3,
        roomTaxes: 2304,
        laundryAmount: 450,
        miniBarAmount: 380,
        inRoomDiningAmount: 1120,
        date: '2026-06-19',
      },
      defaultContext
    );

    // Room (17250) + Taxes (2304) = 19554 eligible
    // Disallowed: 450 + 380 + 1120 = 1950 disallowed
    expect(result.status).toBe('FLAGGED');
    expect(result.eligibleAmount).toBe(19554);
    expect(result.disallowedAmount).toBe(1950);
    expect(result.reasons.some((r) => r.includes('Laundry'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('Mini bar'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('In-room dining'))).toBe(true);
  });

  it('7. Meal within limit (<= ₹1,500/day Tier 1) is fully eligible', () => {
    const result = evaluateExpense(
      {
        category: 'Meals',
        merchant: 'Mainland China',
        description: 'Lunch with client rep',
        amount: 850,
        paidBy: 'EMPLOYEE',
        proofRef: 'bill.pdf',
        date: '2026-06-17',
      },
      defaultContext
    );

    expect(result.status).toBe('VALID');
    expect(result.eligibleAmount).toBe(850);
    expect(result.disallowedAmount).toBe(0);
  });

  it('8. Meal exceeding ₹500 without proof triggers a policy warning', () => {
    const result = evaluateExpense(
      {
        category: 'Meals',
        merchant: 'Udipi Cafe',
        description: 'Breakfast & lunch',
        amount: 650,
        paidBy: 'EMPLOYEE',
        proofRef: null,
        date: '2026-06-17',
      },
      defaultContext
    );

    expect(result.status).toBe('FLAGGED');
    expect(result.warnings.some((w) => w.includes('require bill/proof'))).toBe(true);
  });

  it('9. Local conveyance with receipt is eligible on actuals', () => {
    const result = evaluateExpense(
      {
        category: 'Transportation',
        merchant: 'Uber',
        description: 'Baner to Pune Airport PNQ',
        amount: 1415.02,
        paidBy: 'EMPLOYEE',
        proofRef: 'uber_receipt_1.pdf',
        date: '2026-06-16',
      },
      defaultContext
    );

    expect(result.status).toBe('VALID');
    expect(result.eligibleAmount).toBe(1415.02);
    expect(result.disallowedAmount).toBe(0);
  });

  it('10. Business entertainment <= ₹2,000 with attendees is eligible', () => {
    const result = evaluateExpense(
      {
        category: 'Business Entertainment',
        merchant: 'The Black Pearl',
        description: 'Client tea & snacks',
        amount: 1600,
        paidBy: 'EMPLOYEE',
        proofRef: 'receipt.pdf',
        attendees: 'Rahul Sharma (Vertex Tech)',
        hodApprovalPrior: false,
        date: '2026-06-17',
      },
      defaultContext
    );

    expect(result.status).toBe('VALID');
    expect(result.eligibleAmount).toBe(1600);
    expect(result.disallowedAmount).toBe(0);
  });

  it('11. Business entertainment > ₹2,000 without HOD prior approval is flagged', () => {
    const result = evaluateExpense(
      {
        category: 'Business Entertainment',
        merchant: 'Empire Restaurant',
        description: 'Dinner with Vertex procurement team (4 people)',
        amount: 2255,
        paidBy: 'EMPLOYEE',
        proofRef: 'dinner_bill_18jun.png',
        attendees: 'Sanjay, Vinay, Anish (Vertex), Chaitanya (Nortex)',
        hodApprovalPrior: false,
        date: '2026-06-18',
      },
      defaultContext
    );

    expect(result.status).toBe('FLAGGED');
    expect(result.warnings.some((w) => w.includes('prior HOD approval'))).toBe(true);
  });

  it('12. Expense incurred by another person (Deepa Nair) is disallowed', () => {
    const result = evaluateExpense(
      {
        category: 'Transportation',
        merchant: 'Uber',
        description: 'Deepa Nair Chennai trip ride forwarded',
        amount: 640,
        paidBy: 'EMPLOYEE',
        proofRef: 'deepa_uber.eml',
        isSomeoneElse: true,
        date: '2026-05-12',
      },
      defaultContext
    );

    expect(result.status).toBe('DISALLOWED');
    expect(result.eligibleAmount).toBe(0);
    expect(result.disallowedAmount).toBe(640);
    expect(result.reasons.some((r) => r.includes('other than the claimant'))).toBe(true);
  });

  it('13. Company-paid expense is recorded for audit/memo with ₹0 employee reimbursement', () => {
    const result = evaluateExpense(
      {
        category: 'Transportation',
        merchant: 'IndiGo Airlines',
        description: 'Flight tickets Pune-BLR-Pune booked centrally',
        amount: 10556,
        paidBy: 'COMPANY',
        proofRef: 'flight_eticket.pdf',
        date: '2026-06-16',
      },
      defaultContext
    );

    expect(result.status).toBe('VALID');
    expect(result.isCompanyPaid).toBe(true);
    expect(result.eligibleAmount).toBe(0);
    expect(result.disallowedAmount).toBe(0);
  });

  it('14. Duplicate expense is detected and flagged as a duplicate candidate', () => {
    const existingList = [
      {
        id: 'exp-1',
        category: 'Transportation',
        merchant: 'Uber',
        description: 'Vertex to hotel ride',
        amount: 172.0,
        paidBy: 'EMPLOYEE' as const,
        proofRef: 'uber_receipt_3.eml',
        date: '2026-06-17',
      },
    ];

    const duplicateAttempt = evaluateExpense(
      {
        id: 'exp-2',
        category: 'Transportation',
        merchant: 'Uber',
        description: 'Resend of Uber ride',
        amount: 172.0,
        paidBy: 'EMPLOYEE',
        proofRef: 'uber_receipt_3_resend.eml',
        date: '2026-06-17',
      },
      { ...defaultContext, existingExpenses: existingList }
    );

    expect(duplicateAttempt.isDuplicate).toBe(true);
    expect(duplicateAttempt.status).toBe('FLAGGED');
    expect(duplicateAttempt.warnings.some((w) => w.includes('Duplicate candidate'))).toBe(true);
  });
});

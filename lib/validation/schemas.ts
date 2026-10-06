import { z } from 'zod';

export const TravelRequestCreateSchema = z.object({
  destination: z.string().min(2, 'Destination is required'),
  cityClass: z.enum(['Tier 1', 'Tier 2', 'Tier 3']).default('Tier 1'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
  purpose: z.string().min(3, 'Purpose is required'),
  category: z.enum(['Domestic', 'International']).default('Domestic'),
  mode: z.enum(['Flight', 'Train', 'Cab', 'Personal Vehicle']).default('Flight'),
  estimatedCost: z.number().positive('Estimated cost must be greater than 0'),
  employeeBorneEstimate: z.number().nonnegative('Employee borne estimate must be >= 0'),
  advanceRequested: z.number().nonnegative('Advance requested cannot be negative'),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: 'End date must be on or after start date', path: ['endDate'] }
).refine(
  (data) => data.advanceRequested <= 0.6 * data.employeeBorneEstimate + 0.01, // 60% rule with rounding tolerance
  { message: 'Advance requested cannot exceed 60% of estimated employee-borne cost', path: ['advanceRequested'] }
);

export const TravelRequestUpdateSchema = TravelRequestCreateSchema.partial();

export const ExpenseCreateSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid expense date'),
  category: z.enum(['Lodging', 'Transportation', 'Meals', 'Business Entertainment', 'Other']),
  merchant: z.string().min(1, 'Merchant name is required'),
  description: z.string().min(1, 'Description is required'),
  billNumber: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be greater than 0'),
  paidBy: z.enum(['EMPLOYEE', 'COMPANY']).default('EMPLOYEE'),
  proofRef: z.string().optional().nullable(),
  attendees: z.string().optional().nullable(),
  hodApprovalPrior: z.boolean().default(false),
  // Additional itemized details if applicable
  roomTariffPerNight: z.number().optional().nullable(),
  numberOfNights: z.number().optional().nullable(),
  roomTaxes: z.number().optional().nullable(),
  laundryAmount: z.number().optional().nullable(),
  miniBarAmount: z.number().optional().nullable(),
  inRoomDiningAmount: z.number().optional().nullable(),
  isSomeoneElse: z.boolean().optional().default(false),
});

export const ApprovalDecisionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'RETURN']),
  remarks: z.string().optional(),
}).refine(
  (data) => data.action === 'APPROVE' || (data.remarks && data.remarks.trim().length > 0),
  { message: 'Remarks are mandatory when rejecting or returning a request', path: ['remarks'] }
);

export const FinanceVerifySchema = z.object({
  action: z.enum(['VERIFY', 'RETURN']),
  remarks: z.string().optional(),
}).refine(
  (data) => data.action === 'VERIFY' || (data.remarks && data.remarks.trim().length > 0),
  { message: 'Remarks are mandatory when returning a claim', path: ['remarks'] }
);

export const PaymentProcessSchema = z.object({
  action: z.enum(['PROCESS_PAYMENT', 'RECORD_RECOVERY']),
  amount: z.number().positive(),
  reference: z.string().min(2, 'Payment/Recovery reference is required'),
  notes: z.string().optional(),
});

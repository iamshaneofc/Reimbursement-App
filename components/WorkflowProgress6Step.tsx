import React from 'react';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  FileText,
  UserCheck,
  Wallet,
  Receipt,
  ShieldCheck,
  Banknote,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

interface WorkflowProgress6StepProps {
  request: {
    status: string;
    createdAt?: string | Date;
    startDate?: string | Date;
    advanceRequested?: number;
    advanceDisbursed?: number;
    advanceReference?: string | null;
    approvalSteps?: any[];
    expenses?: any[];
    payments?: any[];
    returnRemarks?: string | null;
    rejectionReason?: string | null;
    settlementSummary?: any;
  };
}

export function WorkflowProgress6Step({ request }: WorkflowProgress6StepProps) {
  const status = request.status;
  const isRejected = status === 'REJECTED';
  const isReturned = status === 'RETURNED';

  // Step 1: Travel Request
  const step1 = {
    num: 1,
    title: 'Travel Request',
    icon: FileText,
    isCompleted: !['DRAFT'].includes(status),
    isCurrent: status === 'DRAFT',
    isAlert: false,
    subtitle: status === 'DRAFT' ? 'Draft In Progress' : 'Submitted by Employee',
    details: request.createdAt ? `Created ${formatDate(request.createdAt)}` : 'Submitted',
  };

  // Step 2: Trip Approval
  const approvedSteps = (request.approvalSteps || []).filter((s: any) => s.status === 'APPROVED');
  const totalRequiredSteps = (request.approvalSteps || []).filter((s: any) => s.status !== 'SKIPPED').length;
  const isTripApproved = ['APPROVED', 'SETTLEMENT_DRAFT', 'SETTLEMENT_SUBMITTED', 'FINANCE_REVIEW', 'PAYMENT_PENDING', 'RECOVERY_DUE', 'PAID', 'RECOVERED'].includes(status);
  const isApprovalCurrent = status === 'PENDING_APPROVAL';

  const step2 = {
    num: 2,
    title: 'Trip Approval',
    icon: UserCheck,
    isCompleted: isTripApproved,
    isCurrent: isApprovalCurrent,
    isAlert: isRejected || (isReturned && !request.expenses?.length),
    subtitle: isTripApproved
      ? 'Management Approved'
      : isApprovalCurrent
      ? `Awaiting Level (${approvedSteps.length}/${totalRequiredSteps})`
      : isRejected
      ? 'Trip Rejected'
      : 'Pending Approval',
    details: approvedSteps.length > 0 && approvedSteps[approvedSteps.length - 1]?.approver
      ? `By ${approvedSteps[approvedSteps.length - 1].approver.name}`
      : `${totalRequiredSteps} Tier Matrix`,
  };

  // Step 3: Advance Disbursement
  const hasAdvance = (request.advanceDisbursed || 0) > 0 || (request.advanceRequested || 0) > 0;
  const isAdvanceDisbursed = (request.advanceDisbursed || 0) > 0 || isTripApproved;

  const step3 = {
    num: 3,
    title: 'Advance Disbursement',
    icon: Wallet,
    isCompleted: isAdvanceDisbursed,
    isCurrent: isTripApproved && !request.expenses?.length && status === 'APPROVED',
    isAlert: false,
    subtitle: (request.advanceDisbursed || 0) > 0
      ? `${formatCurrency(request.advanceDisbursed)} Disbursed`
      : (request.advanceRequested || 0) > 0
      ? `${formatCurrency(request.advanceRequested)} Requested`
      : 'No Advance Needed',
    details: request.advanceReference ? `Ref: ${request.advanceReference}` : 'Finance SSC',
  };

  // Step 4: Trip Settlement
  const hasSettlementSubmitted = ['SETTLEMENT_SUBMITTED', 'FINANCE_REVIEW', 'PAYMENT_PENDING', 'RECOVERY_DUE', 'PAID', 'RECOVERED'].includes(status);
  const isSettlementCurrent = ['APPROVED', 'SETTLEMENT_DRAFT'].includes(status) && (request.expenses?.length || 0) > 0;

  const step4 = {
    num: 4,
    title: 'Trip Settlement',
    icon: Receipt,
    isCompleted: hasSettlementSubmitted,
    isCurrent: isSettlementCurrent || (isReturned && (request.expenses?.length || 0) > 0),
    isAlert: isReturned && (request.expenses?.length || 0) > 0,
    subtitle: hasSettlementSubmitted
      ? 'Claim Submitted'
      : request.expenses?.length
      ? `${request.expenses.length} Expenses Entered`
      : 'Awaiting Settlement',
    details: isSettlementCurrent ? 'Action: Submit Claim' : 'Policy Checked',
  };

  // Step 5: Finance Review
  const isFinanceCompleted = ['PAYMENT_PENDING', 'RECOVERY_DUE', 'PAID', 'RECOVERED'].includes(status);
  const isFinanceCurrent = status === 'FINANCE_REVIEW';

  const step5 = {
    num: 5,
    title: 'Finance Review',
    icon: ShieldCheck,
    isCompleted: isFinanceCompleted,
    isCurrent: isFinanceCurrent,
    isAlert: false,
    subtitle: isFinanceCompleted
      ? 'Verified & Authorized'
      : isFinanceCurrent
      ? 'Under Finance Audit'
      : 'Pending Review',
    details: isFinanceCurrent ? 'Finance Queue' : 'Compliance Check',
  };

  // Step 6: Payout / Recovery
  const isPaidOrRecovered = ['PAID', 'RECOVERED'].includes(status);
  const isPaymentPending = ['PAYMENT_PENDING', 'RECOVERY_DUE'].includes(status);

  const step6 = {
    num: 6,
    title: status === 'RECOVERY_DUE' || status === 'RECOVERED' ? 'Payroll Recovery' : 'Payout Release',
    icon: Banknote,
    isCompleted: isPaidOrRecovered,
    isCurrent: isPaymentPending,
    isAlert: false,
    subtitle: isPaidOrRecovered
      ? (status === 'RECOVERED' ? 'Recovery Settled' : 'Payment Released')
      : isPaymentPending
      ? (status === 'RECOVERY_DUE' ? 'Recovery Due' : 'Ready for Payment Run')
      : 'Final Settlement',
    details: isPaidOrRecovered
      ? 'Voucher Processed'
      : isPaymentPending
      ? 'Payment Run Batch'
      : 'Scheduled Payout',
  };

  const steps = [step1, step2, step3, step4, step5, step6];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            End-to-End Reimbursement Workflow (6-Stage Pipeline)
          </h3>
          <p className="text-xs text-slate-800 font-semibold mt-0.5">
            Stage {steps.findIndex((s) => s.isCurrent) + 1 || (isPaidOrRecovered ? 6 : 1)} of 6 &middot; Real-time status driven by policy and governance state
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;

          return (
            <div
              key={step.num}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all relative ${
                step.isCompleted
                  ? 'bg-emerald-50/40 border-emerald-200 text-slate-900'
                  : step.isAlert
                  ? 'bg-rose-50/50 border-rose-300 text-slate-900'
                  : step.isCurrent
                  ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20 text-slate-900'
                  : 'bg-slate-50/50 border-slate-200/80 opacity-60 text-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step.isCompleted
                      ? 'bg-emerald-600 text-white'
                      : step.isAlert
                      ? 'bg-rose-600 text-white'
                      : step.isCurrent
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {step.isCompleted ? '✓' : step.num}
                  </span>

                  <StepIcon className={`w-4 h-4 ${
                    step.isCompleted
                      ? 'text-emerald-600'
                      : step.isAlert
                      ? 'text-rose-600'
                      : step.isCurrent
                      ? 'text-indigo-600'
                      : 'text-slate-400'
                  }`} />
                </div>

                <p className="text-xs font-bold leading-snug">{step.title}</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-tight font-medium">
                  {step.subtitle}
                </p>
              </div>

              <div className="mt-2.5 pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono truncate">
                {step.details}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { Wallet, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft, Building2 } from 'lucide-react';

interface FinancialSummaryProps {
  summary: {
    totalClaimed: number;
    companyPaidTotal: number;
    employeePaidTotal: number;
    disallowedTotal: number;
    eligibleTotal: number;
    advanceDisbursed: number;
    netPayableAmount: number;
    netRecoverableAmount: number;
    settlementType: 'PAYABLE' | 'RECOVERY' | 'SETTLED';
  };
  compact?: boolean;
}

export function FinancialSummaryCard({ summary, compact = false }: FinancialSummaryProps) {
  const isPayable = summary.settlementType === 'PAYABLE';
  const isRecovery = summary.settlementType === 'RECOVERY';

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <p className="text-xs text-slate-500 font-medium">Claimed</p>
          <p className="text-base font-semibold text-slate-900">{formatCurrency(summary.employeePaidTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Eligible</p>
          <p className="text-base font-semibold text-emerald-600">{formatCurrency(summary.eligibleTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Advance Disbursed</p>
          <p className="text-base font-semibold text-slate-700">{formatCurrency(summary.advanceDisbursed)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">{isRecovery ? 'Payroll Recovery' : 'Net Payable'}</p>
          <p className={`text-base font-bold ${isRecovery ? 'text-orange-600' : 'text-emerald-700'}`}>
            {isRecovery ? formatCurrency(summary.netRecoverableAmount) : formatCurrency(summary.netPayableAmount)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
      {/* Header Banner */}
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Settlement Calculation Breakdown</h3>
            <p className="text-xs text-slate-500">Server-verified financial balances per Policy §1 & §4</p>
          </div>
        </div>

        {summary.companyPaidTotal > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-medium">
            <Building2 className="w-3.5 h-3.5" />
            <span>Company-Paid Memo: {formatCurrency(summary.companyPaidTotal)}</span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Box 1: Claimed Amount */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Employee Claim</span>
              <Wallet className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-900">{formatCurrency(summary.employeePaidTotal)}</div>
            <p className="text-[11px] text-slate-500 mt-1">Total of submitted employee-paid receipts</p>
          </div>

          {/* Box 2: Disallowed Amount */}
          <div className="p-4 bg-rose-50/50 border border-rose-200/70 rounded-xl">
            <div className="flex items-center justify-between text-rose-700 text-xs font-medium mb-1">
              <span>Disallowed / Exclusions</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-bold text-rose-600">
              {summary.disallowedTotal > 0 ? `-${formatCurrency(summary.disallowedTotal)}` : '₹0.00'}
            </div>
            <p className="text-[11px] text-rose-600/80 mt-1">Non-reimbursables & policy limits</p>
          </div>

          {/* Box 3: Net Eligible */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200/70 rounded-xl">
            <div className="flex items-center justify-between text-emerald-700 text-xs font-medium mb-1">
              <span>Net Eligible Claim</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-700">{formatCurrency(summary.eligibleTotal)}</div>
            <p className="text-[11px] text-emerald-600 mt-1">Claim minus disallowed items</p>
          </div>

          {/* Box 4: Advance Disbursed */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/70 rounded-xl">
            <div className="flex items-center justify-between text-amber-800 text-xs font-medium mb-1">
              <span>Advance Offset</span>
              <Wallet className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-amber-800">{formatCurrency(summary.advanceDisbursed)}</div>
            <p className="text-[11px] text-amber-700 mt-1">Paid in advance by Finance</p>
          </div>
        </div>

        {/* Final Payable / Recoverable Hero Highlight */}
        <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
          isRecovery
            ? 'bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-orange-200 text-orange-950'
            : isPayable
            ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-200 text-emerald-950'
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isRecovery ? 'bg-orange-500 text-white' : isPayable ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'
            }`}>
              {isRecovery ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 border border-current shadow-xs">
                  {isRecovery ? 'Recovery from Employee' : isPayable ? 'Net Payment to Employee' : 'Fully Settled'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {isRecovery
                  ? 'The travel advance exceeds the eligible claim. Balance will be deducted in next payroll cycle.'
                  : isPayable
                  ? 'Eligible claim exceeds advance disbursed. Balance to be transferred via Finance payment run.'
                  : 'Claim amount exactly matches the advance disbursed. Balance is zero.'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Final Settlement Balance</p>
            <p className={`text-3xl font-extrabold tracking-tight ${
              isRecovery ? 'text-orange-600' : isPayable ? 'text-emerald-700' : 'text-slate-800'
            }`}>
              {isRecovery ? formatCurrency(summary.netRecoverableAmount) : formatCurrency(summary.netPayableAmount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

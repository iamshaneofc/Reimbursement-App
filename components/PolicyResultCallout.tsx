import React from 'react';
import { AlertTriangle, XCircle, CheckCircle2, Copy } from 'lucide-react';

interface PolicyResultCalloutProps {
  status: 'VALID' | 'FLAGGED' | 'DISALLOWED' | string;
  eligibleAmount: number;
  disallowedAmount: number;
  isCompanyPaid?: boolean;
  isDuplicate?: boolean;
  isSomeoneElse?: boolean;
  reasons?: string[];
  warnings?: string[];
}

export function PolicyResultCallout({
  status,
  eligibleAmount,
  disallowedAmount,
  isCompanyPaid,
  isDuplicate,
  isSomeoneElse,
  reasons = [],
  warnings = [],
}: PolicyResultCalloutProps) {
  if (status === 'VALID' && reasons.length === 0 && warnings.length === 0 && !isCompanyPaid) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Fully eligible under Nortex travel policy</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 text-xs">
      {/* Disallowed Reasons */}
      {reasons.map((r, i) => (
        <div key={`r-${i}`} className="flex items-start gap-1.5 text-rose-700 bg-rose-50/60 p-2 rounded-lg border border-rose-200">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Disallowed per Policy: </span>
            <span>{r}</span>
          </div>
        </div>
      ))}

      {/* Warnings & Flags */}
      {warnings.map((w, i) => (
        <div key={`w-${i}`} className="flex items-start gap-1.5 text-amber-800 bg-amber-50/60 p-2 rounded-lg border border-amber-200">
          {isDuplicate ? (
            <Copy className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-semibold">{isDuplicate ? 'Duplicate Notice: ' : 'Policy Exception / Notice: '}</span>
            <span>{w}</span>
          </div>
        </div>
      ))}

      {/* Company Paid notice */}
      {isCompanyPaid && (
        <div className="flex items-start gap-1.5 text-sky-800 bg-sky-50/60 p-2 rounded-lg border border-sky-200">
          <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <span>Centrally booked on Corporate Card (Company Paid). Recorded for audit; no employee reimbursement.</span>
        </div>
      )}
    </div>
  );
}

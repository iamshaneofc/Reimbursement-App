import React from 'react';
import { Check, Clock, AlertTriangle, UserCheck, ShieldAlert } from 'lucide-react';

interface Step {
  id: string;
  sequence: number;
  role: string;
  approverId: string | null;
  status: string; // PENDING, APPROVED, REJECTED, RETURNED, SKIPPED
  remarks?: string | null;
  approver?: {
    name: string;
    empCode: string;
    designation: string;
  } | null;
  decidedAt?: string | Date | null;
}

interface ApprovalChainProgressProps {
  steps: Step[];
  currentSequence: number;
  overallStatus: string;
}

export function ApprovalChainProgress({ steps, currentSequence, overallStatus }: ApprovalChainProgressProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Governance & Approval Chain</h4>
          <p className="text-xs text-slate-500">Multi-tier approval matrix based on claim value and policy</p>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {steps.length} {steps.length === 1 ? 'Level' : 'Levels'} Required
        </span>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((step, idx) => {
            const isApproved = step.status === 'APPROVED';
            const isRejected = step.status === 'REJECTED';
            const isReturned = step.status === 'RETURNED';
            const isSkipped = step.status === 'SKIPPED';
            const isCurrent = step.status === 'PENDING' && step.sequence === currentSequence && overallStatus === 'PENDING_APPROVAL';

            return (
              <div
                key={step.id || idx}
                className={`relative p-4 rounded-xl border transition-all ${
                  isApproved
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : isRejected
                    ? 'bg-rose-50/50 border-rose-300'
                    : isReturned
                    ? 'bg-amber-50/50 border-amber-300'
                    : isSkipped
                    ? 'bg-slate-50/70 border-slate-200 opacity-70'
                    : isCurrent
                    ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50/40 border-slate-200 opacity-60'
                }`}
              >
                {/* Step Sequence Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Level {step.sequence}
                  </span>
                  <div className="flex items-center">
                    {isApproved && (
                      <span className="p-1 bg-emerald-600 text-white rounded-full">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {isRejected && (
                      <span className="p-1 bg-rose-600 text-white rounded-full">
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {isReturned && (
                      <span className="p-1 bg-amber-600 text-white rounded-full">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {isSkipped && (
                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-semibold rounded">
                        Self-Skipped
                      </span>
                    )}
                    {isCurrent && (
                      <span className="p-1 bg-indigo-600 text-white rounded-full animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs font-bold text-slate-800">{step.role}</p>
                <p className="text-xs text-slate-600 truncate mt-0.5">
                  {step.approver ? step.approver.name : 'Hierarchy Assigned'}
                </p>

                {step.remarks && (
                  <div className="mt-2 text-[11px] bg-white/80 p-1.5 rounded border border-slate-200 text-slate-700 italic">
                    &ldquo;{step.remarks}&rdquo;
                  </div>
                )}

                {isSkipped && (
                  <p className="mt-2 text-[10px] text-slate-500 italic">
                    Claimant is approver (Self-approval bypassed per Policy §2.2)
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

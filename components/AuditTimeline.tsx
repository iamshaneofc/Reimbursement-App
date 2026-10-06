import React from 'react';
import { formatDateTime } from '@/lib/utils';
import { CheckCircle2, XCircle, RotateCcw, PlusCircle, ArrowRight, ShieldCheck, Banknote, UserCheck } from 'lucide-react';

interface AuditEventItem {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  metadata?: string | null;
  createdAt: string | Date;
}

interface AuditTimelineProps {
  events: AuditEventItem[];
}

export function AuditTimeline({ events }: AuditTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400 text-xs">
        No audit events recorded yet.
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE_REQUEST':
      case 'ADD_EXPENSE':
      case 'LOAD_SAMPLE_EXPENSES':
        return <PlusCircle className="w-4 h-4 text-blue-500" />;
      case 'SUBMIT_REQUEST':
      case 'SUBMIT_SETTLEMENT':
      case 'RESUBMIT_REQUEST':
        return <ArrowRight className="w-4 h-4 text-indigo-500" />;
      case 'APPROVE_REQUEST':
      case 'DISBURSE_ADVANCE':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'RETURN_REQUEST':
      case 'FINANCE_RETURN':
        return <RotateCcw className="w-4 h-4 text-amber-500" />;
      case 'REJECT_REQUEST':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'VERIFY_FINANCE':
        return <ShieldCheck className="w-4 h-4 text-teal-600" />;
      case 'PROCESS_PAYMENT':
      case 'PROCESS_RECOVERY':
        return <Banknote className="w-4 h-4 text-green-600" />;
      default:
        return <UserCheck className="w-4 h-4 text-slate-500" />;
    }
  };

  const getActionTitle = (action: string) => {
    switch (action) {
      case 'CREATE_REQUEST':
        return 'Travel Request Created';
      case 'SUBMIT_REQUEST':
        return 'Submitted for Management Approval';
      case 'APPROVE_REQUEST':
        return 'Manager / Governance Approved';
      case 'RETURN_REQUEST':
      case 'FINANCE_RETURN':
        return 'Returned with Remarks';
      case 'REJECT_REQUEST':
        return 'Request Rejected';
      case 'RESUBMIT_REQUEST':
        return 'Resubmitted by Employee';
      case 'ADD_EXPENSE':
        return 'Expense Line Added & Evaluated';
      case 'LOAD_SAMPLE_EXPENSES':
        return 'Golden-Path Sample Evidence Ingested';
      case 'SUBMIT_SETTLEMENT':
        return 'Settlement Submitted for Finance Verification';
      case 'VERIFY_FINANCE':
        return 'Finance Verification Completed';
      case 'PROCESS_PAYMENT':
        return 'Payment Disbursed to Employee';
      case 'PROCESS_RECOVERY':
        return 'Payroll Recovery Recorded';
      case 'DISBURSE_ADVANCE':
        return 'Travel Advance Disbursed';
      default:
        return action.replace(/_/g, ' ');
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((evt) => {
        let meta: Record<string, any> = {};
        if (evt.metadata) {
          try {
            meta = JSON.parse(evt.metadata);
          } catch {
            meta = {};
          }
        }

        return (
          <div key={evt.id} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-xs">
              {getActionIcon(evt.action)}
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 hover:bg-slate-50 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-slate-900">
                  {getActionTitle(evt.action)}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {formatDateTime(evt.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 mb-1.5">
                <span className="font-semibold text-slate-800">{evt.actorName}</span>
                <span className="text-[10px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                  {evt.actorRole}
                </span>
              </div>

              {evt.toStatus && (
                <div className="text-[11px] text-slate-500 mb-1">
                  Status transition: <span className="font-mono text-slate-700">{evt.fromStatus || 'INIT'}</span> → <span className="font-mono font-semibold text-indigo-700">{evt.toStatus}</span>
                </div>
              )}

              {meta.remarks && (
                <div className="mt-1 text-xs bg-amber-50/70 border border-amber-200 text-amber-900 p-2 rounded-lg italic">
                  &ldquo;{meta.remarks}&rdquo;
                </div>
              )}

              {meta.reference && (
                <div className="mt-1 text-[11px] text-slate-600">
                  Ref: <span className="font-mono font-semibold text-slate-800">{meta.reference}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

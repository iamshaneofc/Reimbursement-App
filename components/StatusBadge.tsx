import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getBadgeConfig = (st: string) => {
    switch (st) {
      case 'DRAFT':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          label: 'Draft',
          dot: 'bg-slate-400',
        };
      case 'SUBMITTED':
      case 'PENDING_APPROVAL':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          label: 'Pending Approval',
          dot: 'bg-amber-500 animate-pulse',
        };
      case 'APPROVED':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          label: 'Approved (Trip Ready)',
          dot: 'bg-emerald-500',
        };
      case 'SETTLEMENT_DRAFT':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-300',
          label: 'Settlement In Progress',
          dot: 'bg-indigo-500',
        };
      case 'SETTLEMENT_SUBMITTED':
      case 'FINANCE_REVIEW':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          label: 'Finance Verification',
          dot: 'bg-blue-500 animate-pulse',
        };
      case 'PAYMENT_PENDING':
        return {
          bg: 'bg-teal-50 text-teal-800 border-teal-300',
          label: 'Payment Pending',
          dot: 'bg-teal-500',
        };
      case 'RECOVERY_DUE':
        return {
          bg: 'bg-orange-50 text-orange-800 border-orange-300',
          label: 'Recovery Due (Payroll)',
          dot: 'bg-orange-500',
        };
      case 'PAID':
        return {
          bg: 'bg-green-100 text-green-900 border-green-400',
          label: 'Paid / Settled',
          dot: 'bg-green-600',
        };
      case 'RECOVERED':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-300',
          label: 'Recovered via Payroll',
          dot: 'bg-purple-600',
        };
      case 'RETURNED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          label: 'Returned for Correction',
          dot: 'bg-rose-500',
        };
      case 'REJECTED':
        return {
          bg: 'bg-red-100 text-red-900 border-red-300',
          label: 'Rejected',
          dot: 'bg-red-600',
        };
      case 'VALID':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Policy Eligible',
          dot: 'bg-emerald-500',
        };
      case 'FLAGGED':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          label: 'Policy Exception / Flag',
          dot: 'bg-amber-500',
        };
      case 'DISALLOWED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          label: 'Disallowed',
          dot: 'bg-rose-500',
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-800 border-gray-300',
          label: st,
          dot: 'bg-gray-400',
        };
    }
  };

  const config = getBadgeConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

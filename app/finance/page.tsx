'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { FinancialSummaryCard } from '@/components/FinancialSummaryCard';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Banknote,
  Receipt,
  Eye,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  X,
  FileCheck2,
} from 'lucide-react';

export default function FinanceQueuePage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'VERIFICATION' | 'PAYMENT' | 'RECOVERY' | 'HISTORY'>('VERIFICATION');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'VERIFY' | 'PAYMENT' | 'RETURN' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadQueue = async () => {
    try {
      const res = await fetch('/api/finance/queue');
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims || []);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const filteredClaims = claims.filter((c) => {
    if (activeTab === 'VERIFICATION') return c.status === 'FINANCE_REVIEW';
    if (activeTab === 'PAYMENT') return c.status === 'PAYMENT_PENDING';
    if (activeTab === 'RECOVERY') return c.status === 'RECOVERY_DUE';
    if (activeTab === 'HISTORY') return ['PAID', 'RECOVERED'].includes(c.status);
    return true;
  });

  const handleVerify = async () => {
    if (!selectedClaim) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/finance/${selectedClaim.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY', remarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg(data.message || 'Claim verified successfully');
      setModalMode(null);
      setSelectedClaim(null);
      setRemarks('');
      loadQueue();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinanceReturn = async () => {
    if (!selectedClaim || !remarks.trim()) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/finance/${selectedClaim.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RETURN', remarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg('Claim returned to employee with remarks');
      setModalMode(null);
      setSelectedClaim(null);
      setRemarks('');
      loadQueue();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedClaim) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/finance/${selectedClaim.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: paymentRef }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg(data.message || 'Payment / Recovery recorded successfully');
      setModalMode(null);
      setSelectedClaim(null);
      setPaymentRef('');
      loadQueue();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const pendingVerificationCount = claims.filter((c) => c.status === 'FINANCE_REVIEW').length;
  const pendingPaymentSum = claims
    .filter((c) => c.status === 'PAYMENT_PENDING')
    .reduce((sum, c) => sum + (c.settlementSummary?.netPayableAmount || 0), 0);
  const recoveryDueSum = claims
    .filter((c) => c.status === 'RECOVERY_DUE')
    .reduce((sum, c) => sum + (c.settlementSummary?.netRecoverableAmount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Finance Shared Services & Payout Queue
              </h1>
              <p className="text-xs text-slate-500">
                Audit policy compliance, verify settlement balances, and authorize payments & payroll recoveries
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Pending Verification</span>
            <FileCheck2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingVerificationCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Claims in FINANCE_REVIEW state</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium mb-1">
            <span>Ready for Payout Run</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{formatCurrency(pendingPaymentSum)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Payment batch (10th / 25th run)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-orange-700 text-xs font-medium mb-1">
            <span>Recovery Pool Due</span>
            <ArrowDownLeft className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-700">{formatCurrency(recoveryDueSum)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Payroll deductions scheduled</p>
        </div>
      </div>

      {/* Queue Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('VERIFICATION')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'VERIFICATION'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pending Verification ({claims.filter((c) => c.status === 'FINANCE_REVIEW').length})
        </button>

        <button
          onClick={() => setActiveTab('PAYMENT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'PAYMENT'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payment Payouts ({claims.filter((c) => c.status === 'PAYMENT_PENDING').length})
        </button>

        <button
          onClick={() => setActiveTab('RECOVERY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'RECOVERY'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payroll Recoveries ({claims.filter((c) => c.status === 'RECOVERY_DUE').length})
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'HISTORY'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Settled Archive ({claims.filter((c) => ['PAID', 'RECOVERED'].includes(c.status)).length})
        </button>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2" />
            <p className="text-xs">Loading finance queue...</p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <ShieldCheck className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">Queue is empty</h4>
            <p className="text-xs text-slate-400">No claims currently matching this tab.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-3.5">Request #</th>
                  <th className="px-6 py-3.5">Claimant Employee</th>
                  <th className="px-6 py-3.5">Destination & Purpose</th>
                  <th className="px-6 py-3.5">Claim Breakdown</th>
                  <th className="px-6 py-3.5">Advance Offset</th>
                  <th className="px-6 py-3.5">Net Payable / Recovery</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClaims.map((claim) => {
                  const summary = claim.settlementSummary;
                  const isPayable = summary?.settlementType === 'PAYABLE';
                  const isRecovery = summary?.settlementType === 'RECOVERY';

                  return (
                    <tr key={claim.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        <Link href={`/settlements/${claim.id}`} className="hover:text-indigo-600">
                          {claim.requestNumber}
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{claim.employee?.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {claim.employee?.designation} &middot; {claim.employee?.costCentre}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{claim.destination}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-xs">{claim.purpose}</p>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900">Claimed: {formatCurrency(summary?.employeePaidTotal)}</p>
                        <p className="text-[11px] text-emerald-600 font-semibold">Eligible: {formatCurrency(summary?.eligibleTotal)}</p>
                        {summary?.disallowedTotal > 0 && (
                          <p className="text-[10px] text-rose-600 font-medium">Disallowed: -{formatCurrency(summary?.disallowedTotal)}</p>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-800">{formatCurrency(claim.advanceDisbursed)}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Offset against claim</p>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className={`text-sm font-extrabold ${
                          isRecovery ? 'text-orange-600' : isPayable ? 'text-emerald-700' : 'text-slate-700'
                        }`}>
                          {isRecovery
                            ? `Recovery: ${formatCurrency(summary?.netRecoverableAmount)}`
                            : isPayable
                            ? `Payable: ${formatCurrency(summary?.netPayableAmount)}`
                            : 'Settled'}
                        </p>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={claim.status} />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <Link
                          href={`/settlements/${claim.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </Link>

                        {claim.status === 'FINANCE_REVIEW' && (
                          <button
                            onClick={() => {
                              setSelectedClaim(claim);
                              setModalMode('VERIFY');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verify</span>
                          </button>
                        )}

                        {['PAYMENT_PENDING', 'RECOVERY_DUE'].includes(claim.status) && (
                          <button
                            onClick={() => {
                              setSelectedClaim(claim);
                              setModalMode('PAYMENT');
                              const year = new Date().getFullYear();
                              const rand = Math.floor(1000 + Math.random() * 9000);
                              setPaymentRef(claim.status === 'RECOVERY_DUE' ? `REC/${year}/${rand}` : `PAY/${year}/${rand}`);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>{claim.status === 'RECOVERY_DUE' ? 'Record Recovery' : 'Release Payment'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Finance Verification Modal */}
      {modalMode === 'VERIFY' && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-elevation border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Finance Settlement Verification</h3>
                  <p className="text-xs text-slate-500">Claim: {selectedClaim.requestNumber} &middot; {selectedClaim.employee?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Summary */}
            {selectedClaim.settlementSummary && (
              <FinancialSummaryCard summary={selectedClaim.settlementSummary} compact />
            )}

            {/* Verification checklist notice */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-slate-700">
              <p className="font-bold text-slate-900">Finance Verification Audit Checklist:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Policy limits on Lodging & Meals verified server-side per Policy §3</li>
                <li>Non-reimbursables (laundry, minibar, in-room dining) excluded from reimbursement</li>
                <li>Duplicate bill candidates identified and checked per Policy §5.3</li>
                <li>Disbursed advance ({formatCurrency(selectedClaim.advanceDisbursed)}) adjusted against eligible claim</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Verification Remarks / Audit Notes</label>
              <textarea
                rows={3}
                placeholder="Optional verification remarks (or mandatory reason if returning)..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                disabled={actionLoading}
                onClick={handleFinanceReturn}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition"
              >
                Return to Employee with Remarks
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleVerify}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {actionLoading ? 'Verifying...' : 'Authorize Settlement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Release / Recovery Modal */}
      {modalMode === 'PAYMENT' && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-elevation border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {selectedClaim.status === 'RECOVERY_DUE' ? 'Record Payroll Recovery' : 'Release Payment Transfer'}
            </h3>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <p><strong>Employee:</strong> {selectedClaim.employee?.name} ({selectedClaim.employee?.empCode})</p>
              <p>
                <strong>Final Amount:</strong>{' '}
                <span className="text-base font-extrabold text-indigo-700">
                  {selectedClaim.status === 'RECOVERY_DUE'
                    ? formatCurrency(selectedClaim.settlementSummary?.netRecoverableAmount)
                    : formatCurrency(selectedClaim.settlementSummary?.netPayableAmount)}
                </span>
              </p>
              <p className="text-[11px] text-slate-500">
                {selectedClaim.status === 'RECOVERY_DUE'
                  ? 'Will schedule deduction from employee next payroll cycle per Policy §1.3'
                  : 'Will process simulated bank transfer payout (Policy payment run)'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction / Voucher Reference <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => setModalMode(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                disabled={actionLoading || !paymentRef.trim()}
                onClick={handleProcessPayment}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                {actionLoading ? 'Processing...' : 'Confirm & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

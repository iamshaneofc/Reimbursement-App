'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Plane,
  Eye,
  User,
  Clock,
} from 'lucide-react';

export default function ApprovalsQueuePage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [dialogAction, setDialogAction] = useState<'APPROVE' | 'REJECT' | 'RETURN' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadApprovals = async () => {
    try {
      const res = await fetch('/api/approvals');
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.approvals || []);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleDecision = async () => {
    if (!activeRequest || !dialogAction) return;
    setActionLoading(true);
    setError(null);
    try {
      const endpoint = dialogAction === 'APPROVE'
        ? `/api/requests/${activeRequest.id}/approve`
        : dialogAction === 'REJECT'
        ? `/api/requests/${activeRequest.id}/reject`
        : `/api/requests/${activeRequest.id}/return`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg(data.message || `Request ${dialogAction.toLowerCase()}d successfully`);
      setDialogAction(null);
      setActiveRequest(null);
      setRemarks('');
      loadApprovals();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manager Approval Queue</h1>
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-xs rounded-full">
              {approvals.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review and decide on travel authorizations and advance requests assigned to your hierarchy
          </p>
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

      {/* Approvals Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2" />
            <p className="text-xs">Loading approval tasks...</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <CheckSquare className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">All caught up!</h4>
            <p className="text-xs text-slate-400">No pending approval requests currently assigned to you.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-3.5">Request #</th>
                  <th className="px-6 py-3.5">Claimant Employee</th>
                  <th className="px-6 py-3.5">Destination & Purpose</th>
                  <th className="px-6 py-3.5">Travel Dates</th>
                  <th className="px-6 py-3.5">Estimated Spend / Advance</th>
                  <th className="px-6 py-3.5">Level Assigned</th>
                  <th className="px-6 py-3.5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvals.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      <Link href={`/requests/${req.id}`} className="hover:text-indigo-600">
                        {req.requestNumber}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{req.employee?.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {req.employee?.designation} &middot; {req.employee?.department}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{req.destination}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{req.purpose}</p>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                      {formatDate(req.startDate)} - {formatDate(req.endDate)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{formatCurrency(req.estimatedCost)}</p>
                      {req.advanceRequested > 0 && (
                        <p className="text-[11px] text-amber-700 font-semibold">
                          Adv Req: {formatCurrency(req.advanceRequested)}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-xs font-semibold">
                        Level {req.currentStep?.sequence}: {req.currentStep?.role}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <Link
                        href={`/requests/${req.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Link>

                      <button
                        onClick={() => {
                          setActiveRequest(req);
                          setDialogAction('APPROVE');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveRequest(req);
                          setDialogAction('RETURN');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Return</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveRequest(req);
                          setDialogAction('REJECT');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {dialogAction && activeRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-elevation border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {dialogAction === 'APPROVE' && 'Approve Travel Request'}
              {dialogAction === 'RETURN' && 'Return Request to Employee for Correction'}
              {dialogAction === 'REJECT' && 'Reject Travel Request'}
            </h3>

            <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-700 space-y-1">
              <p><strong>Request:</strong> {activeRequest.requestNumber} &middot; {activeRequest.destination}</p>
              <p><strong>Claimant:</strong> {activeRequest.employee?.name} ({activeRequest.employee?.designation})</p>
              <p><strong>Estimated Cost:</strong> {formatCurrency(activeRequest.estimatedCost)} &middot; <strong>Advance:</strong> {formatCurrency(activeRequest.advanceRequested)}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Remarks {dialogAction !== 'APPROVE' && <span className="text-rose-500">* (Mandatory)</span>}
              </label>
              <textarea
                rows={3}
                placeholder={dialogAction === 'APPROVE' ? 'Optional approval remarks...' : 'Mandatory explanation for return/rejection...'}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => {
                  setDialogAction(null);
                  setActiveRequest(null);
                  setRemarks('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                disabled={actionLoading || (dialogAction !== 'APPROVE' && !remarks.trim())}
                onClick={handleDecision}
                className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-sm transition ${
                  dialogAction === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : dialogAction === 'RETURN'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading ? 'Processing...' : `Confirm ${dialogAction}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

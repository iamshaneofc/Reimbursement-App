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
  Search,
  Filter,
  TrendingUp,
  History,
  ShieldCheck,
} from 'lucide-react';

export default function ApprovalsQueuePage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    returnedCount: 0,
    avgDecisionHours: '2.4',
  });
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [dialogAction, setDialogAction] = useState<'APPROVE' | 'REJECT' | 'RETURN' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/approvals');
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.approvals || []);
        setHistory(data.history || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (e: any) {
      console.error('Failed to load approvals:', e);
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
        body: JSON.stringify({ remarks: remarks.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit decision');

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

  const filteredApprovals = approvals.filter((req) => {
    const q = searchQuery.toLowerCase();
    return (
      req.requestNumber?.toLowerCase().includes(q) ||
      req.employee?.name?.toLowerCase().includes(q) ||
      req.destination?.toLowerCase().includes(q) ||
      req.purpose?.toLowerCase().includes(q)
    );
  });

  const filteredHistory = history.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.request?.requestNumber?.toLowerCase().includes(q) ||
      item.request?.employee?.name?.toLowerCase().includes(q) ||
      item.request?.destination?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manager Approval Workspace</h1>
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-xs rounded-full">
              {stats.pendingCount} Pending Decision
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review and govern travel authorizations, advance disbursements, and policy compliance for your assigned team members
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

      {/* 5 Manager Specific Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900">{stats.pendingCount}</div>
          <p className="text-[11px] text-slate-500">Awaiting your decision</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
            <span>Approved by Me</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-800">{stats.approvedCount}</div>
          <p className="text-[11px] text-slate-500">Personal approval history</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-700 text-xs font-medium">
            <span>Rejected by Me</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-800">{stats.rejectedCount}</div>
          <p className="text-[11px] text-slate-500">Non-compliant claims</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-indigo-700 text-xs font-medium">
            <span>Sent Back by Me</span>
            <RotateCcw className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-800">{stats.returnedCount}</div>
          <p className="text-[11px] text-slate-500">Returned for correction</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
            <span>Avg Decision Time</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.avgDecisionHours}h</div>
          <p className="text-[11px] text-slate-500">SLA target: 24 hours</p>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'PENDING'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Approvals ({stats.pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>My Decision History ({history.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by request #, employee, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2" />
            <p className="text-xs">Loading approval tasks...</p>
          </div>
        ) : activeTab === 'PENDING' ? (
          filteredApprovals.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-2">
              <CheckSquare className="w-10 h-10 mx-auto text-slate-300" />
              <h4 className="text-sm font-bold text-slate-700">All caught up!</h4>
              <p className="text-xs text-slate-400">No pending approval requests currently assigned to your queue.</p>
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
                  {filteredApprovals.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        <Link href={`/requests/${req.id}`} className="hover:text-indigo-600">
                          {req.requestNumber}
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{req.employee?.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {req.employee?.empCode} &middot; {req.employee?.department}
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
                            Adv: {formatCurrency(req.advanceRequested)}
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
          )
        ) : (
          /* History Tab */
          filteredHistory.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-2">
              <History className="w-10 h-10 mx-auto text-slate-300" />
              <h4 className="text-sm font-bold text-slate-700">No past decisions</h4>
              <p className="text-xs text-slate-400">Claims you approve, reject, or return will appear in this log.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-6 py-3.5">Request #</th>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Destination</th>
                    <th className="px-6 py-3.5">My Decision</th>
                    <th className="px-6 py-3.5">Remarks</th>
                    <th className="px-6 py-3.5">Decided At</th>
                    <th className="px-6 py-3.5 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((item) => (
                    <tr key={item.stepId} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {item.request?.requestNumber}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {item.request?.employee?.name}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {item.request?.destination}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                          {item.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                          {item.status === 'RETURNED' && <RotateCcw className="w-3 h-3" />}
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                        {item.remarks || '&mdash;'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono">
                        {item.decidedAt ? formatDate(item.decidedAt) : '&mdash;'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/requests/${item.request?.id}`}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Decision Modal with Confirmation & Mandatory Remarks for Reject/Return */}
      {dialogAction && activeRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-elevation border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
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
                className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 ${
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

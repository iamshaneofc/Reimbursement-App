'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Plane,
  PlusCircle,
  FileCheck2,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Wallet,
  Receipt,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [financeQueue, setFinanceQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);

          // Fetch requests
          const reqsRes = await fetch('/api/requests');
          if (reqsRes.ok) {
            const reqsData = await reqsRes.json();
            setRequests(reqsData.requests || []);
          }

          // If manager, fetch approvals
          if (['Reporting Manager', 'Head of Department', 'Head of Division', 'MD', 'Admin'].includes(userData.user?.role)) {
            const appRes = await fetch('/api/approvals');
            if (appRes.ok) {
              const appData = await appRes.json();
              setPendingApprovals(appData.approvals || []);
            }
          }

          // If finance, fetch finance queue
          if (['Finance', 'Admin'].includes(userData.user?.role)) {
            const finRes = await fetch('/api/finance/queue');
            if (finRes.ok) {
              const finData = await finRes.json();
              setFinanceQueue(finData.claims || []);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const goldenPathTrip = requests.find((r) => r.requestNumber === 'TR/2026/0612');

  // KPI Calculations
  const myRequests = requests.filter((r) => !user || r.employeeId === user.id);
  const totalAdvances = myRequests.reduce((sum, r) => sum + (r.advanceDisbursed || 0), 0);
  const totalSettledPayables = myRequests
    .filter((r) => r.status === 'PAID')
    .reduce((sum, r) => sum + (r.settlementSummary?.netPayableAmount || 0), 0);
  const pendingCount = myRequests.filter((r) => ['PENDING_APPROVAL', 'FINANCE_REVIEW'].includes(r.status)).length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
        <p className="text-sm">Loading workspace and travel requests...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-elevation relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-300 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nortex Travel & Expense Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Employee'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Role: <span className="font-semibold text-white">{user?.role}</span> &middot; Cost Centre: <span className="font-mono text-indigo-200">{user?.costCentre}</span> &middot; Department: <span className="text-slate-200">{user?.department}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/requests/new"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Travel Request</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Action Notification Banners */}
      {pendingApprovals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                You have {pendingApprovals.length} travel request{pendingApprovals.length > 1 ? 's' : ''} awaiting your approval
              </h4>
              <p className="text-xs text-amber-800">
                Review estimated costs, advances, and policy compliance.
              </p>
            </div>
          </div>
          <Link
            href="/approvals"
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <span>Open Approvals Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {financeQueue.filter((c) => c.status === 'FINANCE_REVIEW').length > 0 && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-600 text-white rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-sky-950">
                Finance Verification Queue: {financeQueue.filter((c) => c.status === 'FINANCE_REVIEW').length} claim(s) ready for review
              </h4>
              <p className="text-xs text-sky-800">
                Verify settlement calculations, policy exceptions, and authorize payment/recovery.
              </p>
            </div>
          </div>
          <Link
            href="/finance"
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <span>Open Finance Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Featured Golden Path Trip Card */}
      {goldenPathTrip && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 border border-indigo-700/50 shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-semibold">
                  Primary Assignment Golden-Path Demo Trip
                </span>
                <span className="text-xs font-mono text-slate-300">TR/2026/0612</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Bengaluru &middot; Vertex Technologies Site Visit
              </h3>
              <p className="text-xs text-slate-300">
                16-Jun-2026 to 20-Jun-2026 &middot; Advance Disbursed: <span className="font-semibold text-white">₹20,000.00</span> (Ref: ADV/2026/0619)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/settlements/${goldenPathTrip.id}`}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition"
              >
                <Receipt className="w-4 h-4" />
                <span>Open Expense Settlement Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Travel Requests</span>
            <Plane className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{myRequests.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Total trips registered in system</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 text-xs font-medium mb-1">
            <span>Pending In Workflow</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-800">{pendingCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Under approval or finance review</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Travel Advances Active</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalAdvances)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Disbursed advances to be settled</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium mb-1">
            <span>Settled Payouts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{formatCurrency(totalSettledPayables)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Completed reimbursement payouts</p>
        </div>
      </div>

      {/* Travel Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Travel Requests & Settlements</h3>
            <p className="text-xs text-slate-500">Track trip approvals, advances, and expense settlements</p>
          </div>

          <Link
            href="/requests/new"
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-3 py-1.5 rounded-lg transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Request</span>
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Plane className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No travel requests found</p>
            <p className="text-xs text-slate-400 mt-1">Create a new travel request to initiate the approval workflow.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-3.5">Request #</th>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Destination & Purpose</th>
                  <th className="px-6 py-3.5">Travel Dates</th>
                  <th className="px-6 py-3.5">Estimated / Advance</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      <Link href={`/requests/${req.id}`} className="hover:text-indigo-600">
                        {req.requestNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{req.employee?.name}</p>
                      <p className="text-[11px] text-slate-500">{req.employee?.designation}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{req.destination}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{req.purpose}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                      {formatDate(req.startDate)} - {formatDate(req.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-semibold text-slate-900">{formatCurrency(req.estimatedCost)}</p>
                      <p className="text-[11px] text-slate-500">
                        Adv: {req.advanceDisbursed > 0 ? formatCurrency(req.advanceDisbursed) : formatCurrency(req.advanceRequested)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <Link
                        href={`/requests/${req.id}`}
                        className="inline-flex items-center px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                      >
                        Details
                      </Link>

                      {['APPROVED', 'SETTLEMENT_DRAFT', 'SETTLEMENT_SUBMITTED', 'FINANCE_REVIEW', 'PAYMENT_PENDING', 'RECOVERY_DUE', 'PAID', 'RECOVERED', 'RETURNED'].includes(req.status) && (
                        <Link
                          href={`/settlements/${req.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Expenses</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

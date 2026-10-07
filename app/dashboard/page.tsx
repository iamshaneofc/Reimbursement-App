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
  Wallet,
  Receipt,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
        <p className="text-xs font-semibold">Loading enterprise expense workspace...</p>
      </div>
    );
  }

  // User scope metrics
  const myRequests = requests.filter((r) => !user || r.employeeId === user.id);
  const activeTripsCount = myRequests.filter((r) => ['APPROVED', 'SETTLEMENT_DRAFT', 'SETTLEMENT_SUBMITTED'].includes(r.status)).length;
  const pendingApprovalsCount = myRequests.filter((r) => ['PENDING_APPROVAL', 'FINANCE_REVIEW'].includes(r.status)).length;
  const draftsCount = myRequests.filter((r) => r.status === 'DRAFT').length;
  const returnedCount = myRequests.filter((r) => r.status === 'RETURNED').length;

  const totalAdvancesActive = myRequests
    .filter((r) => !['PAID', 'RECOVERED', 'REJECTED'].includes(r.status))
    .reduce((sum, r) => sum + (r.advanceDisbursed || 0), 0);

  const totalReimbursedYTD = myRequests
    .filter((r) => r.status === 'PAID')
    .reduce((sum, r) => sum + (r.settlementSummary?.netPayableAmount || 0), 0);

  const totalSpentYTD = myRequests
    .filter((r) => ['PAID', 'RECOVERED', 'SETTLEMENT_SUBMITTED', 'FINANCE_REVIEW', 'PAYMENT_PENDING'].includes(r.status))
    .reduce((sum, r) => sum + (r.settlementSummary?.eligibleTotal || r.estimatedCost || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Expense & Travel Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome back, <strong className="text-slate-800">{user?.name}</strong> &middot; {user?.designation} &middot; Cost Centre: <span className="font-mono text-slate-700">{user?.costCentre}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/requests/new"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Request</span>
          </Link>
        </div>
      </div>

      {/* Actionable Alerts if any */}
      {returnedCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Action Required: {returnedCount} claim(s) returned for correction</p>
              <p className="text-[11px] text-rose-700">Please review approver remarks, adjust expenses or proofs, and resubmit.</p>
            </div>
          </div>
          <Link
            href="/requests?status=RETURNED"
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs"
          >
            Review Returned Claims
          </Link>
        </div>
      )}

      {pendingApprovals.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Management Tasks: {pendingApprovals.length} request(s) awaiting your decision</p>
              <p className="text-[11px] text-amber-800">Review employee travel estimates, advance requests, and governance thresholds.</p>
            </div>
          </div>
          <Link
            href="/approvals"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs"
          >
            Open Approvals ({pendingApprovals.length})
          </Link>
        </div>
      )}

      {financeQueue.filter((c) => c.status === 'FINANCE_REVIEW').length > 0 && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-sky-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <p className="font-bold">Finance Shared Services: {financeQueue.filter((c) => c.status === 'FINANCE_REVIEW').length} claim(s) ready for verification</p>
              <p className="text-[11px] text-sky-800">Review policy exceptions, folio deductions, and authorize payment/recovery runs.</p>
            </div>
          </div>
          <Link
            href="/finance"
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs"
          >
            Open Finance Center
          </Link>
        </div>
      )}

      {/* 4 Compact Enterprise KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Requests */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>My Active Requests</span>
            <Plane className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{myRequests.length}</div>
          <p className="text-[11px] text-slate-500">
            {activeTripsCount} in settlement &middot; {draftsCount} drafts
          </p>
        </div>

        {/* Card 2: In Approval Review */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
            <span>Awaiting Decisions</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800">{pendingApprovalsCount}</div>
          <p className="text-[11px] text-slate-500">Under manager or finance review</p>
        </div>

        {/* Card 3: Active Travel Advances */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Travel Advances</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{formatCurrency(totalAdvancesActive)}</div>
          <p className="text-[11px] text-slate-500">Credited advances to be offset</p>
        </div>

        {/* Card 4: Reimbursed YTD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
            <span>Reimbursed Payouts (YTD)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{formatCurrency(totalReimbursedYTD)}</div>
          <p className="text-[11px] text-slate-500">Net employee reimbursements</p>
        </div>
      </div>

      {/* Main Content Grid: Active Requests Table + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Travel Requests Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Travel Requests & Settlements</h3>
              <p className="text-xs text-slate-500">All travel authorizations, advance offsets and claims</p>
            </div>
            <Link
              href="/requests"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              View All &rarr;
            </Link>
          </div>

          {requests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No travel requests found</p>
              <Link
                href="/requests/new"
                className="inline-block px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                Create Request
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-5 py-3">Request #</th>
                    <th className="px-5 py-3">Destination</th>
                    <th className="px-5 py-3">Dates</th>
                    <th className="px-5 py-3">Estimate / Adv</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.slice(0, 6).map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        <Link href={`/requests/${req.id}`} className="hover:text-indigo-600">
                          {req.requestNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">{req.destination}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{req.purpose}</p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                        {formatDate(req.startDate)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="font-semibold text-slate-900">{formatCurrency(req.estimatedCost)}</p>
                        {req.advanceDisbursed > 0 && (
                          <p className="text-[10px] text-slate-500">Adv: {formatCurrency(req.advanceDisbursed)}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-1.5">
                        <Link
                          href={`/requests/${req.id}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                        >
                          Details
                        </Link>
                        {['APPROVED', 'SETTLEMENT_DRAFT', 'SETTLEMENT_SUBMITTED', 'FINANCE_REVIEW', 'PAYMENT_PENDING', 'RECOVERY_DUE', 'PAID', 'RECOVERED', 'RETURNED'].includes(req.status) && (
                          <Link
                            href={`/settlements/${req.id}`}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                          >
                            Expenses
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

        {/* Right 1 Col: Quick Hub & Policy Fast-Facts */}
        <div className="space-y-4">
          {/* Quick Actions Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Shortcuts
            </h3>
            <div className="space-y-2">
              <Link
                href="/requests/new"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 transition group text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-slate-800 group-hover:text-indigo-900">New Request Hub</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/settlements"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 transition group text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800 group-hover:text-indigo-900">Active Settlements</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/evidence"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 transition group text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-sky-600" />
                  <span className="font-semibold text-slate-800 group-hover:text-indigo-900">Evidence Vault</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

          {/* Policy Fast Facts */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Policy NTX-HR-POL-11 Caps
            </h3>
            <ul className="space-y-2 text-slate-600 text-[11px]">
              <li className="flex items-start justify-between gap-2 pb-1.5 border-b border-slate-200">
                <span>Tier 1 Lodging (BLR, BOM, DEL, etc.)</span>
                <strong className="text-slate-900">₹6,000/night</strong>
              </li>
              <li className="flex items-start justify-between gap-2 pb-1.5 border-b border-slate-200">
                <span>Tier 2 Lodging</span>
                <strong className="text-slate-900">₹4,000/night</strong>
              </li>
              <li className="flex items-start justify-between gap-2 pb-1.5 border-b border-slate-200">
                <span>Meals Allowance (Tier 1)</span>
                <strong className="text-slate-900">₹1,500/day</strong>
              </li>
              <li className="flex items-start justify-between gap-2 pb-1.5 border-b border-slate-200">
                <span>Max Advance Permitted</span>
                <strong className="text-indigo-700 font-bold">60% of Est</strong>
              </li>
              <li className="flex items-start justify-between gap-2">
                <span>Settlement Submission Window</span>
                <strong className="text-slate-900">7 Days</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

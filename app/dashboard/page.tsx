'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Plane,
  PlusCircle,
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
  Building2,
  CheckSquare,
  XCircle,
  BarChart3,
  CreditCard,
  Layers,
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [approvalsData, setApprovalsData] = useState<{
    approvals: any[];
    stats: {
      pendingCount: number;
      approvedCount: number;
      rejectedCount: number;
      returnedCount: number;
      avgDecisionHours: string;
    };
  }>({
    approvals: [],
    stats: { pendingCount: 0, approvedCount: 0, rejectedCount: 0, returnedCount: 0, avgDecisionHours: '2.4' },
  });
  const [financeQueue, setFinanceQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);

          // Fetch personal / org requests
          const reqsRes = await fetch('/api/requests');
          if (reqsRes.ok) {
            const reqsData = await reqsRes.json();
            setRequests(reqsData.requests || []);
          }

          // If manager or admin, fetch approvals & manager stats
          const isApproverRole = ['Reporting Manager', 'Head of Department', 'Head of Division', 'MD', 'Admin', 'Manager'].includes(userData.user?.role);
          if (isApproverRole) {
            const appRes = await fetch('/api/approvals');
            if (appRes.ok) {
              const appData = await appRes.json();
              setApprovalsData({
                approvals: appData.approvals || [],
                stats: appData.stats || { pendingCount: 0, approvedCount: 0, rejectedCount: 0, returnedCount: 0, avgDecisionHours: '2.4' },
              });
            }
          }

          // If finance or admin, fetch finance queue
          const isFinanceRole = ['Finance', 'Admin'].includes(userData.user?.role);
          if (isFinanceRole) {
            const finRes = await fetch('/api/finance/queue');
            if (finRes.ok) {
              const finData = await finRes.json();
              setFinanceQueue(finData.claims || []);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
        <p className="text-xs font-semibold">Loading enterprise workspace...</p>
      </div>
    );
  }

  const role = user?.role || 'Employee';
  const isManager = ['Reporting Manager', 'Head of Department', 'Head of Division', 'MD', 'Manager'].includes(role);
  const isAdmin = role === 'Admin';
  const isFinance = role === 'Finance';

  // Personal scope metrics (Manager is also an Employee!)
  const myRequests = requests.filter((r) => r.employeeId === user?.id);
  const activeTripsCount = myRequests.filter((r) => ['APPROVED', 'SETTLEMENT_DRAFT', 'SETTLEMENT_SUBMITTED'].includes(r.status)).length;
  const pendingApprovalsCount = myRequests.filter((r) => ['PENDING_APPROVAL', 'FINANCE_REVIEW'].includes(r.status)).length;
  const returnedCount = myRequests.filter((r) => r.status === 'RETURNED').length;

  const totalAdvancesActive = myRequests
    .filter((r) => !['PAID', 'RECOVERED', 'REJECTED'].includes(r.status))
    .reduce((sum, r) => sum + (r.advanceDisbursed || 0), 0);

  const totalReimbursedYTD = myRequests
    .filter((r) => r.status === 'PAID')
    .reduce((sum, r) => sum + (r.settlementSummary?.netPayableAmount || 0), 0);

  // Admin Organisation-Wide Metrics
  const orgTotalSpend = requests.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
  const orgPendingApprovalCount = requests.filter((r) => r.status === 'PENDING_APPROVAL').length;
  const orgToVerifyCount = financeQueue.filter((c) => c.status === 'FINANCE_REVIEW').length;
  const orgReadyToPayCount = financeQueue.filter((c) => c.status === 'PAYMENT_PENDING').length;
  const orgApprovedAwaitingPayment = requests.filter((r) => ['APPROVED', 'SETTLEMENT_SUBMITTED', 'FINANCE_REVIEW'].includes(r.status)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isAdmin ? 'Organisation Oversight & Administration' : isManager ? 'Management & Expense Workspace' : isFinance ? 'Finance Operations & Audit' : 'My Travel & Expense Dashboard'}
            </h1>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {role}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, <strong className="text-slate-800">{user?.name}</strong> &middot; {user?.designation} &middot; Cost Centre: <span className="font-mono text-slate-700">{user?.costCentre}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {(!isFinance || isAdmin) && (
            <Link
              href="/requests/new"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Request</span>
            </Link>
          )}
        </div>
      </div>

      {/* Actionable Alerts */}
      {returnedCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Action Required: {returnedCount} claim(s) returned for correction</p>
              <p className="text-[11px] text-rose-700">Please review manager remarks, adjust expenses/proofs, and resubmit.</p>
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

      {/* 1. MANAGER APPROVAL DASHBOARD (Section 3 of requirements) */}
      {isManager && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <span>Manager Approval Workspace</span>
            </h2>
            <Link href="/approvals" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              Go to Approvals Queue &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Pending Approvals */}
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
                <span>Pending Approvals</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-amber-900">{approvalsData.stats.pendingCount}</div>
              <p className="text-[11px] text-slate-500">Awaiting your decision</p>
            </div>

            {/* Card 2: Approved by Me */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
                <span>Approved by Me</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-800">{approvalsData.stats.approvedCount}</div>
              <p className="text-[11px] text-slate-500">Personal approval history</p>
            </div>

            {/* Card 3: Rejected by Me */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-rose-700 text-xs font-medium">
                <span>Rejected by Me</span>
                <XCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-extrabold text-rose-800">{approvalsData.stats.rejectedCount}</div>
              <p className="text-[11px] text-slate-500">Non-compliant claims</p>
            </div>

            {/* Card 4: Sent Back by Me */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-indigo-700 text-xs font-medium">
                <span>Sent Back by Me</span>
                <RotateCcw className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-indigo-800">{approvalsData.stats.returnedCount}</div>
              <p className="text-[11px] text-slate-500">Returned for correction</p>
            </div>

            {/* Card 5: Average Decision Time */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
                <span>Avg Decision Time</span>
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{approvalsData.stats.avgDecisionHours}h</div>
              <p className="text-[11px] text-slate-500">SLA compliance target: 24h</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADMIN ORGANISATION-WIDE METRICS (Section 7 of requirements) */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Organisation Operations & Oversight</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Organisation Spend</span>
                <Wallet className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{formatCurrency(orgTotalSpend)}</div>
              <p className="text-[11px] text-slate-500">Total requested across company</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
                <span>Pending Across Organisation</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-amber-800">{orgPendingApprovalCount}</div>
              <p className="text-[11px] text-slate-500">Awaiting management approvals</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-sky-700 text-xs font-medium">
                <span>To Verify Before Payout</span>
                <ShieldCheck className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-extrabold text-sky-800">{orgToVerifyCount}</div>
              <p className="text-[11px] text-slate-500">In Finance Shared Services review</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
                <span>Verified, Ready to Pay</span>
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-700">{orgReadyToPayCount}</div>
              <p className="text-[11px] text-slate-500">Authorized for payment disbursement</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. FINANCE METRICS */}
      {isFinance && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Finance Shared Services Operations</span>
            </h2>
            <Link href="/finance" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              Open Finance Workspace &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-sky-700 text-xs font-medium">
                <span>Claims for Audit & Verification</span>
                <ShieldCheck className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-extrabold text-sky-800">
                {financeQueue.filter((c) => c.status === 'FINANCE_REVIEW').length}
              </div>
              <p className="text-[11px] text-slate-500">Evidence reconciliation & policy review</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
                <span>Ready for Payment Release</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-800">
                {financeQueue.filter((c) => c.status === 'PAYMENT_PENDING').length}
              </div>
              <p className="text-[11px] text-slate-500">Verified claims awaiting payout dispatch</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
                <span>Payroll Recovery Due</span>
                <RotateCcw className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-amber-800">
                {financeQueue.filter((c) => c.status === 'RECOVERY_DUE').length}
              </div>
              <p className="text-[11px] text-slate-500">Unused advance deductions</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. PERSONAL REIMBURSEMENTS & RECENT ACTIVITY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Plane className="w-4 h-4 text-indigo-600" />
            <span>{isAdmin ? 'All Organisation Claims' : isManager ? 'My Personal Travel & Reimbursement Requests' : 'My Requests & Settlements'}</span>
          </h2>
          <Link href="/requests" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
            View All ({myRequests.length}) &rarr;
          </Link>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No travel requests found</p>
              <Link
                href="/requests/new"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                <span>Create your first travel request</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Request #</th>
                    {isAdmin && <th className="py-3 px-4">Employee</th>}
                    <th className="py-3 px-4">Trip Details</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Estimate</th>
                    <th className="py-3 px-4">Advance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.slice(0, 6).map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <Link href={`/requests/${req.id}`} className="hover:text-indigo-600">
                          {req.requestNumber}
                        </Link>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {req.employee?.name}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{req.destination}</div>
                        <div className="text-[10px] text-slate-500">{req.purpose}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(req.startDate)} &ndash; {formatDate(req.endDate)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {formatCurrency(req.estimatedCost)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {req.advanceRequested > 0 ? (
                          <span className="font-semibold text-indigo-600">
                            {formatCurrency(req.advanceRequested)}
                          </span>
                        ) : (
                          <span className="text-slate-400">&mdash;</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/requests/${req.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 group-hover:text-indigo-800"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

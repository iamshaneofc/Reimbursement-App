'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Receipt, Search, Filter, ArrowRight, Wallet, CheckCircle2, Clock, PlusCircle } from 'lucide-react';

export default function SettlementsListPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetch('/api/requests')
      .then((res) => res.json())
      .then((data) => {
        // Filter requests that are at or beyond approval stage, or have settlement activity
        const allReqs = data.requests || [];
        setRequests(allReqs);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const settlementEligibleRequests = requests.filter((req) => {
    // Show all requests that are approved or have expenses/settlements
    return (
      ['APPROVED', 'SETTLEMENT_DRAFT', 'SETTLEMENT_SUBMITTED', 'FINANCE_REVIEW', 'PAYMENT_PENDING', 'RECOVERY_DUE', 'PAID', 'RECOVERED', 'RETURNED'].includes(req.status) ||
      (req.expenses && req.expenses.length > 0)
    );
  });

  const filtered = settlementEligibleRequests.filter((req) => {
    const matchesSearch =
      req.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.employee?.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'ACTIVE') return matchesSearch && ['APPROVED', 'SETTLEMENT_DRAFT', 'RETURNED'].includes(req.status);
    if (statusFilter === 'REVIEW') return matchesSearch && ['SETTLEMENT_SUBMITTED', 'FINANCE_REVIEW'].includes(req.status);
    if (statusFilter === 'PAYMENT') return matchesSearch && ['PAYMENT_PENDING', 'RECOVERY_DUE'].includes(req.status);
    if (statusFilter === 'COMPLETED') return matchesSearch && ['PAID', 'RECOVERED'].includes(req.status);
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Expense Settlements</h1>
          <p className="text-xs text-slate-500">
            Submit trip expense receipts, review policy evaluations, and monitor finance reimbursement payouts
          </p>
        </div>

        <Link
          href="/requests/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Claim / Request</span>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search claim by request #, destination, employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Settlement Claims</option>
            <option value="ACTIVE">Draft / Ready for Submission</option>
            <option value="REVIEW">Under Finance Review</option>
            <option value="PAYMENT">Pending Payout / Recovery</option>
            <option value="COMPLETED">Settled & Completed</option>
          </select>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2" />
            <p className="text-xs">Loading settlement records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No settlement claims found</h4>
            <p className="text-xs text-slate-400">
              Approved travel requests ready for expense submission will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-3.5">Request #</th>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Trip Details</th>
                  <th className="px-6 py-3.5">Disbursed Advance</th>
                  <th className="px-6 py-3.5">Settlement Balance</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((req) => {
                  const summary = req.settlementSummary;
                  const isRecovery = summary?.settlementType === 'RECOVERY';
                  const isPayable = summary?.settlementType === 'PAYABLE';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        <Link href={`/settlements/${req.id}`} className="hover:text-indigo-600">
                          {req.requestNumber}
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{req.employee?.name}</p>
                        <p className="text-[11px] text-slate-500">{req.employee?.department} &middot; {req.employee?.costCentre}</p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{req.destination}</p>
                        <p className="text-[11px] text-slate-500">{formatDate(req.startDate)} - {formatDate(req.endDate)}</p>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-800">{formatCurrency(req.advanceDisbursed)}</p>
                        <p className="text-[10px] text-slate-400">Pre-trip advance</p>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {summary ? (
                          <div>
                            <p className={`font-bold text-xs ${
                              isRecovery ? 'text-orange-600' : isPayable ? 'text-emerald-700' : 'text-slate-800'
                            }`}>
                              {isRecovery
                                ? `Recovery: ${formatCurrency(summary.netRecoverableAmount)}`
                                : isPayable
                                ? `Payable: ${formatCurrency(summary.netPayableAmount)}`
                                : 'Balanced'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Claimed: {formatCurrency(summary.employeePaidTotal)} &middot; Eligible: {formatCurrency(summary.eligibleTotal)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Pending expense entry</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={req.status} />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/settlements/${req.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Open Workspace</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

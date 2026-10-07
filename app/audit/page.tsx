'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function AuditReportsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    fetch('/api/audit')
      .then((res) => res.json())
      .then((data) => setEvents(data.events || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter((ev) => {
    const matchesSearch =
      ev.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.actorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.actorRole?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.travelRequest?.requestNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.metadata?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || ev.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPROVE') || action.includes('PAYMENT') || action.includes('VERIFY')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('REJECT') || action.includes('DISALLOW')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (action.includes('RETURN') || action.includes('RECOVERY')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Compliance & Audit Log</h1>
              <p className="text-xs text-slate-500">
                Immutable chronological ledger of workflow transitions, approvals, policy evaluations, and payout runs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Total Audit Trail Events</p>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{events.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Recorded across all requests</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Approval & Workflow Transitions</p>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {events.filter((e) => ['SUBMIT_REQUEST', 'APPROVE_REQUEST', 'RETURN_REQUEST', 'REJECT_REQUEST'].includes(e.action)).length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Manager & hierarchy actions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Finance & Payout Authorizations</p>
          <div className="text-2xl font-extrabold text-indigo-700 mt-1">
            {events.filter((e) => ['VERIFY_FINANCE', 'PROCESS_PAYMENT', 'PROCESS_RECOVERY'].includes(e.action)).length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Settlement disbursements verified</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by actor, request #, action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Recorded Actions</option>
            <option value="CREATE_REQUEST">Request Created</option>
            <option value="SUBMIT_REQUEST">Request Submitted</option>
            <option value="APPROVE_REQUEST">Approved by Manager</option>
            <option value="RETURN_REQUEST">Returned by Manager</option>
            <option value="REJECT_REQUEST">Rejected</option>
            <option value="ADD_EXPENSE">Expense Added</option>
            <option value="SUBMIT_SETTLEMENT">Settlement Submitted</option>
            <option value="VERIFY_FINANCE">Finance Verification</option>
            <option value="PROCESS_PAYMENT">Payment Released</option>
            <option value="PROCESS_RECOVERY">Recovery Processed</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2" />
            <p className="text-xs">Loading audit ledger...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <History className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No matching audit events</h4>
            <p className="text-xs text-slate-400">Try changing your search terms or filter selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Actor (Role)</th>
                  <th className="px-6 py-3.5">Target Request</th>
                  <th className="px-6 py-3.5">Status Transition</th>
                  <th className="px-6 py-3.5">Metadata & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {new Date(ev.createdAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeColor(ev.action)}`}>
                        {ev.action}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{ev.actorName}</p>
                      <p className="text-[11px] text-slate-500">
                        {ev.actorRole} {ev.actor?.empCode ? `(${ev.actor.empCode})` : ''}
                      </p>
                    </td>

                    <td className="px-6 py-4 font-mono font-bold">
                      {ev.travelRequest ? (
                        <Link
                          href={`/requests/${ev.travelRequest.id}`}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          {ev.travelRequest.requestNumber}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {ev.fromStatus || ev.toStatus ? (
                        <div className="flex items-center gap-1 text-[11px] font-mono">
                          <span className="text-slate-500">{ev.fromStatus || 'START'}</span>
                          <span className="text-slate-400">&rarr;</span>
                          <span className="font-bold text-slate-800">{ev.toStatus}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate text-[11px]">
                      {ev.metadata || '—'}
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

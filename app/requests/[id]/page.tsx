'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { ApprovalChainProgress } from '@/components/ApprovalChainProgress';
import { FinancialSummaryCard } from '@/components/FinancialSummaryCard';
import { AuditTimeline } from '@/components/AuditTimeline';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Plane,
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
  Wallet,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Send,
  Building,
  User,
} from 'lucide-react';

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [request, setRequest] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [dialogAction, setDialogAction] = useState<'APPROVE' | 'REJECT' | 'RETURN' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [userRes, reqRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/requests/${id}`),
      ]);

      if (userRes.ok) {
        const u = await userRes.json();
        setCurrentUser(u.user);
      }

      if (reqRes.ok) {
        const r = await reqRes.json();
        setRequest(r.request);
      } else {
        const err = await reqRes.json();
        setError(err.error || 'Failed to load request');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSubmitRequest = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${id}/submit`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg('Travel request submitted for approval!');
      loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResubmitRequest = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${id}/resubmit`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg('Request resubmitted successfully!');
      loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecision = async (action: 'APPROVE' | 'REJECT' | 'RETURN') => {
    setActionLoading(true);
    setError(null);
    try {
      const endpoint = action === 'APPROVE'
        ? `/api/requests/${id}/approve`
        : action === 'REJECT'
        ? `/api/requests/${id}/reject`
        : `/api/requests/${id}/return`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg(data.message || `Action ${action} completed`);
      setDialogAction(null);
      setRemarks('');
      loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
        <p className="text-sm">Loading travel request details...</p>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-center text-rose-800">
          <XCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h2 className="text-base font-bold">Unable to Load Request</h2>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
          <Link href="/dashboard" className="inline-block mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Check if current user can approve this step
  const currentStep = request.approvalSteps?.find(
    (s: any) => s.sequence === request.currentStepSequence && s.status === 'PENDING'
  );
  const isCurrentApprover =
    currentStep &&
    currentUser &&
    (currentStep.approverId === currentUser.id ||
      currentUser.role === 'Admin' ||
      currentUser.role === currentStep.role);
  const isOwner = currentUser && request.employeeId === currentUser.id;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link href="/requests" className="flex items-center gap-1 hover:text-slate-900 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Travel Requests</span>
        </Link>
        <span className="font-mono text-slate-400">ID: {request.id}</span>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Main Request Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                {request.requestNumber}
              </span>
              <StatusBadge status={request.status} />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {request.destination}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(request.startDate)} &mdash; {formatDate(request.endDate)}
              </span>
              <span>&middot;</span>
              <span>Mode: {request.mode}</span>
              <span>&middot;</span>
              <span>Class: {request.cityClass}</span>
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {request.status === 'DRAFT' && isOwner && (
              <button
                disabled={actionLoading}
                onClick={handleSubmitRequest}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Approval</span>
              </button>
            )}

            {request.status === 'RETURNED' && isOwner && (
              <button
                disabled={actionLoading}
                onClick={handleResubmitRequest}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resubmit Claim</span>
              </button>
            )}

            {['APPROVED', 'SETTLEMENT_DRAFT', 'SETTLEMENT_SUBMITTED', 'FINANCE_REVIEW', 'PAYMENT_PENDING', 'RECOVERY_DUE', 'PAID', 'RECOVERED', 'RETURNED'].includes(request.status) && (
              <Link
                href={`/settlements/${request.id}`}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition"
              >
                <Receipt className="w-4 h-4" />
                <span>Open Expense Settlement Workspace</span>
              </Link>
            )}
          </div>
        </div>

        {/* Returned / Rejected Banner if applicable */}
        {request.returnRemarks && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold mb-1">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>Returned with remarks for employee correction:</span>
            </div>
            <p className="italic bg-white/70 p-2 rounded-xl border border-amber-200/60">
              &ldquo;{request.returnRemarks}&rdquo;
            </p>
          </div>
        )}

        {request.rejectionReason && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900">
            <div className="flex items-center gap-2 font-bold mb-1">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Request rejected:</span>
            </div>
            <p className="italic bg-white/70 p-2 rounded-xl border border-rose-200/60">
              &ldquo;{request.rejectionReason}&rdquo;
            </p>
          </div>
        )}

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Employee details */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <User className="w-3.5 h-3.5" />
              <span>Claimant Profile</span>
            </div>
            <p className="text-sm font-bold text-slate-900">{request.employee?.name}</p>
            <p className="text-xs text-slate-600">{request.employee?.designation}</p>
            <p className="text-[11px] text-slate-500">
              Code: <span className="font-mono font-semibold text-slate-700">{request.employee?.empCode}</span> &middot; Dept: {request.employee?.department}
            </p>
            <p className="text-[11px] text-slate-500">Cost Centre: {request.employee?.costCentre} &middot; Base: {request.employee?.city}</p>
          </div>

          {/* Purpose and Travel Scope */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>Travel Scope</span>
            </div>
            <p className="text-xs font-semibold text-slate-900">{request.destination}</p>
            <p className="text-xs text-slate-600">{request.purpose}</p>
            <div className="mt-2 text-[11px] text-slate-500">
              <span>Category: <strong className="text-slate-700">{request.category}</strong></span> &middot;{' '}
              <span>Mode: <strong className="text-slate-700">{request.mode}</strong></span>
            </div>
          </div>

          {/* Estimates & Advances */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Wallet className="w-3.5 h-3.5" />
              <span>Estimated Budget & Advance</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Estimated Cost:</span>
              <span className="font-bold text-slate-900">{formatCurrency(request.estimatedCost)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Employee-Borne Est:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(request.employeeBorneEstimate)}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
              <span className="text-slate-700 font-medium">Advance Disbursed:</span>
              <span className="font-bold text-indigo-700">
                {formatCurrency(request.advanceDisbursed || request.advanceRequested)}
              </span>
            </div>
            {request.advanceReference && (
              <p className="text-[10px] text-slate-400 font-mono">Ref: {request.advanceReference}</p>
            )}
          </div>
        </div>

        {/* Manager Action Bar if current step is pending for this user */}
        {isCurrentApprover && request.status === 'PENDING_APPROVAL' && (
          <div className="bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border-2 border-amber-300 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Manager Approval Action Required</h4>
                <p className="text-xs text-slate-600">
                  You are assigned to evaluate Level {currentStep.sequence} ({currentStep.role}) for this travel request.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => setDialogAction('APPROVE')}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Request</span>
              </button>

              <button
                disabled={actionLoading}
                onClick={() => setDialogAction('RETURN')}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Return with Remarks</span>
              </button>

              <button
                disabled={actionLoading}
                onClick={() => setDialogAction('REJECT')}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        )}

        {/* Multi-Tier Approval Chain Visualizer */}
        <ApprovalChainProgress
          steps={request.approvalSteps || []}
          currentSequence={request.currentStepSequence}
          overallStatus={request.status}
        />
      </div>

      {/* If settlement has expenses, show financial summary card */}
      {request.settlementSummary && request.expenses?.length > 0 && (
        <FinancialSummaryCard summary={request.settlementSummary} />
      )}

      {/* Audit Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Audit Trail & Workflow Timeline</h3>
        <p className="text-xs text-slate-500 mb-6">
          Immutable event log of all requests, approvals, reviews, and status changes
        </p>

        <AuditTimeline events={request.auditEvents || []} />
      </div>

      {/* Approver Decision Modal */}
      {dialogAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-elevation border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {dialogAction === 'APPROVE' && 'Confirm Approval'}
              {dialogAction === 'RETURN' && 'Return Request to Employee'}
              {dialogAction === 'REJECT' && 'Confirm Rejection'}
            </h3>

            <p className="text-xs text-slate-600">
              {dialogAction === 'APPROVE' && 'Approve this request to advance to next level or release travel advance.'}
              {dialogAction === 'RETURN' && 'Enter remarks explaining what the employee needs to correct before resubmission.'}
              {dialogAction === 'REJECT' && 'Rejecting this request will permanently terminate this travel authorization.'}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Remarks / Notes {dialogAction !== 'APPROVE' && <span className="text-rose-500">* (Mandatory)</span>}
              </label>
              <textarea
                rows={3}
                required={dialogAction !== 'APPROVE'}
                placeholder={dialogAction === 'APPROVE' ? 'Optional approval remarks' : 'Mandatory explanation for return/rejection...'}
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
                  setRemarks('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                disabled={actionLoading || (dialogAction !== 'APPROVE' && !remarks.trim())}
                onClick={() => handleDecision(dialogAction)}
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

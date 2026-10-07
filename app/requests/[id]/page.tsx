'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { WorkflowProgress6Step } from '@/components/WorkflowProgress6Step';
import { ApprovalChainProgress } from '@/components/ApprovalChainProgress';
import { FinancialSummaryCard } from '@/components/FinancialSummaryCard';
import { PolicyResultCallout } from '@/components/PolicyResultCallout';
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
  FolderOpen,
  History,
  Eye,
  FileImage,
  X,
  Upload,
  Download,
  Paperclip,
  ShieldCheck,
} from 'lucide-react';

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [request, setRequest] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EXPENSES' | 'EVIDENCE' | 'APPROVALS' | 'SETTLEMENT' | 'AUDIT'>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [dialogAction, setDialogAction] = useState<'APPROVE' | 'REJECT' | 'RETURN' | null>(null);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
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
      setSuccessMsg('Travel request submitted for management approval!');
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
    if (currentUser?.role === 'Admin') return;
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

  const handleDirectUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploadProgress(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const res = await fetch(`/api/requests/${id}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setSuccessMsg(`Document "${uploadFile.name}" successfully uploaded and attached to request!`);
      setIsUploadModalOpen(false);
      setUploadFile(null);
      loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
        <p className="text-xs font-semibold">Loading request details...</p>
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
          <Link href="/requests" className="inline-block mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold">
            Back to Requests
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = request.approvalSteps?.find(
    (s: any) => s.sequence === request.currentStepSequence && s.status === 'PENDING'
  );
  const isCurrentApprover =
    currentStep &&
    currentUser &&
    currentUser.role !== 'Admin' &&
    (currentStep.approverId === currentUser.id ||
      currentUser.role === currentStep.role);
  const isOwner = currentUser && request.employeeId === currentUser.id;
  const expensesList = request.expenses || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link href="/requests" className="flex items-center gap-1 hover:text-slate-800 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Travel Requests</span>
        </Link>
        <span className="font-mono text-slate-400">Request #{request.requestNumber}</span>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800 font-medium">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Request Header Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                {request.requestNumber}
              </span>
              <StatusBadge status={request.status} />
              <span className="text-xs text-slate-400">&middot;</span>
              <span className="text-xs text-slate-500">{request.category} Travel</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {request.destination}
            </h1>

            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(request.startDate)} &mdash; {formatDate(request.endDate)}
              </span>
              <span>&middot;</span>
              <span>Claimant: <strong className="text-slate-800">{request.employee?.name}</strong> ({request.employee?.designation})</span>
              <span>&middot;</span>
              <span>Cost Centre: <strong className="font-mono text-slate-700">{request.employee?.costCentre}</strong></span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {request.status === 'DRAFT' && isOwner && (
              <button
                disabled={actionLoading}
                onClick={handleSubmitRequest}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Approval</span>
              </button>
            )}

            {request.status === 'RETURNED' && isOwner && (
              <button
                disabled={actionLoading}
                onClick={handleResubmitRequest}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resubmit Claim</span>
              </button>
            )}

            {['APPROVED', 'SETTLEMENT_DRAFT', 'SETTLEMENT_SUBMITTED', 'FINANCE_REVIEW', 'PAYMENT_PENDING', 'RECOVERY_DUE', 'PAID', 'RECOVERED', 'RETURNED'].includes(request.status) && (
              <Link
                href={`/settlements/${request.id}`}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Open Expense Settlement</span>
              </Link>
            )}
          </div>
        </div>

        {/* Manager Action Banner if pending */}
        {isCurrentApprover && request.status === 'PENDING_APPROVAL' && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
            <div>
              <p className="font-bold">Manager Decision Required (Level {currentStep.sequence}: {currentStep.role})</p>
              <p className="text-[11px] text-amber-800">You are the assigned governance approver for this travel authorization.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDialogAction('APPROVE')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs"
              >
                Approve
              </button>
              <button
                onClick={() => setDialogAction('RETURN')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs"
              >
                Return
              </button>
              <button
                onClick={() => setDialogAction('REJECT')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-2xs"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {/* Admin Read-Only Info Banner if pending */}
        {currentUser?.role === 'Admin' && request.status === 'PENDING_APPROVAL' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-indigo-900">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Admin Read-Only Oversight:</strong> You have audit visibility into this travel authorization. Approvals, returns, and rejections are strictly governed by the assigned manager in the reporting hierarchy.
            </span>
          </div>
        )}

        {/* 6-Step Workflow Component */}
        <WorkflowProgress6Step request={request} />
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'OVERVIEW' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Trip Overview
        </button>

        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'EXPENSES' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Claim Expenses</span>
          {expensesList.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'EXPENSES' ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-700'
            }`}>
              {expensesList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('EVIDENCE')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'EVIDENCE' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Evidence & Proofs</span>
          {expensesList.filter((e: any) => e.proofRef).length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'EVIDENCE' ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-700'
            }`}>
              {expensesList.filter((e: any) => e.proofRef).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('APPROVALS')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'APPROVALS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Approval Chain
        </button>

        <button
          onClick={() => setActiveTab('SETTLEMENT')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'SETTLEMENT' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Financial Breakdown
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'AUDIT' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Audit Activity Log
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* Tab 1: Overview */}
      {activeTab === 'OVERVIEW' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6">
          <h3 className="text-sm font-bold text-slate-900">Trip & Claimant Overview</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Claimant:</span>
                <span className="font-bold text-slate-900">{request.employee?.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Employee Code:</span>
                <span className="font-mono font-bold text-slate-800">{request.employee?.empCode}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Designation & Dept:</span>
                <span className="text-slate-800">{request.employee?.designation} &middot; {request.employee?.department}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Cost Centre:</span>
                <span className="font-mono font-bold text-slate-800">{request.employee?.costCentre}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Destination:</span>
                <span className="font-bold text-slate-900">{request.destination} ({request.cityClass})</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Travel Dates:</span>
                <span className="text-slate-800">{formatDate(request.startDate)} to {formatDate(request.endDate)}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Total Estimated Spend:</span>
                <span className="font-bold text-slate-900">{formatCurrency(request.estimatedCost)}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Advance Disbursed:</span>
                <span className="font-bold text-indigo-700">{formatCurrency(request.advanceDisbursed || request.advanceRequested)}</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs font-bold text-slate-700">Business Purpose & Scope:</span>
            <p className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 italic">
              {request.purpose}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Expenses Table */}
      {activeTab === 'EXPENSES' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Claim Expenses ({expensesList.length})</h3>
              <p className="text-xs text-slate-500">Line items validated against Nortex Travel Policy NTX-HR-POL-11</p>
            </div>
            <Link
              href={`/settlements/${request.id}`}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
            >
              Open Settlement Workspace
            </Link>
          </div>

          {expensesList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No expenses recorded yet. Click &ldquo;Open Settlement Workspace&rdquo; to add expense lines.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Category & Merchant</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Claimed</th>
                    <th className="px-4 py-3">Policy Status</th>
                    <th className="px-4 py-3">Eligible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expensesList.map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{exp.merchant}</p>
                        <p className="text-[11px] text-slate-500">{exp.category} &middot; {formatDate(exp.date)}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {exp.description}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={exp.status} />
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-700">
                        {formatCurrency(exp.eligibleAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Evidence */}
      {activeTab === 'EVIDENCE' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attached Evidence, Folios & Receipts</h3>
              <p className="text-xs text-slate-500">Supporting bills, invoices, boarding passes, and tax folio proofs</p>
            </div>

            <button
              onClick={() => {
                setUploadFile(null);
                setIsUploadModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          {/* Uploaded Documents List */}
          {request.documents && request.documents.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Uploaded Files ({request.documents.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {request.documents.map((doc: any) => (
                  <div key={doc.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileImage className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="font-bold text-slate-900 text-xs truncate max-w-[170px]">{doc.fileName}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                      <span>{formatDate(doc.uploadedAt)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => setPreviewProofUrl(doc.fileUrl)}
                        className="flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <a
                        href={doc.fileUrl}
                        download={doc.fileName}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expense Receipt Proofs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Expense Item Receipts ({expensesList.filter((e: any) => e.proofRef).length})
            </h4>

            {expensesList.filter((e: any) => e.proofRef).length === 0 && (!request.documents || request.documents.length === 0) ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                <FileImage className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No documents or receipts uploaded yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">Click &ldquo;Upload Document&rdquo; or open the Settlement Workspace to attach receipts.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {expensesList.filter((e: any) => e.proofRef).map((exp: any) => (
                  <div key={exp.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 truncate">{exp.merchant}</span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold">{formatCurrency(exp.amount)}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">{exp.description}</p>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-indigo-700 truncate max-w-[130px]">{exp.proofRef}</span>
                      <button
                        onClick={() => {
                          const url = exp.proofRef.startsWith('/')
                            ? exp.proofRef
                            : exp.proofRef.endsWith('.png') || exp.proofRef.endsWith('.jpg') || exp.proofRef.endsWith('.jpeg') || exp.proofRef.endsWith('.pdf')
                            ? `/receipts/${exp.proofRef}`
                            : exp.proofRef;
                          setPreviewProofUrl(url);
                        }}
                        className="flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Approvals & Governance */}
      {activeTab === 'APPROVALS' && (
        <div className="space-y-6">
          <ApprovalChainProgress
            steps={request.approvalSteps || []}
            currentSequence={request.currentStepSequence}
            overallStatus={request.status}
          />
        </div>
      )}

      {/* Tab 5: Settlement & Financials */}
      {activeTab === 'SETTLEMENT' && (
        <div className="space-y-6">
          {request.settlementSummary && (
            <FinancialSummaryCard summary={request.settlementSummary} />
          )}
        </div>
      )}

      {/* Tab 6: Audit Activity Log */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Audit Trail & Activity Log</h3>
          <p className="text-xs text-slate-500 mb-4">Immutable log of all approvals, transitions, and payout actions</p>
          <AuditTimeline events={request.auditEvents || []} />
        </div>
      )}

      {/* Decision Confirmation Modal */}
      {dialogAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-elevation border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {dialogAction === 'APPROVE' && 'Approve Travel Request'}
              {dialogAction === 'RETURN' && 'Return Request to Employee'}
              {dialogAction === 'REJECT' && 'Reject Travel Request'}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Remarks {dialogAction !== 'APPROVE' && <span className="text-rose-500">* (Mandatory)</span>}
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

      {/* Standalone Upload Evidence Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-elevation border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Upload Supporting Document</h3>
                  <p className="text-xs text-slate-500">Attach invoice, hotel bill, boarding pass, or approval email</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50 text-center hover:bg-slate-100/80 transition">
                <input
                  type="file"
                  id="directUploadPickerDetail"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <label htmlFor="directUploadPickerDetail" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                  <Paperclip className="w-8 h-8 text-sky-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {uploadFile ? uploadFile.name : 'Click to select or drag document here'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {uploadFile ? `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF, PNG, JPG, WEBP up to 10MB'}
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadProgress || !uploadFile}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {uploadProgress ? 'Uploading...' : 'Upload & Attach to Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Preview & Download Modal */}
      {previewProofUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-elevation border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Receipt / Bill Proof Document</h3>
              <div className="flex items-center gap-2">
                <a
                  href={
                    previewProofUrl.startsWith('/uploads/') || previewProofUrl.startsWith('/receipts/')
                      ? previewProofUrl
                      : `/receipts/${previewProofUrl}`
                  }
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1 bg-indigo-50 rounded-lg"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setPreviewProofUrl(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
              {previewProofUrl.endsWith('.pdf') ? (
                <iframe
                  src={
                    previewProofUrl.startsWith('/uploads/') || previewProofUrl.startsWith('/receipts/')
                      ? previewProofUrl
                      : `/uploads/${previewProofUrl}`
                  }
                  className="w-full h-[60vh] rounded-xl border border-slate-200"
                />
              ) : previewProofUrl.startsWith('/uploads/') || previewProofUrl.startsWith('/receipts/') || previewProofUrl.endsWith('.png') || previewProofUrl.endsWith('.jpg') || previewProofUrl.endsWith('.jpeg') ? (
                <img
                  src={
                    previewProofUrl.startsWith('/uploads/') || previewProofUrl.startsWith('/receipts/')
                      ? previewProofUrl
                      : `/receipts/${previewProofUrl}`
                  }
                  alt="Receipt Document"
                  className="max-h-[65vh] mx-auto rounded-xl shadow-sm"
                />
              ) : (
                <div className="py-12 space-y-2">
                  <FileImage className="w-12 h-12 text-slate-400 mx-auto" />
                  <p className="font-mono text-xs text-slate-700">{previewProofUrl}</p>
                  <p className="text-[11px] text-slate-500">Document reference verified in archive.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

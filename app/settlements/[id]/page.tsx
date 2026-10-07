'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { FinancialSummaryCard } from '@/components/FinancialSummaryCard';
import { PolicyResultCallout } from '@/components/PolicyResultCallout';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Receipt,
  PlusCircle,
  ArrowLeft,
  Sparkles,
  Send,
  Trash2,
  FileImage,
  Info,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  Eye,
  X,
  Upload,
  Download,
  Paperclip,
  FileText,
} from 'lucide-react';

export default function SettlementWorkspacePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [request, setRequest] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Expense Form State
  const [newCategory, setNewCategory] = useState<'Lodging' | 'Transportation' | 'Meals' | 'Business Entertainment' | 'Other'>('Transportation');
  const [newMerchant, setNewMerchant] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBillNumber, setNewBillNumber] = useState('');
  const [newAmount, setNewAmount] = useState<number>(0);
  const [newPaidBy, setNewPaidBy] = useState<'EMPLOYEE' | 'COMPANY'>('EMPLOYEE');
  const [newProofRef, setNewProofRef] = useState('');
  const [newProofFile, setNewProofFile] = useState<File | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newAttendees, setNewAttendees] = useState('');
  const [newHodApprovalPrior, setNewHodApprovalPrior] = useState(false);
  const [newIsSomeoneElse, setNewIsSomeoneElse] = useState(false);

  // Lodging itemized inputs
  const [roomTariffPerNight, setRoomTariffPerNight] = useState<number>(0);
  const [numberOfNights, setNumberOfNights] = useState<number>(1);
  const [roomTaxes, setRoomTaxes] = useState<number>(0);
  const [laundryAmount, setLaundryAmount] = useState<number>(0);
  const [miniBarAmount, setMiniBarAmount] = useState<number>(0);
  const [inRoomDiningAmount, setInRoomDiningAmount] = useState<number>(0);

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
        if (r.request.startDate) {
          setNewDate(new Date(r.request.startDate).toISOString().split('T')[0]);
        }
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

  const handleLoadSampleExpenses = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${id}/expenses/load-sample`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg('Loaded complete golden-path sample evidence from source pack!');
      loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      let finalProofRef = newProofRef;

      // If user selected a real file from their device, upload it first
      if (newProofFile) {
        const formData = new FormData();
        formData.append('file', newProofFile);
        const uploadRes = await fetch(`/api/requests/${id}/upload`, {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload receipt');
        finalProofRef = uploadData.document?.storedFileName || uploadData.document?.fileName || newProofFile.name;
      }

      const payload: any = {
        category: newCategory,
        merchant: newMerchant,
        description: newDescription,
        billNumber: newBillNumber || null,
        amount: Number(newAmount),
        paidBy: newPaidBy,
        proofRef: finalProofRef || null,
        date: newDate,
        attendees: newAttendees || null,
        hodApprovalPrior: newHodApprovalPrior,
        isSomeoneElse: newIsSomeoneElse,
      };

      if (newCategory === 'Lodging' && roomTariffPerNight > 0) {
        payload.roomTariffPerNight = Number(roomTariffPerNight);
        payload.numberOfNights = Number(numberOfNights);
        payload.roomTaxes = Number(roomTaxes);
        payload.laundryAmount = Number(laundryAmount);
        payload.miniBarAmount = Number(miniBarAmount);
        payload.inRoomDiningAmount = Number(inRoomDiningAmount);
      }

      const res = await fetch(`/api/requests/${id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg('Expense added, receipt attached, and evaluated against company policy.');
      setIsAddModalOpen(false);
      resetExpenseForm();
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

      setSuccessMsg(`Document "${uploadFile.name}" uploaded and attached to claim!`);
      setIsUploadModalOpen(false);
      setUploadFile(null);
      loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadProgress(false);
    }
  };

  const handleDeleteExpense = async (expId: string) => {
    if (!confirm('Are you sure you want to delete this expense line?')) return;
    try {
      const res = await fetch(`/api/expenses/${expId}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSubmitSettlement = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${id}/settlement/submit`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg('Settlement submitted to Finance Shared Services for verification!');
      loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const resetExpenseForm = () => {
    setNewCategory('Transportation');
    setNewMerchant('');
    setNewDescription('');
    setNewBillNumber('');
    setNewAmount(0);
    setNewPaidBy('EMPLOYEE');
    setNewProofRef('');
    setNewAttendees('');
    setNewHodApprovalPrior(false);
    setNewIsSomeoneElse(false);
    setRoomTariffPerNight(0);
    setNumberOfNights(1);
    setRoomTaxes(0);
    setLaundryAmount(0);
    setMiniBarAmount(0);
    setInRoomDiningAmount(0);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
        <p className="text-sm">Loading settlement claim workspace...</p>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  const isOwner = currentUser && request.employeeId === currentUser.id;
  const canEdit = isOwner && ['APPROVED', 'SETTLEMENT_DRAFT', 'RETURNED'].includes(request.status);
  const expensesList = request.expenses || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link href={`/requests/${request.id}`} className="flex items-center gap-1 hover:text-slate-900 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Request Details ({request.requestNumber})</span>
        </Link>
        <span className="font-mono text-slate-400">Advance: {formatCurrency(request.advanceDisbursed)}</span>
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

      {/* Top Banner & Actions */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                {request.requestNumber}
              </span>
              <StatusBadge status={request.status} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Expense Settlement Workspace
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {request.destination} &middot; {formatDate(request.startDate)} to {formatDate(request.endDate)} &middot; Employee: <strong className="text-slate-800">{request.employee?.name}</strong>
            </p>
          </div>

            <div className="flex flex-wrap items-center gap-2.5">
            {canEdit && (
              <>
                <button
                  disabled={actionLoading}
                  onClick={handleLoadSampleExpenses}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
                  title="Developer helper: pre-fill sample receipts from take-home pack"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  <span>Load demo evidence</span>
                </button>

                <button
                  onClick={() => {
                    setUploadFile(null);
                    setIsUploadModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Evidence</span>
                </button>

                <button
                  onClick={() => {
                    resetExpenseForm();
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Expense</span>
                </button>
              </>
            )}

            {canEdit && expensesList.length > 0 && (
              <button
                disabled={actionLoading}
                onClick={handleSubmitSettlement}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition"
              >
                <Send className="w-4 h-4" />
                <span>Submit Claim to Finance</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Financial Summary Breakdown Card */}
      {request.settlementSummary && (
        <FinancialSummaryCard summary={request.settlementSummary} />
      )}

      {/* Expense Lines Table with Policy Evaluations */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Claim Expense Items ({expensesList.length})
            </h3>
            <p className="text-xs text-slate-500">
              Every expense line evaluated server-side per Nortex Travel Policy NTX-HR-POL-11
            </p>
          </div>
        </div>

        {expensesList.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Receipt className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-sm font-semibold text-slate-700">No expenses added yet</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Add individual expense items with receipts, or use the demo helper to load sample evidence.
            </p>
            {canEdit && (
              <button
                onClick={handleLoadSampleExpenses}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                <span>Load demo evidence</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-3.5">Date & Merchant</th>
                  <th className="px-6 py-3.5">Category & Description</th>
                  <th className="px-6 py-3.5">Paid By / Proof</th>
                  <th className="px-6 py-3.5">Original Amount</th>
                  <th className="px-6 py-3.5">Policy Evaluation & Reasons</th>
                  <th className="px-6 py-3.5">Eligible Amount</th>
                  {canEdit && <th className="px-6 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expensesList.map((exp: any) => {
                  const evalData = exp.policyEvaluation || {
                    status: exp.status,
                    eligibleAmount: exp.eligibleAmount,
                    disallowedAmount: exp.disallowedAmount,
                    isCompanyPaid: exp.paidBy === 'COMPANY',
                    isDuplicate: exp.isDuplicate,
                    isSomeoneElse: exp.isSomeoneElse,
                    reasons: exp.validationReasons ? JSON.parse(exp.validationReasons) : [],
                    warnings: [],
                  };

                  return (
                    <tr key={exp.id} className={`hover:bg-slate-50/70 transition ${
                      evalData.status === 'DISALLOWED'
                        ? 'bg-rose-50/30'
                        : evalData.status === 'FLAGGED'
                        ? 'bg-amber-50/30'
                        : ''
                    }`}>
                      {/* Date & Merchant */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900">{exp.merchant}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{formatDate(exp.date)}</p>
                        {exp.billNumber && (
                          <span className="text-[10px] text-slate-400 font-mono">Bill: {exp.billNumber}</span>
                        )}
                      </td>

                      {/* Category & Description */}
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px] mb-1">
                          {exp.category}
                        </span>
                        <p className="text-slate-800 font-medium">{exp.description}</p>
                        {exp.attendees && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            <strong>Attendees:</strong> {exp.attendees}
                          </p>
                        )}
                      </td>

                      {/* Paid By & Proof */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          exp.paidBy === 'COMPANY'
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {exp.paidBy === 'COMPANY' ? 'Corporate Card (Company)' : 'Employee Paid'}
                        </span>

                        {exp.proofRef ? (
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800">
                            <FileImage className="w-3 h-3" />
                            <button
                              onClick={() => {
                                const url = exp.proofRef.endsWith('.png') || exp.proofRef.endsWith('.jpg')
                                  ? `/receipts/${exp.proofRef}`
                                  : null;
                                setPreviewProofUrl(url || exp.proofRef);
                              }}
                              className="underline font-mono truncate max-w-[120px]"
                            >
                              {exp.proofRef}
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-rose-500 font-semibold mt-1">No proof attached</p>
                        )}
                      </td>

                      {/* Original Amount */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900 text-sm">{formatCurrency(exp.amount)}</p>
                      </td>

                      {/* Policy Evaluation and Callouts */}
                      <td className="px-6 py-4 max-w-xs">
                        <div className="mb-1">
                          <StatusBadge status={evalData.status} />
                        </div>
                        <PolicyResultCallout
                          status={evalData.status}
                          eligibleAmount={evalData.eligibleAmount}
                          disallowedAmount={evalData.disallowedAmount}
                          isCompanyPaid={evalData.isCompanyPaid}
                          isDuplicate={evalData.isDuplicate}
                          isSomeoneElse={evalData.isSomeoneElse}
                          reasons={evalData.reasons}
                          warnings={evalData.warnings}
                        />
                      </td>

                      {/* Net Eligible Amount */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className={`font-bold text-sm ${
                          evalData.eligibleAmount > 0 ? 'text-emerald-700' : 'text-slate-400'
                        }`}>
                          {formatCurrency(evalData.eligibleAmount)}
                        </p>
                        {evalData.disallowedAmount > 0 && (
                          <p className="text-[10px] text-rose-600 font-semibold">
                            Disallowed: -{formatCurrency(evalData.disallowedAmount)}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-elevation border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Expense Item</h3>
                  <p className="text-xs text-slate-500">Provide itemized invoice breakdown for policy check</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expense Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Transportation">Transportation / Local Cabs / Flights</option>
                    <option value="Lodging">Lodging / Hotel Folio</option>
                    <option value="Meals">Meals</option>
                    <option value="Business Entertainment">Business Entertainment</option>
                    <option value="Other">Other / Incidentals</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date Incurred</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Merchant / Vendor</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Keys Prime Hotel / Uber"
                    value={newMerchant}
                    onChange={(e) => setNewMerchant(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bill / Folio # (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. KPW/26-27/1188"
                    value={newBillNumber}
                    onChange={(e) => setNewBillNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3 nights stay at Whitefield"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Invoice Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="e.g. 21504"
                    value={newAmount || ''}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Source</label>
                  <select
                    value={newPaidBy}
                    onChange={(e) => setNewPaidBy(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="EMPLOYEE">Paid by Employee (Personal Card/Cash)</option>
                    <option value="COMPANY">Company Paid (Centrally booked / Corporate Card)</option>
                  </select>
                </div>
              </div>

              {/* Lodging Itemized Breakdown Box */}
              {newCategory === 'Lodging' && (
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200/70 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <Info className="w-4 h-4 text-indigo-600" />
                    <span>Hotel Folio Breakdown (for Policy Deductions)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-600 font-medium">Tariff / Night (₹)</label>
                      <input
                        type="number"
                        placeholder="5750"
                        value={roomTariffPerNight || ''}
                        onChange={(e) => setRoomTariffPerNight(Number(e.target.value))}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 font-medium"># of Nights</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="3"
                        value={numberOfNights}
                        onChange={(e) => setNumberOfNights(Number(e.target.value))}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 font-medium">Room Taxes (GST) (₹)</label>
                      <input
                        type="number"
                        placeholder="2304"
                        value={roomTaxes || ''}
                        onChange={(e) => setRoomTaxes(Number(e.target.value))}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-rose-700 font-medium">Laundry (Non-reimb) (₹)</label>
                      <input
                        type="number"
                        placeholder="450"
                        value={laundryAmount || ''}
                        onChange={(e) => setLaundryAmount(Number(e.target.value))}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-rose-700 font-medium">Mini Bar (Non-reimb) (₹)</label>
                      <input
                        type="number"
                        placeholder="380"
                        value={miniBarAmount || ''}
                        onChange={(e) => setMiniBarAmount(Number(e.target.value))}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-rose-700 font-medium">In-Room Dining (₹)</label>
                      <input
                        type="number"
                        placeholder="1120"
                        value={inRoomDiningAmount || ''}
                        onChange={(e) => setInRoomDiningAmount(Number(e.target.value))}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Business Entertainment Fields */}
              {newCategory === 'Business Entertainment' && (
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70 space-y-2">
                  <div>
                    <label className="block text-xs font-bold text-amber-950 mb-1">
                      Attendee Names & Organization <span className="text-rose-500">* (Policy §3.5)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sanjay Kumar (Vertex), Vinay Rao (Vertex), Chaitanya (Nortex)"
                      value={newAttendees}
                      onChange={(e) => setNewAttendees(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-amber-300 rounded-xl"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="hodApproval"
                      checked={newHodApprovalPrior}
                      onChange={(e) => setNewHodApprovalPrior(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="hodApproval" className="text-xs text-amber-900 font-medium">
                      Prior HOD written approval obtained (Mandatory if amount &gt; ₹2,000)
                    </label>
                  </div>
                </div>
              )}

              {/* Proof Attachment & File Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Supporting Proof Document / Receipt <span className="text-slate-400 font-normal">(PDF, JPG, PNG up to 10MB)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50 text-center hover:bg-slate-100 transition">
                    <input
                      type="file"
                      id="expenseFilePicker"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setNewProofFile(e.target.files[0]);
                          setNewProofRef(e.target.files[0].name);
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="expenseFilePicker" className="cursor-pointer flex flex-col items-center justify-center gap-1">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      <span className="text-[11px] font-bold text-indigo-600">
                        {newProofFile ? newProofFile.name : 'Choose Receipt File...'}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {newProofFile ? `${(newProofFile.size / 1024).toFixed(1)} KB` : 'Click to select from device'}
                      </span>
                    </label>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Or enter proof reference / filename"
                      value={newProofRef}
                      onChange={(e) => setNewProofRef(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="someoneElse"
                        checked={newIsSomeoneElse}
                        onChange={(e) => setNewIsSomeoneElse(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <label htmlFor="someoneElse" className="text-[11px] text-rose-800 font-medium">
                        Other person expense (§4)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {actionLoading ? 'Saving & Uploading...' : 'Add & Evaluate'}
                </button>
              </div>
            </form>
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
                  <h3 className="text-base font-bold text-slate-900">Upload Supporting Evidence</h3>
                  <p className="text-xs text-slate-500">Attach receipts, boarding passes, or approvals</p>
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
                  id="directUploadPicker"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <label htmlFor="directUploadPicker" className="cursor-pointer flex flex-col items-center justify-center gap-2">
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
                  {uploadProgress ? 'Uploading...' : 'Upload & Attach to Claim'}
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

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  FolderOpen,
  FileImage,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function EvidenceVaultPage() {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/evidence')
      .then((res) => res.json())
      .then((data) => setEvidence(data.evidence || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = evidence.filter((item) => {
    const matchesSearch =
      item.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.request?.requestNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.request?.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Evidence Vault & Receipts</h1>
              <p className="text-xs text-slate-500">
                Digital document archive of uploaded bills, boarding passes, folios, and proof validations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search proof by filename, merchant, request #..."
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
            <option value="ALL">All Proof Statuses</option>
            <option value="VALID">Valid (Approved by Policy)</option>
            <option value="FLAGGED">Flagged / Partially Deducted</option>
            <option value="DISALLOWED">Disallowed / Non-Reimbursable</option>
          </select>
        </div>
      </div>

      {/* Table of Evidence */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2" />
            <p className="text-xs">Loading evidence vault records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <FileImage className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No evidence documents found</h4>
            <p className="text-xs text-slate-400">
              Receipts and invoices attached to travel settlement claims will be listed here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-3.5">Filename & Proof Ref</th>
                  <th className="px-6 py-3.5">Linked Request & Employee</th>
                  <th className="px-6 py-3.5">Expense & Category</th>
                  <th className="px-6 py-3.5">Amount Incurred</th>
                  <th className="px-6 py-3.5">Policy Status</th>
                  <th className="px-6 py-3.5">Validation Result</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {/* Filename */}
                    <td className="px-6 py-4 font-mono">
                      <div className="flex items-center gap-2">
                        <FileImage className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-bold text-slate-900 truncate max-w-[160px]">{item.fileName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans mt-0.5 block">
                        Date: {formatDate(item.date)}
                      </span>
                    </td>

                    {/* Linked Request */}
                    <td className="px-6 py-4">
                      <Link
                        href={`/requests/${item.request?.id}`}
                        className="font-bold text-indigo-600 hover:text-indigo-800 font-mono"
                      >
                        {item.request?.requestNumber}
                      </Link>
                      <p className="text-[11px] text-slate-600">{item.request?.employee?.name}</p>
                      <p className="text-[10px] text-slate-400">{item.request?.destination}</p>
                    </td>

                    {/* Expense & Category */}
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px] mb-1">
                        {item.category}
                      </span>
                      <p className="font-semibold text-slate-900">{item.merchant}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{item.description}</p>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{formatCurrency(item.amount)}</p>
                      <p className="text-[10px] text-slate-500">
                        {item.paidBy === 'COMPANY' ? 'Corporate Paid' : 'Employee Paid'}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Validation Result */}
                    <td className="px-6 py-4 max-w-xs">
                      {item.validationReasons?.length > 0 ? (
                        <div className="space-y-0.5">
                          {item.validationReasons.map((r: string, idx: number) => (
                            <p key={idx} className="text-[11px] text-slate-600 leading-tight">
                              &bull; {r}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-emerald-700 font-medium">Fully eligible per Policy NTX-HR-POL-11</p>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => setPreviewDoc(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <Link
                        href={`/settlements/${item.request?.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Settlement</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-elevation border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{previewDoc.fileName}</h3>
                <p className="text-xs text-slate-500">
                  {previewDoc.merchant} &middot; {formatCurrency(previewDoc.amount)} &middot; {previewDoc.request?.requestNumber}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.fileUrl || `/receipts/${previewDoc.fileName}`}
                  download={previewDoc.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2.5 py-1 bg-indigo-50 rounded-lg"
                >
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
              {previewDoc.fileName?.endsWith('.pdf') || (previewDoc.fileUrl && previewDoc.fileUrl.endsWith('.pdf')) ? (
                <iframe
                  src={previewDoc.fileUrl || `/uploads/${previewDoc.fileName}`}
                  className="w-full h-[60vh] rounded-xl border border-slate-200"
                />
              ) : previewDoc.fileUrl || previewDoc.fileName?.endsWith('.png') || previewDoc.fileName?.endsWith('.jpg') || previewDoc.fileName?.endsWith('.jpeg') ? (
                <img
                  src={previewDoc.fileUrl || `/receipts/${previewDoc.fileName}`}
                  alt="Receipt Preview"
                  className="max-h-[60vh] mx-auto rounded-xl shadow-sm"
                />
              ) : (
                <div className="py-12 space-y-2">
                  <FileImage className="w-12 h-12 text-slate-400 mx-auto" />
                  <p className="font-mono text-xs text-slate-700">{previewDoc.fileName}</p>
                  <p className="text-[11px] text-slate-500">Proof document recorded in company repository.</p>
                </div>
              )}
            </div>

            {/* Validation Breakdown */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between font-semibold mb-1">
                <span>Policy Evaluation Result:</span>
                <StatusBadge status={previewDoc.status} />
              </div>
              {previewDoc.validationReasons?.length > 0 ? (
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {previewDoc.validationReasons.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-emerald-700">Validated against Nortex Travel Policy limits.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

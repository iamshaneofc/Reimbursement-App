'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plane, ArrowLeft, Info, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { determineRequiredApprovalRoles } from '@/lib/workflow/workflowEngine';
import { resolveCityTier } from '@/lib/policy/policyEngine';
import { formatCurrency } from '@/lib/utils';

export default function NewTravelRequestPage() {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [cityClass, setCityClass] = useState<'Tier 1' | 'Tier 2' | 'Tier 3'>('Tier 1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [category, setCategory] = useState<'Domestic' | 'International'>('Domestic');
  const [mode, setMode] = useState<'Flight' | 'Train' | 'Cab' | 'Personal Vehicle'>('Flight');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [employeeBorneEstimate, setEmployeeBorneEstimate] = useState<number>(0);
  const [advanceRequested, setAdvanceRequested] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect tier when destination changes
  const handleDestinationChange = (val: string) => {
    setDestination(val);
    const tier = resolveCityTier(val);
    setCityClass(tier);
  };

  const maxAdvanceAllowed = Math.round(employeeBorneEstimate * 0.6 * 100) / 100;
  const isAdvanceExceeded = advanceRequested > maxAdvanceAllowed;
  const requiredApprovalRoles = determineRequiredApprovalRoles(estimatedCost, category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!destination || !startDate || !endDate || !purpose) {
      setError('Please fill all required fields');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be on or after start date');
      return;
    }

    if (isAdvanceExceeded) {
      setError(`Advance requested cannot exceed 60% of estimated employee-borne cost (Max: ${formatCurrency(maxAdvanceAllowed)})`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          cityClass,
          startDate,
          endDate,
          purpose,
          category,
          mode,
          estimatedCost: Number(estimatedCost),
          employeeBorneEstimate: Number(employeeBorneEstimate),
          advanceRequested: Number(advanceRequested),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create travel request');
      }

      router.push(`/requests/${data.request.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/dashboard" className="flex items-center gap-1 hover:text-slate-900 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Create Travel Request</h1>
            <p className="text-xs text-slate-500">
              Submit prior travel authorization & advance request compliant with Policy NTX-HR-POL-11
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Validation Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip Destination & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Destination <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bengaluru / Vertex Technologies"
                value={destination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Detected City Class: <span className="font-semibold text-indigo-700">{cityClass}</span> (Lodging cap: {cityClass === 'Tier 1' ? '₹6,000/night' : cityClass === 'Tier 2' ? '₹4,000/night' : '₹2,800/night'})
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Travel Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              >
                <option value="Domestic">Domestic</option>
                <option value="International">International (Requires MD/CEO Approval)</option>
              </select>
            </div>
          </div>

          {/* Travel Dates & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Travel Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              >
                <option value="Flight">Flight (Centrally booked)</option>
                <option value="Train">Train</option>
                <option value="Cab">Intercity Cab</option>
                <option value="Personal Vehicle">Personal Vehicle</option>
              </select>
            </div>
          </div>

          {/* Purpose of Travel */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Purpose & Business Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Customer meeting + site visit with Vertex Technologies procurement team"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
            />
          </div>

          {/* Financials & Advance Calculation */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cost Estimates & Advance Calculation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Estimated Spend (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  placeholder="e.g. 48000"
                  value={estimatedCost || ''}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">Flights + Hotel + Meals + Local Cabs</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Employee-Borne Cost Estimate (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  placeholder="e.g. 33320"
                  value={employeeBorneEstimate || ''}
                  onChange={(e) => setEmployeeBorneEstimate(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">Total excluding company-paid flights</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Advance Requested (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="e.g. 20000"
                  value={advanceRequested || ''}
                  onChange={(e) => setAdvanceRequested(Number(e.target.value))}
                  className={`w-full text-xs px-3.5 py-2 bg-white border rounded-xl focus:outline-none ${
                    isAdvanceExceeded ? 'border-rose-500 ring-2 ring-rose-300 text-rose-900' : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
                <p className={`text-[10px] mt-1 ${isAdvanceExceeded ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                  Max permitted: 60% = {formatCurrency(maxAdvanceAllowed)} (Policy §1.2)
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Approval Preview Box */}
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200/70 text-xs">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-bold text-indigo-950">Dynamic Approval Matrix Preview:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {requiredApprovalRoles.map((role: string, idx: number) => (
                <React.Fragment key={role}>
                  <span className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-900 rounded-lg font-semibold shadow-xs">
                    {role}
                  </span>
                  {idx < requiredApprovalRoles.length - 1 && (
                    <span className="text-indigo-400 font-bold">&rarr;</span>
                  )}
                </React.Fragment>
              ))}
              <span className="text-slate-500 font-medium ml-2">
                (Based on estimated value of {formatCurrency(estimatedCost)})
              </span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/dashboard"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || isAdvanceExceeded}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 transition"
            >
              {submitting ? 'Creating Request...' : 'Create & Save Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

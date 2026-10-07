'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plane,
  ArrowLeft,
  ArrowRight,
  Info,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  MapPin,
  Wallet,
  Receipt,
  Check,
  Building2,
  FileCheck2,
} from 'lucide-react';
import { determineRequiredApprovalRoles } from '@/lib/workflow/workflowEngine';
import { resolveCityTier } from '@/lib/policy/policyEngine';
import { formatCurrency } from '@/lib/utils';

export default function TravelCreationWizardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
          <p className="text-xs font-semibold">Loading wizard...</p>
        </div>
      }
    >
      <TravelCreationWizardContent />
    </Suspense>
  );
}

function TravelCreationWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get('category') === 'International' ? 'International' : 'Domestic';
  const initialPurpose = searchParams.get('purpose') || '';

  // Current Wizard Step (1: Details, 2: Estimates, 3: Advance, 4: Review)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [category, setCategory] = useState<'Domestic' | 'International'>(initialCategory);
  const [destination, setDestination] = useState('');
  const [cityClass, setCityClass] = useState<'Tier 1' | 'Tier 2' | 'Tier 3'>('Tier 1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState(initialPurpose);
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
  const isAdvanceExceeded = advanceRequested > maxAdvanceAllowed + 0.01;
  const requiredApprovalRoles = determineRequiredApprovalRoles(estimatedCost, category);

  const validateStep1 = () => {
    if (!destination.trim()) {
      setError('Please enter destination city/client location');
      return false;
    }
    if (!startDate || !endDate) {
      setError('Please provide valid start and end dates');
      return false;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be on or after departure date');
      return false;
    }
    if (!purpose.trim()) {
      setError('Please enter the business purpose/justification');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (estimatedCost <= 0) {
      setError('Estimated total cost must be greater than 0');
      return false;
    }
    if (employeeBorneEstimate < 0) {
      setError('Employee-borne estimate cannot be negative');
      return false;
    }
    if (employeeBorneEstimate > estimatedCost) {
      setError('Employee-borne estimate cannot exceed total estimated spend');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep3 = () => {
    if (advanceRequested < 0) {
      setError('Advance requested cannot be negative');
      return false;
    }
    if (isAdvanceExceeded) {
      setError(`Advance exceeds 60% policy limit (Max permitted: ${formatCurrency(maxAdvanceAllowed)})`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) {
      // Suggest advance default if 0
      if (advanceRequested === 0 && employeeBorneEstimate > 0) {
        setAdvanceRequested(Math.floor(employeeBorneEstimate * 0.5));
      }
      setCurrentStep(3);
    } else if (currentStep === 3 && validateStep3()) setCurrentStep(4);
  };

  const handleSubmit = async () => {
    setError(null);
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
        throw new Error(data.error || 'Failed to submit travel request');
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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/requests/new" className="flex items-center gap-1 hover:text-slate-800 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Category Selection</span>
        </Link>
      </div>

      {/* Main Wizard Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-6">
        {/* Wizard Header */}
        <div className="pb-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-full text-[10px]">
                {category} Travel Workflow
              </span>
              <span className="text-xs text-slate-400">&middot; Policy NTX-HR-POL-11</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Create Travel Request & Advance
            </h1>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center gap-1.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    currentStep === stepNum
                      ? 'bg-indigo-600 text-white'
                      : currentStep > stepNum
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {currentStep > stepNum ? '✓' : stepNum}
                </span>
                <span className="hidden sm:inline text-[11px] text-slate-600">
                  {stepNum === 1 && 'Trip'}
                  {stepNum === 2 && 'Costs'}
                  {stepNum === 3 && 'Advance'}
                  {stepNum === 4 && 'Review'}
                </span>
                {stepNum < 4 && <span className="text-slate-300 mx-1">&mdash;</span>}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Validation Notice</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Trip Scope & Dates */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Destination City & Client <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bengaluru / Vertex Technologies"
                  value={destination}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  City Class: <strong className="text-indigo-700">{cityClass}</strong> (Lodging limit: {cityClass === 'Tier 1' ? '₹6,000/night' : cityClass === 'Tier 2' ? '₹4,000/night' : '₹2,800/night'})
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Domestic">Domestic Travel</option>
                  <option value="International">International Travel (Requires MD/CEO)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Departure Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Return Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Primary Mode
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Flight">Flight (Centrally booked)</option>
                  <option value="Train">Train</option>
                  <option value="Cab">Intercity Cab</option>
                  <option value="Personal Vehicle">Personal Vehicle</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Business Purpose & Justification <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Customer meeting + technical site visit with Vertex Technologies procurement team"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Cost Estimates */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">Cost Estimation Guidelines (Policy §1 & §3)</p>
              <p>
                Distinguish total project spend from employee out-of-pocket expenses.
                Centrally billed flights on corporate card are company-paid and excluded from employee advances.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Total Estimated Spend (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="100"
                  placeholder="e.g. 43876"
                  value={estimatedCost || ''}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Overall estimated budget including flights, hotel folio, meals & cabs.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Employee-Borne Estimated Spend (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  placeholder="e.g. 33320"
                  value={employeeBorneEstimate || ''}
                  onChange={(e) => setEmployeeBorneEstimate(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-indigo-900"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Expenses paid by employee directly (hotel folio, local cabs, customer dinners).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Advance Request & 60% Rule */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs text-indigo-950 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <Info className="w-4 h-4 text-indigo-600" />
                <span>Travel Advance Rule (Policy §1.2 & §1.3)</span>
              </div>
              <p>
                Employees may request a travel advance of <strong>up to 60%</strong> of the estimated employee-borne cost.
                The advance is disbursed by Finance SSC and adjusted against your final settlement claim.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Employee-Borne Spend Estimate:</span>
                <strong className="text-slate-900 font-bold">{formatCurrency(employeeBorneEstimate)}</strong>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                <span className="text-slate-600">Maximum Eligible Advance (60%):</span>
                <strong className="text-indigo-700 font-bold">{formatCurrency(maxAdvanceAllowed)}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Advance Amount Requested (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="e.g. 20000"
                  value={advanceRequested || ''}
                  onChange={(e) => setAdvanceRequested(Number(e.target.value))}
                  className={`w-full text-xs px-3.5 py-2.5 bg-white border rounded-xl font-bold focus:outline-none ${
                    isAdvanceExceeded
                      ? 'border-rose-500 ring-2 ring-rose-200 text-rose-900'
                      : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-900'
                  }`}
                />
              </div>

              <div className="text-[11px] flex items-center gap-1.5">
                {isAdvanceExceeded ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Exceeds maximum allowable advance of {formatCurrency(maxAdvanceAllowed)}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Advance request of {formatCurrency(advanceRequested)} is within 60% policy limit
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Submit */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Travel Request Summary
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500">Destination:</span>
                  <p className="font-bold text-slate-900">{destination} ({cityClass})</p>
                </div>
                <div>
                  <span className="text-slate-500">Dates:</span>
                  <p className="font-bold text-slate-900">{startDate} &mdash; {endDate}</p>
                </div>
                <div>
                  <span className="text-slate-500">Total Estimate:</span>
                  <p className="font-bold text-slate-900">{formatCurrency(estimatedCost)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Advance Requested:</span>
                  <p className="font-bold text-indigo-700">{formatCurrency(advanceRequested)}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-500">Purpose & Justification:</span>
                <p className="text-slate-800 italic mt-0.5">{purpose}</p>
              </div>
            </div>

            {/* Dynamic Approval Chain Preview */}
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-200/70 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                <Info className="w-4 h-4 text-indigo-600" />
                <span>Dynamic Approval Chain (Generated by Policy §2 Matrix)</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {requiredApprovalRoles.map((role: string, idx: number) => (
                  <React.Fragment key={role}>
                    <span className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-900 rounded-xl font-bold shadow-xs">
                      Level {idx + 1}: {role}
                    </span>
                    {idx < requiredApprovalRoles.length - 1 && (
                      <span className="text-indigo-400 font-bold">&rarr;</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              &larr; Back
            </button>
          ) : (
            <Link
              href="/requests/new"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </Link>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || isAdvanceExceeded}
              onClick={handleSubmit}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md disabled:opacity-50 transition"
            >
              <span>{submitting ? 'Creating Request...' : 'Submit Travel Request'}</span>
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

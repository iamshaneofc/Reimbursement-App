'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Shield,
  FileText,
  Building,
  CheckCircle2,
  Info,
  DollarSign,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function SettingsPolicyPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings & Expense Policy</h1>
            <p className="text-xs text-slate-500">
              Corporate profile details, organizational hierarchy, and Nortex Travel Policy NTX-HR-POL-11 Rev 4
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {user ? user.name.split(' ').map((n: string) => n[0]).join('') : 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.name || 'Loading profile...'}</h2>
              <p className="text-xs text-slate-500">{user?.designation} &middot; {user?.department}</p>
            </div>
          </div>
          {user && (
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold">
              {user.role}
            </span>
          )}
        </div>

        {user && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
              <span className="text-slate-400 font-medium">Employee Code</span>
              <p className="text-slate-900 font-mono font-bold text-sm mt-0.5">{user.empCode}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
              <span className="text-slate-400 font-medium">Cost Centre</span>
              <p className="text-slate-900 font-bold text-sm mt-0.5">{user.costCentre}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
              <span className="text-slate-400 font-medium">Base Office City</span>
              <p className="text-slate-900 font-bold text-sm mt-0.5">{user.city || 'Mumbai'}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
              <span className="text-slate-400 font-medium">Corporate Email</span>
              <p className="text-slate-900 font-bold text-xs truncate mt-0.5">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Policy NTX-HR-POL-11 Reference Guide */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <FileText className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Nortex Corporate Travel & Expense Policy (NTX-HR-POL-11 Rev 4)
            </h3>
            <p className="text-xs text-slate-500">
              Active rule definitions enforced in real-time by the central Policy Engine
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Lodging & Daily Allowances */}
          <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100 space-y-3">
            <h4 className="font-bold text-indigo-950 flex items-center gap-1.5 text-sm">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>1. City Tier Caps & Lodging Allowances (§3.1)</span>
            </h4>
            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between py-1 border-b border-indigo-100/60">
                <span className="font-semibold">Tier 1 (Bengaluru, Mumbai, Delhi-NCR, Chennai, Hyderabad)</span>
                <span className="font-mono font-bold">₹6,000 / night</span>
              </div>
              <div className="flex justify-between py-1 border-b border-indigo-100/60">
                <span className="font-semibold">Tier 2 (Pune, Ahmedabad, Kolkata, Jaipur, Kochi)</span>
                <span className="font-mono font-bold">₹4,000 / night</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold">Tier 3 (All other cities / industrial sites)</span>
                <span className="font-mono font-bold">₹2,500 / night</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                * Room tariff is capped before taxes. Room taxes (GST) are reimbursable proportionally.
              </p>
            </div>
          </div>

          {/* Daily Meals & Per Diem */}
          <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100 space-y-3">
            <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-sm">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>2. Daily Meal Allowances (§3.3)</span>
            </h4>
            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between py-1 border-b border-emerald-100/60">
                <span className="font-semibold">Tier 1 Daily Maximum</span>
                <span className="font-mono font-bold">₹1,500 / day</span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-100/60">
                <span className="font-semibold">Tier 2 Daily Maximum</span>
                <span className="font-mono font-bold">₹1,000 / day</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold">Tier 3 Daily Maximum</span>
                <span className="font-mono font-bold">₹750 / day</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                * Daily aggregate per diem cap applied across all food & beverage invoices for each calendar date.
              </p>
            </div>
          </div>

          {/* Cash Advance Rules */}
          <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-100 space-y-3">
            <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>3. Cash Advance & Disbursement (§2.2)</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed">
              <li>Maximum eligible advance is strictly <strong>60% of estimated employee-borne spend</strong>.</li>
              <li>Pre-booked company flights/hotels excluded from advance calculation base.</li>
              <li>Advance is disbursed upon final manager authorization prior to travel.</li>
              <li>If allowable expenses &lt; advance, balance is scheduled for <strong>Payroll Recovery</strong>.</li>
            </ul>
          </div>

          {/* Non-Reimbursable & Approvals */}
          <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-100 space-y-3">
            <h4 className="font-bold text-rose-950 flex items-center gap-1.5 text-sm">
              <Shield className="w-4 h-4 text-rose-600" />
              <span>4. Non-Reimbursable Items & Exclusions (§4.0)</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed">
              <li><strong>Minibar & In-room snacks:</strong> Disallowed in all cases.</li>
              <li><strong>Personal Laundry:</strong> Disallowed for trips &le; 3 days.</li>
              <li><strong>Other employee expenses:</strong> Every claim must belong to claimant.</li>
              <li><strong>Entertainment &gt; ₹2,000:</strong> Mandatory prior written HOD approval & attendee list.</li>
            </ul>
          </div>
        </div>

        {/* Approval Thresholds Matrix */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>5. Approval Hierarchy & Spending Thresholds (§6.0)</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-medium">Level 1: Reporting Manager</span>
              <p className="font-bold text-slate-900 mt-1">Up to ₹50,000</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-medium">Level 2: Head of Department</span>
              <p className="font-bold text-slate-900 mt-1">Up to ₹1,50,000</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-medium">Level 3: Head of Division</span>
              <p className="font-bold text-slate-900 mt-1">Up to ₹5,000,000</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-medium">Level 4: Managing Director</span>
              <p className="font-bold text-slate-900 mt-1">Above ₹5,000,000</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

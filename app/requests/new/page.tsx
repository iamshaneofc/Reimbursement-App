'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plane,
  Globe,
  Wallet,
  GraduationCap,
  Receipt,
  Users2,
  Home,
  Wifi,
  Car,
  Tag,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  'Plane': Plane,
  'Globe': Globe,
  'Banknote': Wallet,
  'Wallet': Wallet,
  'Utensils': Users2,
  'Car': Car,
  'Briefcase': Users2,
  'Award': GraduationCap,
  'Wifi': Wifi,
  'Receipt': Receipt,
  'Home': Home,
  'Tag': Tag,
};

interface CategoryData {
  id: string;
  name: string;
  code: string;
  icon?: string;
  description: string;
  requiresProof: boolean;
  maxLimit?: number | null;
  isActive: boolean;
  displayOrder: number;
}

export default function NewRequestHubPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.categories) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const getCategoryHref = (cat: CategoryData) => {
    if (cat.code === 'DOM_TRAVEL' || cat.name.toLowerCase().includes('domestic')) {
      return '/requests/new/travel?category=Domestic';
    }
    if (cat.code === 'INT_TRAVEL' || cat.name.toLowerCase().includes('international')) {
      return '/requests/new/travel?category=International';
    }
    if (cat.code === 'CASH_ADV' || cat.name.toLowerCase().includes('cash advance')) {
      return '/requests/new/travel?category=Domestic&focus=advance';
    }
    return `/requests/new/travel?category=Domestic&purpose=${encodeURIComponent(cat.name)}`;
  };

  const getCategoryWorkflow = (cat: CategoryData) => {
    if (cat.code === 'DOM_TRAVEL') return '6-Stage Travel Workflow';
    if (cat.code === 'INT_TRAVEL') return '6-Stage Overseas Workflow (MD)';
    if (cat.code === 'CASH_ADV') return 'Advance Disbursement (60% Cap)';
    if (cat.code === 'BUS_ENT') return 'Business Entertainment (Policy §3.5)';
    return 'Manager + Finance Approval';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/dashboard" className="flex items-center gap-1 hover:text-slate-800 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Page Title */}
      <div className="space-y-1 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Select Request Category
        </h1>
        <p className="text-xs text-slate-500">
          Choose the appropriate category to start the guided creation wizard with enterprise policy checks
        </p>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-24 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          Loading active request catalog...
        </div>
      ) : categories.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Tag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No active categories available</p>
          <p className="text-xs text-slate-400 mt-1">Please contact your platform administrator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const IconComponent = (cat.icon && ICON_MAP[cat.icon]) || Plane;
            const isAdvance = cat.code === 'DOM_TRAVEL' || cat.code === 'INT_TRAVEL' || cat.code === 'CASH_ADV';
            const isMostCommon = cat.code === 'DOM_TRAVEL';

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-card hover:border-indigo-300 transition-all flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition">
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {isMostCommon && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-100">
                        Primary Flow
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 space-y-3">
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Workflow:</span>
                      <span className="font-semibold text-slate-700">{getCategoryWorkflow(cat)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Advance:</span>
                      <span className={`font-semibold ${isAdvance ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {isAdvance ? 'Eligible (60%)' : 'Not Applicable'}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={getCategoryHref(cat)}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-800 py-2 px-3 rounded-xl text-xs font-bold transition shadow-2xs"
                  >
                    <span>Start Request</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Policy Governance Help Box */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Governance & Approval Matrix Reference (Policy §2)</span>
        </div>
        <p className="text-[11px]">
          Travel Requests are routed dynamically based on estimated spend:
          <strong className="text-slate-800"> ≤ ₹25,000</strong> (Reporting Manager) &middot;
          <strong className="text-slate-800"> ₹25,001–₹75,000</strong> (Manager + HOD) &middot;
          <strong className="text-slate-800"> ₹75,001–₹2,00,000</strong> (Manager + HOD + HODiv) &middot;
          <strong className="text-slate-800"> &gt; ₹2,00,000 or International</strong> (Manager + HOD + HODiv + MD/CEO).
          Finance verification is required on every settlement before payout.
        </p>
      </div>
    </div>
  );
}

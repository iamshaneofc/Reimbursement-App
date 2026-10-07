'use client';

import React from 'react';
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
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface RequestCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  workflowType: string;
  advanceAvailable: boolean;
  advanceNote: string;
  href: string;
  badge?: string;
}

export default function NewRequestHubPage() {
  const router = useRouter();

  const categories: RequestCategory[] = [
    {
      id: 'domestic-travel',
      title: 'Domestic Travel',
      description: 'Request domestic trip approval, optional travel advance, and settle hotel, cabs & meal expenses after the trip.',
      icon: Plane,
      workflowType: '6-Stage Travel Workflow',
      advanceAvailable: true,
      advanceNote: 'Up to 60% of estimated employee-borne cost',
      href: '/requests/new/travel?category=Domestic',
      badge: 'Most Common',
    },
    {
      id: 'international-travel',
      title: 'International Travel',
      description: 'Request travel authorization for overseas business trips with mandatory MD/CEO approval.',
      icon: Globe,
      workflowType: '6-Stage International Workflow',
      advanceAvailable: true,
      advanceNote: 'Up to 60% with Forex / Advance adjustment',
      href: '/requests/new/travel?category=International',
    },
    {
      id: 'cash-advance',
      title: 'Cash Advance',
      description: 'Request pre-trip operational funds for planned client or field business expenditures.',
      icon: Wallet,
      workflowType: 'Advance Disbursement Workflow',
      advanceAvailable: true,
      advanceNote: 'Disbursed by Finance SSC within 24–48h',
      href: '/requests/new/travel?category=Domestic&focus=advance',
    },
    {
      id: 'conference-training',
      title: 'Conference & Training',
      description: 'Submit professional seminar, industry conference, and technical certification expenses for approval.',
      icon: GraduationCap,
      workflowType: '3-Stage Approval Workflow',
      advanceAvailable: false,
      advanceNote: 'Direct reimbursement on receipt',
      href: '/requests/new/travel?category=Domestic&purpose=Conference%20%26%20Training',
    },
    {
      id: 'team-meals',
      title: 'Team Meals & Entertainment',
      description: 'Claim customer dinners and partner entertainment with required attendee names and HOD pre-approvals.',
      icon: Users2,
      workflowType: 'Business Entertainment Policy §3.5',
      advanceAvailable: false,
      advanceNote: 'Requires attendee list & HOD approval if > ₹2k',
      href: '/requests/new/travel?category=Domestic&purpose=Customer%20Meeting%20%26%20Entertainment',
    },
    {
      id: 'general-expense',
      title: 'General Expense',
      description: 'Direct out-of-pocket miscellaneous operational and procurement reimbursements.',
      icon: Receipt,
      workflowType: 'Standard Manager + Finance Review',
      advanceAvailable: false,
      advanceNote: 'Against valid tax invoice/receipt',
      href: '/requests/new/travel?category=Domestic&purpose=General%20Business%20Expense',
    },
    {
      id: 'home-office',
      title: 'Home Office & Equipment',
      description: 'Claim eligible remote-working peripherals, ergonomic equipment, and authorized consumables.',
      icon: Home,
      workflowType: 'Departmental Approval',
      advanceAvailable: false,
      advanceNote: 'Standard annual policy allotment',
      href: '/requests/new/travel?category=Domestic&purpose=Home%20Office%20Reimbursement',
    },
    {
      id: 'phone-internet',
      title: 'Phone & Internet Allowance',
      description: 'Submit monthly recurring mobile and broadband connectivity bills per corporate policy.',
      icon: Wifi,
      workflowType: 'Monthly Automated Run',
      advanceAvailable: false,
      advanceNote: 'Standard monthly cap per designation',
      href: '/requests/new/travel?category=Domestic&purpose=Monthly%20Communication%20Allowance',
    },
  ];

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
          Choose the appropriate category to start the guided creation wizard with policy checks
        </p>
      </div>

      {/* Category Grid (8 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const IconComponent = cat.icon;

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

                  {cat.badge && (
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-100">
                      {cat.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 space-y-3">
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Workflow:</span>
                    <span className="font-semibold text-slate-700">{cat.workflowType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Advance:</span>
                    <span className={`font-semibold ${cat.advanceAvailable ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {cat.advanceAvailable ? 'Eligible (60%)' : 'Not Applicable'}
                    </span>
                  </div>
                </div>

                <Link
                  href={cat.href}
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

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plane, PlusCircle, CheckSquare, ShieldCheck, LayoutDashboard, FileText, User } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [financeQueueCount, setFinanceQueueCount] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          // If manager role, check approvals count
          if (['Reporting Manager', 'Head of Department', 'Head of Division', 'MD', 'Admin'].includes(data.user.role)) {
            fetch('/api/approvals')
              .then((r) => r.json())
              .then((d) => setPendingApprovalsCount(d.approvals?.length || 0))
              .catch(() => {});
          }
          // If finance role, check finance count
          if (['Finance', 'Admin'].includes(data.user.role)) {
            fetch('/api/finance/queue')
              .then((r) => r.json())
              .then((d) => {
                const count = d.claims?.filter((c: any) => ['FINANCE_REVIEW', 'PAYMENT_PENDING', 'RECOVERY_DUE'].includes(c.status)).length || 0;
                setFinanceQueueCount(count);
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, [pathname]);

  const isManager = user && ['Reporting Manager', 'Head of Department', 'Head of Division', 'MD', 'Admin'].includes(user.role);
  const isFinance = user && ['Finance', 'Admin'].includes(user.role);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition">
                <Plane className="w-5 h-5 -rotate-45" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 tracking-tight text-base block leading-none">
                  NORTEX
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 block mt-0.5">
                  Travel & Expense
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  pathname === '/dashboard' || pathname === '/'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              <Link
                href="/requests"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  pathname.startsWith('/requests') && pathname !== '/requests/new'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                My Requests
              </Link>

              {isManager && (
                <Link
                  href="/approvals"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition relative ${
                    pathname.startsWith('/approvals')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  Approvals Queue
                  {pendingApprovalsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                      {pendingApprovalsCount}
                    </span>
                  )}
                </Link>
              )}

              {isFinance && (
                <Link
                  href="/finance"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition relative ${
                    pathname.startsWith('/finance')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Finance Queue
                  {financeQueueCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                      {financeQueueCount}
                    </span>
                  )}
                </Link>
              )}
            </nav>
          </div>

          {/* Right Action & Profile */}
          <div className="flex items-center gap-3">
            <Link
              href="/requests/new"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Request</span>
            </Link>

            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 text-right">
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-none">{user.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{user.designation}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                  {user.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

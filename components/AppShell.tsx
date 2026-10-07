'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Plane,
  LayoutDashboard,
  FileText,
  PlusCircle,
  CheckSquare,
  Receipt,
  ShieldCheck,
  FolderOpen,
  History,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  User,
  Building2,
  Tag,
  CreditCard,
  BarChart3,
  Sliders,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [financeQueueCount, setFinanceQueueCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // If on login page, don't show the sidebar shell
  const isLoginPage = pathname === '/login';

  const loadUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);

        // Fetch badge counts dynamically
        if (data.user) {
          const isApproverRole = ['Reporting Manager', 'Head of Department', 'Head of Division', 'MD', 'Admin', 'Manager'].includes(data.user.role);
          if (isApproverRole) {
            fetch('/api/approvals')
              .then((r) => r.json())
              .then((d) => setPendingApprovalsCount(d.stats?.pendingCount || d.approvals?.length || 0))
              .catch(() => {});
          }

          const isFinanceRole = ['Finance', 'Admin'].includes(data.user.role);
          if (isFinanceRole) {
            fetch('/api/finance/queue')
              .then((r) => r.json())
              .then((d) => {
                const count = d.claims?.filter((c: any) => ['FINANCE_REVIEW', 'PAYMENT_PENDING', 'RECOVERY_DUE'].includes(c.status)).length || 0;
                setFinanceQueueCount(count);
              })
              .catch(() => {});
          }
        }
      } else if (!isLoginPage) {
        router.push('/login');
      }
    } catch (e) {
      console.error('Failed to load user session:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoginPage) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [pathname, isLoginPage]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    window.location.href = '/login';
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  const role = user?.role || 'Employee';
  const isManager = ['Reporting Manager', 'Head of Department', 'Head of Division', 'MD', 'Manager'].includes(role);
  const isFinance = role === 'Finance';
  const isAdmin = role === 'Admin';

  // Generate breadcrumb titles
  const getBreadcrumbs = () => {
    if (pathname === '/dashboard' || pathname === '/') return [{ label: 'Dashboard', href: '/dashboard' }];
    if (pathname === '/requests') return [{ label: 'Dashboard', href: '/dashboard' }, { label: isAdmin ? 'All Claims' : 'My Requests', href: '/requests' }];
    if (pathname === '/requests/new') return [{ label: 'Requests', href: '/requests' }, { label: 'New Request', href: '/requests/new' }];
    if (pathname.startsWith('/requests/new/')) return [{ label: 'Requests', href: '/requests' }, { label: 'New Request', href: '/requests/new' }, { label: 'Trip Creation Wizard', href: pathname }];
    if (pathname.startsWith('/requests/')) return [{ label: 'Requests', href: '/requests' }, { label: 'Request Details', href: pathname }];
    if (pathname === '/settlements') return [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settlements', href: '/settlements' }];
    if (pathname.startsWith('/settlements/')) return [{ label: 'Settlements', href: '/settlements' }, { label: 'Expense Claim Workspace', href: pathname }];
    if (pathname === '/approvals') return [{ label: 'Review', href: '/approvals' }, { label: 'Approval Queue', href: '/approvals' }];
    if (pathname === '/finance') return [{ label: 'Finance Operations', href: '/finance' }, { label: 'Settlement Verification & Payouts', href: '/finance' }];
    if (pathname === '/evidence') return [{ label: 'Workspace', href: '/dashboard' }, { label: 'Evidence Vault', href: '/evidence' }];
    if (pathname === '/audit') return [{ label: 'Insight', href: '/audit' }, { label: 'Reports & Audit Log', href: '/audit' }];
    if (pathname === '/categories') return [{ label: 'Build & Config', href: '/categories' }, { label: 'Expense Categories', href: '/categories' }];
    if (pathname === '/settings') return [{ label: 'Account', href: '/settings' }, { label: 'Profile & Preferences', href: '/settings' }];
    return [{ label: 'Nortex', href: '/dashboard' }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans antialiased text-slate-800">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Plane className="w-4 h-4 -rotate-45" />
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-sm">NORTEX T&E</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Persistent Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Brand Identity */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition">
                <Plane className="w-4 h-4 -rotate-45" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 tracking-tight text-sm block leading-none">
                  NORTEX
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 block mt-0.5">
                  Travel & Expense
                </span>
              </div>
            </Link>
          </div>

          {/* Role-Specific Navigation */}
          <nav className="p-4 space-y-5">
            {/* 1. WORK SECTION (Common to Employee, Manager, Finance, Admin) */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Work
              </p>

              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  pathname === '/dashboard' || pathname === '/'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-slate-500" />
                  <span>Dashboard</span>
                </div>
              </Link>

              <Link
                href="/requests"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  pathname === '/requests' || (pathname.startsWith('/requests/') && pathname !== '/requests/new' && !pathname.startsWith('/requests/new/'))
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>{isAdmin ? 'Claims' : 'My Requests'}</span>
                </div>
              </Link>

              {/* Employees and Managers can initiate requests */}
              {(!isFinance || isAdmin) && (
                <Link
                  href="/requests/new"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname === '/requests/new' || pathname.startsWith('/requests/new/')
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <PlusCircle className="w-4 h-4 text-indigo-600" />
                    <span className="text-indigo-600 font-bold">New Request</span>
                  </div>
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[9px] font-bold">
                    +
                  </span>
                </Link>
              )}

              <Link
                href="/evidence"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  pathname.startsWith('/evidence')
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-4 h-4 text-slate-500" />
                  <span>Evidence</span>
                </div>
              </Link>
            </div>

            {/* 2. REVIEW SECTION (Manager & Admin only) */}
            {(isManager || isAdmin) && (
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Review
                </p>

                <Link
                  href="/approvals"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname.startsWith('/approvals')
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckSquare className="w-4 h-4 text-slate-500" />
                    <span>Approvals</span>
                  </div>
                  {pendingApprovalsCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                      {pendingApprovalsCount}
                    </span>
                  )}
                </Link>
              </div>
            )}

            {/* 3. FINANCE SECTION (Finance & Admin only) */}
            {(isFinance || isAdmin) && (
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Finance
                </p>

                <Link
                  href="/finance"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname.startsWith('/finance')
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>Payments & Review</span>
                  </div>
                  {financeQueueCount > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                      {financeQueueCount}
                    </span>
                  )}
                </Link>
              </div>
            )}

            {/* 4. INSIGHT SECTION (Finance & Admin only) */}
            {(isFinance || isAdmin) && (
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Insight
                </p>

                <Link
                  href="/audit"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname.startsWith('/audit')
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-4 h-4 text-slate-500" />
                    <span>Reports & Audit</span>
                  </div>
                </Link>
              </div>
            )}

            {/* 5. BUILD / CONFIGURATION (Admin only) */}
            {isAdmin && (
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Build & Config
                </p>

                <Link
                  href="/categories"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    pathname.startsWith('/categories')
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Tag className="w-4 h-4 text-slate-500" />
                    <span>Categories</span>
                  </div>
                </Link>
              </div>
            )}

            {/* 6. ACCOUNT SECTION (All roles) */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Account
              </p>

              <Link
                href="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  pathname === '/settings'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Profile</span>
                </div>
              </Link>
            </div>
          </nav>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || 'Loading user...'}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-mono">
                  {user?.empCode} &middot; <span className="font-semibold text-indigo-600">{user?.role}</span>
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200/80 px-6 hidden md:flex items-center justify-between sticky top-0 z-30">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.href + idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="font-bold text-slate-900">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-slate-800 transition">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Top Right User Pill */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500">
              Department: <strong className="text-slate-800">{user?.department || 'Operations'}</strong>
            </span>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              {user?.city || 'Pune Hub'}
            </span>
          </div>
        </header>

        {/* Dynamic Page View */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

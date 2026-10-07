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
  Users,
  Building2,
  Sparkles,
  Check,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [financeQueueCount, setFinanceQueueCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // If on login page, don't show the sidebar shell
  const isLoginPage = pathname === '/login';

  const loadUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);

        // Fetch counts for badges
        if (data.user) {
          if (['Reporting Manager', 'Head of Department', 'Head of Division', 'MD', 'Admin'].includes(data.user.role)) {
            fetch('/api/approvals')
              .then((r) => r.json())
              .then((d) => setPendingApprovalsCount(d.approvals?.length || 0))
              .catch(() => {});
          }
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
      } else if (!isLoginPage) {
        // Redirect unauthenticated to login
        router.push('/login');
      }
    } catch (e) {
      console.error(e);
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

    // Load users list for account switcher helper
    fetch('/api/auth/users')
      .then((r) => r.json())
      .then((d) => setUsersList(d.users || []))
      .catch(() => {});
  }, [pathname, isLoginPage]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    window.location.href = '/login';
  };

  const handleSwitchAccount = async (empCode: string) => {
    await fetch('/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empCode }),
    });
    setIsSwitchModalOpen(false);
    window.location.reload();
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  const isManager = user && ['Reporting Manager', 'Head of Department', 'Head of Division', 'MD', 'Admin'].includes(user.role);
  const isFinance = user && ['Finance', 'Admin'].includes(user.role);

  // Generate breadcrumb titles
  const getBreadcrumbs = () => {
    if (pathname === '/dashboard' || pathname === '/') return [{ label: 'Dashboard', href: '/dashboard' }];
    if (pathname === '/requests') return [{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Requests', href: '/requests' }];
    if (pathname === '/requests/new') return [{ label: 'Requests', href: '/requests' }, { label: 'New Request', href: '/requests/new' }];
    if (pathname.startsWith('/requests/new/')) return [{ label: 'Requests', href: '/requests' }, { label: 'New Request', href: '/requests/new' }, { label: 'Trip Creation Wizard', href: pathname }];
    if (pathname.startsWith('/requests/')) return [{ label: 'Requests', href: '/requests' }, { label: 'Request Details', href: pathname }];
    if (pathname === '/settlements') return [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settlements', href: '/settlements' }];
    if (pathname.startsWith('/settlements/')) return [{ label: 'Settlements', href: '/settlements' }, { label: 'Expense Claim Workspace', href: pathname }];
    if (pathname === '/approvals') return [{ label: 'Management', href: '/approvals' }, { label: 'Approval Queue', href: '/approvals' }];
    if (pathname === '/finance') return [{ label: 'Finance Operations', href: '/finance' }, { label: 'Settlement Verification & Payouts', href: '/finance' }];
    if (pathname === '/evidence') return [{ label: 'Workspace', href: '/dashboard' }, { label: 'Evidence Vault', href: '/evidence' }];
    if (pathname === '/audit') return [{ label: 'Compliance', href: '/audit' }, { label: 'Reports & Audit Log', href: '/audit' }];
    if (pathname === '/settings') return [{ label: 'System', href: '/settings' }, { label: 'Settings & Policy', href: '/settings' }];
    return [{ label: 'Nortex', href: '/dashboard' }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
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
          {/* Logo & Product Brand */}
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

          {/* Navigation Links */}
          <nav className="p-4 space-y-6">
            {/* Main Section */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Main
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
                  <span>Overview</span>
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
                  <span>My Requests</span>
                </div>
              </Link>

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
            </div>

            {/* Management Section */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Workflows
              </p>

              {isManager && (
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
              )}

              <Link
                href="/settlements"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  pathname === '/settlements' || pathname.startsWith('/settlements/')
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  <span>Settlements</span>
                </div>
              </Link>
            </div>

            {/* Finance & Audit Section */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Finance & Records
              </p>

              {isFinance && (
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
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Finance Center</span>
                  </div>
                  {financeQueueCount > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                      {financeQueueCount}
                    </span>
                  )}
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
                  <span>Evidence Vault</span>
                </div>
              </Link>

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
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Reports & Audit</span>
                </div>
              </Link>
            </div>

            {/* System */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                System
              </p>

              <Link
                href="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  pathname.startsWith('/settings')
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Settings & Policy</span>
                </div>
              </Link>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer: User Profile Card & Switcher */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate leading-none">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {user.designation}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-1.5 py-0.2 bg-slate-200/80 text-slate-700 rounded text-[9px] font-bold">
                      {user.role}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {user.costCentre}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200/60 text-[11px]">
                <button
                  onClick={() => setIsSwitchModalOpen(true)}
                  className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 transition font-medium"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Switch Role</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-slate-600 hover:text-rose-600 transition font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <Link href="/login" className="text-xs text-indigo-600 font-bold">Sign In</Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs hidden md:block">
          <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
            {/* Breadcrumb Path */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.label}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
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

            {/* Right Tools */}
            <div className="flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[11px] text-slate-500">
                    Logged in as: <strong className="text-slate-800">{user.name}</strong> ({user.role})
                  </span>
                </div>
              )}

              <Link
                href="/requests/new"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ New Request</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">{children}</main>

        {/* Clean Corporate Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
            <p className="text-slate-600">
              &copy; {new Date().getFullYear()} Nortex Industries Ltd &middot; Travel & Expense Enterprise Platform
            </p>
            <p className="text-slate-400 font-mono">
              Policy NTX-HR-POL-11 Rev 4 &middot; Centralized Policy & Workflow Engine
            </p>
          </div>
        </footer>
      </div>

      {/* Demo Persona Switcher Modal (Clean Dev Tool) */}
      {isSwitchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-elevation border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Switch User Account</h3>
              </div>
              <button
                onClick={() => setIsSwitchModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select any corporate persona from <code>employee_master.csv</code> to inspect role-specific views and approval queues.
            </p>

            <div className="space-y-2">
              {usersList.map((u) => {
                const isSelected = user?.empCode === u.empCode;
                return (
                  <button
                    key={u.empCode}
                    onClick={() => handleSwitchAccount(u.empCode)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-start justify-between gap-2 text-xs ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 font-semibold'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{u.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">[{u.empCode}]</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{u.designation} &middot; {u.department}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.2 bg-white border border-slate-200 text-indigo-700 rounded text-[9px] font-bold">
                        Role: {u.role}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 mt-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

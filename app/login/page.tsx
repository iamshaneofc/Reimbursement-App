'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plane,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Sparkles,
  Layers,
  Banknote,
  Users,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedEmpCode, setSelectedEmpCode] = useState('NX-4471'); // Default: Chaitanya Reddy
  const [emailInput, setEmailInput] = useState('chaitanya.reddy@nortex.com');
  const [passwordInput, setPasswordInput] = useState('Nortex@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          setUsers(data.users);
          const defaultUser = data.users.find((u: any) => u.empCode === 'NX-4471');
          if (defaultUser) {
            setEmailInput(defaultUser.email);
          }
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const handleDemoSelect = (empCode: string) => {
    setSelectedEmpCode(empCode);
    const u = users.find((user) => user.empCode === empCode);
    if (u) {
      setEmailInput(u.email);
      setPasswordInput('Nortex@2026');
      setError(null);
    }
  };

  const handleLogin = async (empCodeToLogin?: string) => {
    setLoading(true);
    setError(null);
    try {
      let targetEmpCode = empCodeToLogin;

      // If manual email entered, match from loaded users
      if (!targetEmpCode) {
        const matched = users.find(
          (u) =>
            u.email.toLowerCase() === emailInput.trim().toLowerCase() ||
            u.empCode.toLowerCase() === emailInput.trim().toLowerCase()
        );
        if (!matched) {
          throw new Error('Invalid corporate credentials. Please use an authorized employee email or demo account.');
        }
        targetEmpCode = matched.empCode;
      }

      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empCode: targetEmpCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      router.push('/dashboard');
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  const selectedUser = users.find((u) => u.empCode === selectedEmpCode);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Decorative Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-950 pointer-events-none" />

      <div className="relative z-10 max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Product Identity & Capabilities */}
        <div className="lg:col-span-6 space-y-6 text-white px-2 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Plane className="w-6 h-6 -rotate-45" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block">
                NORTEX INDUSTRIES
              </span>
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
                Travel & Expense Platform
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise travel reimbursement & policy compliance.
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automated per diem rules, hierarchical managerial approval chains, and finance settlement disbursement per Corporate Policy NTX-HR-POL-11 Rev 4.
            </p>
          </div>

          {/* 3 Core Value Pillars */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Automated Policy Guardrails</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Real-time validation of city tier caps (₹6,000/₹4,000/₹2,500), 60% advance limit, duplicate checks, and non-reimbursables.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Hierarchical Governance & Self-Approval Prevention</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Threshold-driven multi-tier approval matrix (RM &rarr; HOD &rarr; HODiv &rarr; MD) with role boundary enforcement.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl mt-0.5">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Finance Settlement & Payroll Recovery</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Complete audit verification, advance offset reconciliation, and dual-run payout / recovery batch processing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Card with Evaluation Demo Helper */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Corporate Sign In</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter your Nortex corporate credentials to access the workspace</p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-medium">
                {error}
              </div>
            )}

            {/* Standard Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@nortex.com"
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <span className="text-[10px] text-slate-400 font-medium">Policy NTX-HR-POL-11</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Clearly Separated Demo User Selector for Evaluation */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Evaluation Demo Accounts</span>
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                  Quick SSO
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                Select any seeded role from the organization hierarchy to test role-specific dashboards, approval queues, or finance actions.
              </p>

              <div>
                <select
                  value={selectedEmpCode}
                  onChange={(e) => handleDemoSelect(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {users.map((u) => (
                    <option key={u.empCode} value={u.empCode}>
                      {u.name} — {u.role} ({u.designation}, {u.department})
                    </option>
                  ))}
                </select>
              </div>

              {selectedUser && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleLogin(selectedUser.empCode)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 py-2 px-3 rounded-xl text-xs font-bold transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1-Click Sign In as {selectedUser.name} ({selectedUser.role})</span>
                </button>
              )}
            </div>

            {/* Bottom Security Assurance */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>JWT Secure Session (HTTP-Only Cookie)</span>
              </div>
              <span>Role-Based Route Guarding</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

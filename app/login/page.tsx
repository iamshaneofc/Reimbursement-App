'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Users, Shield, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleDemoLogin = async (empCode: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empCode }),
      });

      if (res.ok) {
        router.push('/dashboard');
        window.location.href = '/dashboard';
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center px-4 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg">
          <Plane className="w-7 h-7 -rotate-45" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">NORTEX INDUSTRIES</h1>
        <p className="text-sm text-slate-300">
          Travel & Expense Reimbursement Platform &middot; AI Planet Take-Home Prototype
        </p>
        <p className="text-xs text-indigo-400 font-medium max-w-lg mx-auto">
          Select any seeded corporate persona below to test multi-tier approval chains, policy engine rules, settlements, and finance payouts.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl px-4">
        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-elevation space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Demo Persona (from employee_master.csv)
            </span>
            <span className="text-xs text-indigo-400 font-semibold">1-Click Instant Login</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {users.map((u) => (
              <button
                key={u.empCode}
                disabled={loading}
                onClick={() => handleDemoLogin(u.empCode)}
                className="text-left p-4 rounded-2xl bg-slate-900/80 hover:bg-indigo-950/60 border border-slate-700/80 hover:border-indigo-500 transition group flex items-start justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white group-hover:text-indigo-300 transition text-sm">
                      {u.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">[{u.empCode}]</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{u.designation}</p>
                  <p className="text-[11px] text-slate-500">{u.department} &middot; Cost Centre: {u.costCentre}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-slate-800 text-indigo-300 rounded text-[10px] font-semibold">
                    Role: {u.role}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition mt-1" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

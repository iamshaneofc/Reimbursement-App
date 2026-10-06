'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Check, ChevronDown, Shield, Sparkles } from 'lucide-react';

interface UserOption {
  id: string;
  empCode: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  role: string;
}

export function PersonaSwitcher() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserOption | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        } else {
          // Auto demo-login as Chaitanya Reddy if not logged in
          handleSwitchPersona('NX-4471');
        }
      })
      .catch(() => {});

    fetch('/api/auth/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .catch(() => {});
  }, []);

  const handleSwitchPersona = async (empCode: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empCode }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setIsOpen(false);
        router.refresh();
        // Give time for state to reload
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white text-xs px-4 py-2 border-b border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-[11px] font-semibold">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Demo Persona Switcher</span>
        </div>
        <span className="hidden sm:inline text-slate-400 text-[11px]">
          Test end-to-end multi-role workflows in 1 click:
        </span>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 px-3 py-1 rounded-lg transition"
        >
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-white">
            {currentUser ? `${currentUser.name} (${currentUser.role})` : 'Select Persona'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {currentUser?.empCode}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-elevation z-50 overflow-hidden py-1 max-h-[80vh] overflow-y-auto">
            <div className="px-3 py-2 border-b border-slate-800 text-[11px] text-slate-400 font-medium">
              Switch Active User Persona
            </div>

            {users.map((u) => {
              const isSelected = currentUser?.empCode === u.empCode;
              return (
                <button
                  key={u.empCode}
                  disabled={loading}
                  onClick={() => handleSwitchPersona(u.empCode)}
                  className={`w-full text-left px-3 py-2 flex items-start justify-between gap-2 hover:bg-slate-800/90 transition text-xs ${
                    isSelected ? 'bg-indigo-950/50 text-indigo-300' : 'text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{u.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">[{u.empCode}]</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{u.designation} &middot; {u.department}</p>
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-slate-800 text-indigo-300 rounded text-[10px] font-medium">
                      {u.role}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-400 mt-1" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

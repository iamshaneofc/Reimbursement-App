import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PersonaSwitcher } from '@/components/PersonaSwitcher';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nortex Industries — Travel & Expense Reimbursement',
  description: 'Enterprise Travel Request, Multi-Tier Approval, Settlement and Policy Verification Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900`}>
        {/* Top Demo Persona Switcher */}
        <PersonaSwitcher />

        {/* Navigation Bar */}
        <Navbar />

        {/* Main Content */}
        <main className="flex-1 pb-16">{children}</main>

        {/* Footer with Policy Document Reference */}
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            <p className="font-medium text-slate-700">Nortex Industries Ltd &middot; Travel & Expense Platform</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Compliant with NTX-HR-POL-11 Rev 4 &middot; Centralized Policy Engine & Audit Trail
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

'use client';

import Link from 'next/link';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="stitch-card p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
          <ShieldX size={32} className="text-red-500" />
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 text-sm mb-1">
          You don&apos;t have permission to view this page.
        </p>
        <p className="text-slate-400 text-xs mb-8">
          This area is restricted to a different role. Please sign in with the correct account.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm transition-all"
          >
            <Home size={15} /> Go to Homepage
          </Link>
          <Link
            href="/auth/login"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all"
          >
            <ArrowLeft size={15} /> Sign In with Another Account
          </Link>
        </div>
      </div>
    </div>
  );
}

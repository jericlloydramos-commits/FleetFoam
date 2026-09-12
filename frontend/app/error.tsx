'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Route Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="stitch-card p-8 sm:p-10 text-center max-w-md w-full border border-slate-200 shadow-lg space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
          <AlertTriangle size={32} />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Application Refresh Needed
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">
            The page cache is updating with the latest system changes. Click retry below to reload smoothly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw size={14} /> Retry Page
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Home size={14} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

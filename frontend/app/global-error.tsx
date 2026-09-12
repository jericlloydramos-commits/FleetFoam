'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
        <div className="bg-white rounded-3xl p-8 sm:p-10 text-center max-w-md w-full border border-slate-200 shadow-xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <AlertTriangle size={32} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Something went wrong
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">
              A temporary runtime issue occurred. Please click below to refresh the application session.
            </p>
          </div>

          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <RefreshCw size={16} /> Refresh Application
          </button>
        </div>
      </body>
    </html>
  );
}

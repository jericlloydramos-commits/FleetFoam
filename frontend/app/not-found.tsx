'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { useAuth } from '@/lib/auth-context';
import { Compass, Home, ArrowLeft, ArrowRight, Sparkles, LogIn } from 'lucide-react';

export default function NotFoundPage() {
  const { user, profile } = useAuth();

  const getAuthorizedDest = () => {
    if (profile?.role === 'CREW') {
      return { href: '/crew', label: 'Crew Field Terminal', role: 'CREW' };
    }
    if (profile?.role === 'OPERATIONS') {
      return { href: '/ops', label: 'Operations Command Hub', role: 'OPERATIONS' };
    }
    return { href: '/booking', label: 'Customer Booking Studio', role: 'CUSTOMER' };
  };

  const authorizedDest = getAuthorizedDest();

  return (
    <div className="min-h-screen bg-slate-subtle text-slate-900 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-16 flex items-center justify-center">
        <div className="stitch-card p-8 sm:p-10 text-center space-y-6 border-2 border-slate-200 shadow-xl w-full">
          <div className="w-16 h-16 bg-sky-100 border border-sky-200 text-sky-700 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <Compass size={32} className="animate-spin" style={{ animationDuration: '8s' }} />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-sky-700 px-3 py-1 bg-sky-50 rounded-full border border-sky-200">
              404 &bull; Dispatch Location Not Found
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-1">
              Route Not Found
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto">
              The requested URL does not match any active FleetFoam dispatch hub, customer portal, or operational route.
            </p>
          </div>

          {/* Role-isolated destination card */}
          {user ? (
            <div className="pt-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Your Active Session:</span>
                <span className="text-xs font-extrabold text-sky-700">{profile?.role ?? 'USER'}</span>
              </div>
              <Link
                href={authorizedDest.href}
                className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Return to {authorizedDest.label}</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/login"
                className="flex-1 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <LogIn size={15} /> Sign In to FleetFoam
              </Link>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md min-h-[44px]"
            >
              <Home size={15} /> Return to Home
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center justify-center gap-2 min-h-[44px]"
            >
              <ArrowLeft size={15} /> Go Back
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

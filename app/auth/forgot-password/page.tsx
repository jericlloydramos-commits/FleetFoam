'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-subtle text-slate-900 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-16 flex items-center justify-center">
        <div className="stitch-card p-8 text-center space-y-6 border border-slate-200 shadow-xl w-full">
          <div className="w-14 h-14 bg-sky-100 border border-sky-200 text-sky-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <KeyRound size={28} />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              Account Security &bull; Password Reset
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight pt-1">
              Reset Your Password
            </h1>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
              Enter your registered FleetFoam account email to receive recovery instructions.
            </p>
          </div>

          {submitted ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <span>Reset Link Dispatched</span>
              </div>
              <p className="text-xs text-emerald-700 font-medium">
                We sent a temporary recovery token to <strong className="text-emerald-900">{email}</strong>. Check your inbox to complete reset.
              </p>
              <div className="pt-2">
                <Link
                  href="/auth/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label htmlFor="reset-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    placeholder="e.g. customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all min-h-[48px]"
              >
                {isSubmitting ? 'Sending Instructions...' : 'Send Password Reset Link'}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/auth/login"
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                >
                  <ArrowLeft size={12} /> Return to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

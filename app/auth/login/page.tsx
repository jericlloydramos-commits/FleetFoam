'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export default function LoginPage() {
  const { signIn, user, profile, signOut } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!password) { setError('Please enter your password.'); return; }

    setSubmitting(true);
    const { error: authError } = await signIn(email.trim(), password);
    setSubmitting(false);

    if (authError) {
      setError(authError);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      let userRole = profile?.role;
      if (!userRole && typeof window !== 'undefined') {
        try {
          const session = JSON.parse(localStorage.getItem('fleetfoam_mock_session') || '{}');
          userRole = session.role;
        } catch {}
      }

      if (userRole === 'CREW') {
        window.location.href = '/crew';
      } else if (userRole === 'OPERATIONS') {
        window.location.href = '/ops';
      } else {
        window.location.href = '/booking';
      }
    }, 400);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="stitch-card p-10 text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-1">Welcome back!</h2>
          <p className="text-slate-500 text-sm">Signing you in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100 flex flex-col">
      {/* Top Nav */}
      <nav className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Sparkles size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[16px] font-extrabold tracking-tight text-slate-900 leading-none">FleetFoam</span>
            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-widest mt-0.5 leading-none">Detail Coordinator</span>
          </div>
        </Link>
        <p className="text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-sky-600 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </nav>

      <main className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold tracking-wide shadow-sm mb-4">
              <Sparkles size={13} className="text-sky-500 animate-pulse" />
              <span>Welcome Back</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sign in to FleetFoam</h1>
            <p className="text-slate-500 text-sm mt-2">Enter your credentials to access your dashboard.</p>
          </div>

          {/* Form Card */}
          <div className="stitch-card p-8">
            {user && (
              <div className="mb-5 p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Currently Signed In:</span>
                  <span className="font-extrabold text-sky-900">{profile?.name || user.email}</span>
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-sky-200/60 text-sky-800 font-bold text-[10px]">
                    {profile?.role || 'CUSTOMER'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    window.location.reload();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <Link href="/auth/forgot-password" className="text-xs text-sky-600 hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-6 rounded-xl font-bold text-sm text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 transition-all flex items-center justify-center gap-2 mt-1"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* System Security Notice */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-xs">
              <ShieldCheck size={14} className="text-sky-600" />
              <span>FleetFoam Detail Coordinator • Authorized Access Only</span>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-sky-600 font-semibold hover:underline">
              Create one here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

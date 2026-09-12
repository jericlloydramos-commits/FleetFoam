'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';
import {
  Sparkles,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Calendar,
  Truck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const ROLES: { value: UserRole; label: string; description: string; icon: React.ReactNode; color: string; border: string; bg: string }[] = [
  {
    value: 'CUSTOMER',
    label: 'Customer',
    description: 'Book vehicle detailing services, track appointments, and manage your fleet.',
    icon: <Calendar size={22} />,
    color: 'text-sky-600',
    border: 'border-sky-500',
    bg: 'bg-sky-50',
  },
  {
    value: 'CREW',
    label: 'Crew Member',
    description: 'Access your job assignments, update status in the field, and manage your schedule.',
    icon: <Truck size={22} />,
    color: 'text-amber-600',
    border: 'border-amber-500',
    bg: 'bg-amber-50',
  },
];

export default function SignUpPage() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedRole) { setError('Please select your account type.'); return; }
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setSubmitting(true);
    const { error: authError } = await signUp(email.trim(), password, name.trim(), selectedRole);
    setSubmitting(false);

    if (authError) {
      setError(authError);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      if (selectedRole === 'CUSTOMER') router.push('/booking');
      else if (selectedRole === 'CREW') router.push('/crew');
    }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-subtle flex items-center justify-center p-4">
        <div className="stitch-card p-10 text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-1">Account Created!</h2>
          <p className="text-slate-500 text-sm">Redirecting you to your dashboard…</p>
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
          Already have an account?{' '}
          <Link href="/auth/login" className="text-sky-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </nav>

      <main className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold tracking-wide shadow-sm mb-4">
              <Sparkles size={13} className="text-sky-500 animate-pulse" />
              <span>Create Your Account</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {step === 1 ? 'Who are you joining as?' : `Set up your ${selectedRole === 'CUSTOMER' ? 'Customer' : 'Crew'} account`}
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              {step === 1 ? 'Choose your account type to get started.' : 'Fill in your details to create your account.'}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-sky-700' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${step >= 1 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
              Choose Role
            </div>
            <div className={`h-px w-10 ${step >= 2 ? 'bg-sky-400' : 'bg-slate-200'}`} />
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 2 ? 'text-sky-700' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${step === 2 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
              Your Details
            </div>
          </div>

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleSelect(role.value)}
                  className={`stitch-card stitch-card-hover p-6 text-left flex flex-col gap-4 cursor-pointer transition-all group ${
                    selectedRole === role.value ? `${role.border} border-2` : 'hover:border-slate-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${role.bg} border flex items-center justify-center ${role.color} group-hover:scale-105 transition-transform`}
                    style={{ borderColor: 'currentcolor', opacity: 0.3 }}>
                    <span className={role.color}>{role.icon}</span>
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-base mb-1">{role.label}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{role.description}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${role.color}`}>
                    Get started <ArrowRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Details Form */}
          {step === 2 && (
            <div className="stitch-card p-8">
              <button
                type="button"
                onClick={() => { setStep(1); setError(null); }}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold mb-6 flex items-center gap-1 transition-colors"
              >
                ← Back to role selection
              </button>

              {/* Selected role badge */}
              {selectedRole && (
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-6 ${
                  selectedRole === 'CUSTOMER' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {selectedRole === 'CUSTOMER' ? <Calendar size={12} /> : <Truck size={12} />}
                  {selectedRole === 'CUSTOMER' ? 'Customer Account' : 'Crew Member Account'}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="signup-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="signup-name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="e.g. Juan Dela Cruz"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="signup-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="signup-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="signup-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password <span className="font-normal text-slate-400">(min. 6 characters)</span>
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Create a password"
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

                {/* Confirm Password */}
                <div>
                  <label htmlFor="signup-confirm-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  className={`w-full py-3 px-6 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 mt-2 ${
                    selectedRole === 'CREW'
                      ? 'bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300'
                      : 'bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300'
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating account…
                    </span>
                  ) : (
                    <>
                      Create Account <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400 mt-2">
                  By signing up, you agree to FleetFoam&apos;s{' '}
                  <span className="text-sky-600 cursor-pointer hover:underline">Terms of Service</span>.
                </p>
              </form>
            </div>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-sky-600 font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

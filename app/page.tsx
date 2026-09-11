'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { useAuth } from '@/lib/auth-context';
import {
  Sparkles,
  ShieldCheck,
  Calendar,
  Truck,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  UserPlus,
  Clock,
  Star,
  Lock,
  Eye,
  ShieldAlert,
  LogIn,
} from 'lucide-react';

export default function LandingPage() {
  const { user, profile } = useAuth();

  const role = profile?.role; // 'CUSTOMER' | 'CREW' | 'OPERATIONS' | undefined

  // Helper for direct home hero action
  const getHeroDestination = () => {
    if (role === 'CREW') return { href: '/crew', name: 'Field Crew Terminal', roleLabel: 'CREW' };
    if (role === 'OPERATIONS') return { href: '/ops', name: 'Ops Command Hub', roleLabel: 'OPERATIONS' };
    return { href: '/booking', name: 'Customer Booking Studio', roleLabel: 'CUSTOMER' };
  };

  const heroDest = getHeroDestination();

  return (
    <div className="min-h-screen mesh-bg text-slate-800 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* Main Hero Header */}
        <header className="text-center max-w-3xl mx-auto space-y-5 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold tracking-wide shadow-sm backdrop-blur-sm">
            <Sparkles size={14} className="text-sky-600 animate-pulse" />
            <span>Enterprise Detail Coordination &amp; Mobile Operations</span>
          </div>

          {/* Personalized greeting & active role pill if logged in */}
          {user && profile && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Signed In: {profile.name}</span>
              <span className="text-emerald-300">|</span>
              <span className="uppercase tracking-wider">Role: {profile.role}</span>
            </div>
          )}

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Next-Gen Fleet <br />
            <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
              Detailing &amp; Dispatch
            </span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            Mobile vehicle detailing coordination engineered with strict slot collision guards, outdoor crew state machines, and isolated role dashboards.
          </p>

          {/* CTA Buttons based on authentication */}
          {!user ? (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md btn-primary-glow transition-all"
              >
                <UserPlus size={16} /> Get Started — Create Account
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 bg-white/90 hover:bg-white text-slate-800 font-bold text-sm shadow-sm transition-all hover:border-slate-400"
              >
                <LogIn size={16} /> Sign In
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={heroDest.href}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-sm shadow-md btn-primary-glow transition-all"
              >
                <span>Enter My Authorized Workspace ({heroDest.name})</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </header>

        {/* Live KPI Metric Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="stitch-card p-4 sm:p-5 flex items-center gap-3.5 bg-white/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">18</p>
              <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Active Crews</p>
            </div>
          </div>

          <div className="stitch-card p-4 sm:p-5 flex items-center gap-3.5 bg-white/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">99.2%</p>
              <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">On-Time SLA</p>
            </div>
          </div>

          <div className="stitch-card p-4 sm:p-5 flex items-center gap-3.5 bg-white/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">45m</p>
              <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Avg Wash Time</p>
            </div>
          </div>

          <div className="stitch-card p-4 sm:p-5 flex items-center gap-3.5 bg-white/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <Star size={20} className="fill-indigo-500 text-indigo-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">4.98</p>
              <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Client CSAT</p>
            </div>
          </div>
        </div>

        {/* 3 Role Portals — Clear Role Separation & Explicit Access States */}
        <div className="space-y-4">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Role-Isolated Portals &amp; Workspaces
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Select your role portal. Role-Based Access Control (RBAC) isolates permissions and prevents cross-role access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 1. CUSTOMER PORTAL */}
            {(() => {
              const isCustomer = role === 'CUSTOMER';
              const isOps = role === 'OPERATIONS';
              const isCrew = role === 'CREW';
              const isGuest = !user;

              let cardStyle = 'bg-white border border-slate-200/80';
              let badge = null;

              if (isCustomer) {
                cardStyle = 'bg-white border-2 border-sky-500 shadow-lg shadow-sky-500/10 ring-2 ring-sky-500/20';
                badge = (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    <Sparkles size={11} className="text-sky-600" /> Your Active Workspace
                  </span>
                );
              } else if (isOps) {
                cardStyle = 'bg-white border border-slate-300 shadow-sm';
                badge = (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    <Eye size={11} /> Supervisor Emulation
                  </span>
                );
              } else if (isCrew) {
                cardStyle = 'bg-slate-50/70 border border-dashed border-slate-300 opacity-80';
                badge = (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    <Lock size={11} /> Restricted to Customers
                  </span>
                );
              } else {
                badge = (
                  <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-100">
                    For Vehicle Owners
                  </span>
                );
              }

              return (
                <div className={`stitch-card p-7 sm:p-8 flex flex-col justify-between transition-all ${cardStyle}`}>
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-xs">
                        <Calendar size={24} />
                      </div>
                      {badge}
                    </div>

                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-sky-700 block mb-1">
                      Customer Portal (CUS-01 — CUS-08)
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mb-2">
                      Interactive Wash Studio
                    </h3>
                    <p className="text-slate-600 text-xs leading-relaxed mb-6 font-medium">
                      Self-service booking studio with vehicle spec validation (FTC-02), live slot conflict checking (FTC-01), and appointment tracking.
                    </p>

                    <div className="space-y-2 mb-6 text-xs text-slate-500 font-semibold border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-sky-600" /> Real-time slot availability checker
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-sky-600" /> Transparent pricing &amp; duration breakdown
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-sky-600" /> Track confirmed wash bookings
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {isGuest && (
                    <div className="space-y-2 pt-2">
                      <Link
                        href="/auth/login?redirect=/booking"
                        className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm btn-primary-glow"
                      >
                        <span>Sign In as Customer</span>
                        <ArrowRight size={15} />
                      </Link>
                      <Link
                        href="/auth/signup"
                        className="block text-center text-[11px] font-bold text-slate-500 hover:text-sky-600"
                      >
                        Don&apos;t have an account? Sign up
                      </Link>
                    </div>
                  )}

                  {isCustomer && (
                    <div className="space-y-2 pt-2">
                      <Link
                        href="/booking"
                        className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md btn-primary-glow"
                      >
                        <span>Enter Customer Booking Studio</span>
                        <ArrowRight size={16} />
                      </Link>
                      <Link
                        href="/appointments"
                        className="block text-center text-xs font-bold text-sky-700 hover:underline pt-1"
                      >
                        View My Appointments &rarr;
                      </Link>
                    </div>
                  )}

                  {isOps && (
                    <div className="pt-2">
                      <Link
                        href="/booking"
                        className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-300"
                      >
                        <span>Inspect Customer Flow (Supervisor)</span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  )}

                  {isCrew && (
                    <div className="pt-2">
                      <Link
                        href="/unauthorized?required=CUSTOMER&current=CREW"
                        className="w-full py-3 px-4 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors"
                      >
                        <Lock size={14} />
                        <span>Restricted to Customers (AUTH-03)</span>
                      </Link>
                      <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
                        Crew members cannot access customer booking flow.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 2. CREW TERMINAL */}
            {(() => {
              const isCrew = role === 'CREW';
              const isOps = role === 'OPERATIONS';
              const isCustomer = role === 'CUSTOMER';
              const isGuest = !user;

              let cardStyle = 'bg-white border border-slate-200/80';
              let badge = null;

              if (isCrew) {
                cardStyle = 'bg-white border-2 border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20';
                badge = (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                    <Sparkles size={11} className="text-amber-600" /> Your Active Workspace
                  </span>
                );
              } else if (isOps) {
                cardStyle = 'bg-white border border-slate-300 shadow-sm';
                badge = (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    <Eye size={11} /> Supervisor Emulation
                  </span>
                );
              } else if (isCustomer) {
                cardStyle = 'bg-slate-50/70 border border-dashed border-slate-300 opacity-80';
                badge = (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    <Lock size={11} /> Restricted to Crew
                  </span>
                );
              } else {
                badge = (
                  <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    For Field Technicians
                  </span>
                );
              }

              return (
                <div className={`stitch-card p-7 sm:p-8 flex flex-col justify-between transition-all ${cardStyle}`}>
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
                        <Truck size={24} />
                      </div>
                      {badge}
                    </div>

                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-800 block mb-1">
                      Field Crew App (CREW-01 — CREW-03)
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mb-2">
                      Outdoor Field Terminal
                    </h3>
                    <p className="text-slate-600 text-xs leading-relaxed mb-6 font-medium">
                      High-contrast outdoor touch interface enforcing sequential status progression (FTC-03) with built-in network failure simulation and retry recovery.
                    </p>

                    <div className="space-y-2 mb-6 text-xs text-slate-500 font-semibold border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-amber-600" /> Minimum 56px outdoor touch targets
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-amber-600" /> Sequential state machine pipeline
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-amber-600" /> Offline retry error banner &amp; diagnostics
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {isGuest && (
                    <div className="space-y-2 pt-2">
                      <Link
                        href="/auth/login?redirect=/crew"
                        className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm btn-amber-glow"
                      >
                        <span>Sign In as Crew</span>
                        <ArrowRight size={15} />
                      </Link>
                      <Link
                        href="/auth/signup"
                        className="block text-center text-[11px] font-bold text-slate-500 hover:text-amber-700"
                      >
                        Register as Crew Specialist
                      </Link>
                    </div>
                  )}

                  {isCrew && (
                    <div className="pt-2">
                      <Link
                        href="/crew"
                        className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md btn-amber-glow"
                      >
                        <span>Enter Crew Field Terminal</span>
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  )}

                  {isOps && (
                    <div className="pt-2">
                      <Link
                        href="/crew"
                        className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-300"
                      >
                        <span>Inspect Crew Terminal (Supervisor)</span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  )}

                  {isCustomer && (
                    <div className="pt-2">
                      <Link
                        href="/unauthorized?required=CREW&current=CUSTOMER"
                        className="w-full py-3 px-4 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors"
                      >
                        <Lock size={14} />
                        <span>Restricted to Crew (AUTH-03)</span>
                      </Link>
                      <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
                        Customers cannot view internal field crew dispatch screens.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 3. OPERATIONS COMMAND HUB */}
            {(() => {
              const isOps = role === 'OPERATIONS';
              const isCustomer = role === 'CUSTOMER';
              const isCrew = role === 'CREW';
              const isGuest = !user;

              let cardStyle = 'bg-white border border-slate-200/80';
              let badge = null;

              if (isOps) {
                cardStyle = 'bg-white border-2 border-slate-900 shadow-xl ring-2 ring-slate-900/20';
                badge = (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-slate-900 text-white shadow-xs">
                    <Sparkles size={11} className="text-amber-400" /> Admin Command Center
                  </span>
                );
              } else if (isCustomer || isCrew) {
                cardStyle = 'bg-slate-50/70 border border-dashed border-slate-300 opacity-80';
                badge = (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    <Lock size={11} /> Restricted to Operations
                  </span>
                );
              } else {
                badge = (
                  <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                    For Dispatchers &amp; Admins
                  </span>
                );
              }

              return (
                <div className={`stitch-card p-7 sm:p-8 flex flex-col justify-between transition-all ${cardStyle}`}>
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white shadow-xs">
                        <Activity size={24} />
                      </div>
                      {badge}
                    </div>

                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-800 block mb-1">
                      Ops Control (OPS-01 &amp; OPS-03)
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mb-2">
                      Real-Time Ops Dashboard
                    </h3>
                    <p className="text-slate-600 text-xs leading-relaxed mb-6 font-medium">
                      Fleet management matrix showing active washes, instant crew dispatch assignments, conflict warnings, and status overrides.
                    </p>

                    <div className="space-y-2 mb-6 text-xs text-slate-500 font-semibold border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-slate-800" /> Real-time crew dispatch assignments
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-slate-800" /> Automated slot overlap collision detection
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-slate-800" /> Supervisor status overrides &amp; delay logging
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {isGuest && (
                    <div className="space-y-2 pt-2">
                      <Link
                        href="/auth/login?redirect=/ops"
                        className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                      >
                        <span>Sign In as Admin</span>
                        <ArrowRight size={15} />
                      </Link>
                      <p className="text-[10px] text-slate-400 text-center">
                        Requires verified operations credentials.
                      </p>
                    </div>
                  )}

                  {isOps && (
                    <div className="pt-2">
                      <Link
                        href="/ops"
                        className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
                      >
                        <span>Open Operations Command Hub</span>
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  )}

                  {(isCustomer || isCrew) && (
                    <div className="pt-2">
                      <Link
                        href={`/unauthorized?required=OPERATIONS&current=${role}`}
                        className="w-full py-3 px-4 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors"
                      >
                        <Lock size={14} />
                        <span>Restricted to Admin (AUTH-03)</span>
                      </Link>
                      <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
                        Central operations control room is restricted to administrative staff.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Integrated Defense Architecture Card */}
        <div className="stitch-card p-8 sm:p-10 border border-slate-200/90 shadow-sm bg-white/90">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center justify-center gap-2">
              <ShieldCheck className="text-sky-600" /> Integrated Defense Architecture
            </h3>
            <p className="text-slate-500 text-xs mt-1.5 font-medium">
              Enterprise workflow constraints enforced across frontend forms, Role-Based Access Control, and Next.js App Router API endpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="bg-sky-50/50 p-5 rounded-2xl border border-sky-100">
              <div className="flex items-center gap-2 font-black text-sky-900 mb-2 text-sm">
                <Zap size={18} className="text-sky-600" /> FTC-01 Conflict Guard
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                `/api/bookings/availability` queries Supabase to prevent overlapping appointments, rejecting slot collisions with standard FTC-01 409 responses.
              </p>
            </div>

            <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-2 font-black text-amber-900 mb-2 text-sm">
                <AlertTriangle size={18} className="text-amber-600" /> FTC-02 Vehicle Guard
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                Step 2 of the customer booking studio strictly validates vehicle Make, Model, and License Plate before allowing progression to Step 3.
              </p>
            </div>

            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-2 font-black text-emerald-900 mb-2 text-sm">
                <CheckCircle2 size={18} className="text-emerald-600" /> FTC-03 State Machine
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                Enforces sequential order: `SCHEDULED -&gt; ON_THE_WAY -&gt; ARRIVED -&gt; IN_PROGRESS -&gt; COMPLETED` with error recovery and retry buttons.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 border-t border-slate-200/80 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-600">FleetFoam Detail Coordinator System</span>
          </div>
          <p>© 2026 FleetFoam Inc. All workflows verified and defended.</p>
        </footer>
      </main>
    </div>
  );
}

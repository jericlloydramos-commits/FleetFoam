'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  AlertTriangle,
  CalendarClock,
  User,
  Truck,
  ShieldAlert,
  Navigation,
} from 'lucide-react';

interface SidebarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200/80 z-40 flex-col justify-between py-4 select-none">
      <div className="flex-1 overflow-y-auto px-3 space-y-4">
        {/* Operations Core */}
        <div className="space-y-1">
          <div className="px-3 pt-1 pb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Operations Core
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            <Link
              href="/ops"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs tracking-tight transition-all ${
                pathname === '/ops' && (!currentTab || currentTab === 'dashboard')
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              onClick={() => onSelectTab?.('dashboard')}
            >
              <LayoutDashboard size={18} className={pathname === '/ops' && (!currentTab || currentTab === 'dashboard') ? 'text-white' : 'text-slate-500'} />
              <span>Dashboard (OPS-01)</span>
            </Link>

            <Link
              href="/ops?tab=map"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-tight transition-all ${
                currentTab === 'map'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              onClick={() => onSelectTab?.('map')}
            >
              <Navigation size={18} className={currentTab === 'map' ? 'text-emerald-400' : 'text-slate-400'} />
              <div className="flex items-center justify-between w-full">
                <span>Live PH Map (METRO-01)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
            </Link>

            <Link
              href="/ops?tab=today"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-tight transition-all ${
                currentTab === 'today'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              onClick={() => onSelectTab?.('today')}
            >
              <Calendar size={18} className="text-slate-400" />
              <span>Today&apos;s Appointments</span>
            </Link>

            <Link
              href="/ops?tab=scheduling"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-tight transition-all ${
                currentTab === 'scheduling'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              onClick={() => onSelectTab?.('scheduling')}
            >
              <Users size={18} className="text-slate-400" />
              <span>Crew Scheduling (OPS-03)</span>
            </Link>

            <Link
              href="/ops?tab=delays"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-tight transition-all ${
                currentTab === 'delays'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              onClick={() => onSelectTab?.('delays')}
            >
              <AlertTriangle size={18} className="text-slate-400" />
              <span>Delays &amp; Cancellations</span>
            </Link>

            <Link
              href="/ops?tab=upcoming"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-tight transition-all ${
                currentTab === 'upcoming'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              onClick={() => onSelectTab?.('upcoming')}
            >
              <CalendarClock size={18} className="text-slate-400" />
              <span>Upcoming Bookings</span>
            </Link>
          </nav>
        </div>

        {/* Supervisory Emulation */}
        <div className="space-y-1">
          <div className="px-3 pt-2 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Supervisory Emulation
            </span>
            <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Admin Only
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            <Link
              href="/booking"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-tight transition-all ${
                pathname === '/booking'
                  ? 'bg-sky-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User size={18} className={pathname === '/booking' ? 'text-white' : 'text-slate-400'} />
              <span>Inspect Customer Portal</span>
            </Link>

            <Link
              href="/crew"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-tight transition-all ${
                pathname === '/crew'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Truck size={18} className={pathname === '/crew' ? 'text-slate-950' : 'text-slate-400'} />
              <span>Inspect Crew Terminal</span>
            </Link>
          </nav>
        </div>

        {/* Administration */}
        <div className="space-y-1">
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Administration
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            <Link
              href="/ops?tab=rbac"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-tight transition-all ${
                currentTab === 'rbac'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              onClick={() => onSelectTab?.('rbac')}
            >
              <ShieldAlert size={18} className="text-slate-400" />
              <span>RBAC &amp; Security (AUTH-03)</span>
            </Link>

            <Link
              href="/ops?tab=roster"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-tight transition-all ${
                currentTab === 'roster'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              onClick={() => onSelectTab?.('roster')}
            >
              <Users size={18} className={currentTab === 'roster' ? 'text-white' : 'text-slate-400'} />
              <div className="flex items-center justify-between w-full">
                <span>User Roster &amp; Deletion</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-800">
                  AUTH-04
                </span>
              </div>
            </Link>
          </nav>
        </div>
      </div>

      {/* Bottom Telemetry Card */}
      <div className="px-4 pt-3 border-t border-slate-100">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-800">Dispatch Core</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-900 text-white">
              v2.4
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Fleet telemetry sync: Live</span>
        </div>
      </div>
    </aside>
  );
};

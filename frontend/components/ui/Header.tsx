'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, Bell, LogOut, LogIn, UserPlus, ChevronDown, CheckCircle2, UserCheck, PlusCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { mockDb, NOTIFICATIONS_CHANGE_EVENT } from '@/lib/supabase';
import { AppNotification } from '@/lib/types';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const updateNotifs = () => {
      if (user) {
        setNotifications(mockDb.getNotifications(user.id, profile?.role, user.email));
      } else {
        setNotifications([]);
      }
    };
    updateNotifs();
    window.addEventListener(NOTIFICATIONS_CHANGE_EVENT, updateNotifs);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGE_EVENT, updateNotifs);
  }, [user, profile]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSignOut = async () => {
    setDropdownOpen(false);
    setNotifOpen(false);
    await signOut();
    router.push('/');
  };

  // Compute user initials for avatar
  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';

  const roleColor = profile?.role === 'CREW'
    ? 'bg-amber-500'
    : profile?.role === 'OPERATIONS'
    ? 'bg-slate-700'
    : 'bg-sky-500';

  return (
    <header className="sticky top-0 left-0 right-0 z-50 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm flex items-center justify-between px-4 sm:px-6 transition-all">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-sky-500/25 group-hover:scale-105 transition-all">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[17px] font-black tracking-tight text-slate-900 leading-none group-hover:text-sky-600 transition-colors">
              FleetFoam
            </span>
            <span className="text-[10px] font-extrabold text-sky-700 uppercase tracking-widest mt-1 leading-none">
              Detail Coordinator
            </span>
          </div>
        </Link>

        {/* Live Dispatch Pill */}
        <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-50/90 rounded-full text-xs text-slate-600 border border-slate-200/80 font-medium shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold tracking-wider text-[10px] text-slate-900">LIVE DISPATCH</span>
          <span className="text-slate-300">|</span>
          <span className="font-semibold text-slate-700">18 Units Active</span>
          <span className="text-slate-300">•</span>
          <span className="text-sky-700 font-bold">99.2% On-Time</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role-Specific Navigation Links — only show what this user is authorized to view */}
        {user && profile && (
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {profile.role === 'CUSTOMER' && (
              <>
                <Link
                  href="/booking"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/booking'
                      ? 'bg-sky-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Book Service
                </Link>
                <Link
                  href="/appointments"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/appointments'
                      ? 'bg-sky-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My Appointments
                </Link>
              </>
            )}

            {profile.role === 'CREW' && (
              <Link
                href="/crew"
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  pathname === '/crew'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Crew Field Terminal
              </Link>
            )}

            {profile.role === 'OPERATIONS' && (
              <Link
                href="/ops"
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  pathname.startsWith('/ops')
                    ? 'bg-slate-900 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ops Command Hub
              </Link>
            )}
          </div>
        )}

        {/* Notifications Bell & Popover — only for logged-in users */}
        {user && (
          <div className="relative">
            <button
              type="button"
              aria-label={`Notifications (${unreadCount} unread)`}
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setDropdownOpen(false);
              }}
              className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
            >
              <Bell size={18} className="text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/80 overflow-hidden animate-fadeIn">
                  {/* Popover Header */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                    <div className="flex items-center gap-2">
                      <Bell size={15} className="text-sky-700" />
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-700 border border-sky-200">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => mockDb.markAllNotificationsAsRead(user.id, profile?.role, user.email)}
                        className="text-[11px] font-bold text-sky-600 hover:text-sky-800 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 space-y-2">
                        <CheckCircle2 size={28} className="mx-auto text-slate-300" />
                        <p className="text-xs font-bold text-slate-600">All caught up!</p>
                        <p className="text-[11px] text-slate-400">No recent notifications.</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const isCrewAssigned = notif.type === 'CREW_ASSIGNED';
                        const isCustomerAccepted = notif.type === 'CUSTOMER_ACCEPTED';
                        const isCompleted = notif.type === 'JOB_COMPLETED_ADMIN' || notif.type === 'JOB_COMPLETED_CUSTOMER';

                        const iconBg = isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : isCustomerAccepted
                          ? 'bg-sky-100 text-sky-700'
                          : isCrewAssigned
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-700';

                        return (
                          <div
                            key={notif.id}
                            onClick={() => {
                              mockDb.markNotificationAsRead(notif.id);
                              if (profile?.role === 'OPERATIONS') router.push('/ops');
                              else if (profile?.role === 'CREW') router.push('/crew');
                              else if (profile?.role === 'CUSTOMER') router.push('/appointments');
                              setNotifOpen(false);
                            }}
                            className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                              !notif.read ? 'bg-sky-50/40' : 'bg-white'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}>
                              {isCompleted ? (
                                <CheckCircle2 size={16} />
                              ) : isCustomerAccepted ? (
                                <Sparkles size={16} />
                              ) : isCrewAssigned ? (
                                <UserCheck size={16} />
                              ) : (
                                <PlusCircle size={16} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-extrabold text-slate-900 truncate">
                                  {notif.title}
                                </span>
                                {!notif.read && (
                                  <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-3">
                                {notif.message}
                              </p>
                              <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Auth Area */}
        {loading ? (
          <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
        ) : user ? (
          /* Logged-in user dropdown */
          <div className="relative">
            <button
              type="button"
              id="user-menu-button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-80 transition-opacity"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <div className={`w-8 h-8 rounded-full ${roleColor} text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-200 shrink-0`}>
                {initials}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight max-w-[120px] truncate">
                  {profile?.name ?? user.email}
                </span>
                <span className="text-[11px] text-slate-500 font-medium leading-tight">{profile?.role ?? 'User'}</span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <>
                {/* Click-away overlay */}
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-52 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/80 py-2 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-extrabold text-slate-900 truncate">{profile?.name ?? 'User'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${roleColor}`}>
                      {profile?.role ?? 'USER'}
                    </span>
                  </div>
                  <div className="py-1">
                    {profile?.role === 'CUSTOMER' && (
                      <>
                        <Link href="/booking" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors">
                          Book a Service
                        </Link>
                        <Link href="/appointments" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors">
                          My Appointments
                        </Link>
                      </>
                    )}
                    {profile?.role === 'CREW' && (
                      <Link href="/crew" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                        My Jobs
                      </Link>
                    )}
                    {profile?.role === 'OPERATIONS' && (
                      <Link href="/ops" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                        Control Room
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Guest: Sign In / Sign Up */
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all"
            >
              <LogIn size={14} /> Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-all"
            >
              <UserPlus size={14} /> Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

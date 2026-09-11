'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';
import { ShieldAlert, RefreshCw, Lock } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowedRolesKey = allowedRoles.join(',');

  useEffect(() => {
    if (loading) return;

    // 1. Not logged in -> Send to login with redirect param
    if (!user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. Logged in but role not permitted -> Send to AUTH-03 Unauthorized page
    if (profile && !allowedRoles.includes(profile.role)) {
      router.replace(`/unauthorized?required=${allowedRoles.join(',')}&current=${profile.role}`);
    }
  }, [user, profile, loading, allowedRolesKey, allowedRoles, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-subtle flex flex-col items-center justify-center p-4">
        <div className="stitch-card p-8 text-center max-w-sm w-full space-y-4 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <RefreshCw size={24} className="animate-spin text-sky-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Verifying Clearance</h3>
            <p className="text-xs text-slate-500 mt-1">Authenticating role permissions and security certificates...</p>
          </div>
        </div>
      </div>
    );
  }

  // If unauthorized while redirecting, show access locked state
  if (!user || (profile && !allowedRoles.includes(profile.role))) {
    return (
      <div className="min-h-screen bg-slate-subtle flex flex-col items-center justify-center p-4">
        <div className="stitch-card p-8 text-center max-w-sm w-full space-y-4 shadow-md border-rose-200">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-rose-900">Access Restricted (AUTH-03)</h3>
            <p className="text-xs text-slate-500 mt-1">Redirecting to authorized dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

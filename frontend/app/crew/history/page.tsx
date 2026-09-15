'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Job } from '@/lib/types';
import { mockDb, NOTIFICATIONS_CHANGE_EVENT } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { RoleGuard } from '@/components/auth/RoleGuard';
import {
  Truck,
  MapPin,
  Clock,
  Car,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Star,
  User,
} from 'lucide-react';

export default function CrewJobHistoryPage() {
  const { user, profile } = useAuth();
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadHistory = useCallback(() => {
    if (!user?.id) {
      setCompletedJobs([]);
      return;
    }
    const history = mockDb.getCompletedJobsByCrewId(user.id, profile?.role, profile?.name, user?.email);
    setCompletedJobs(history);
  }, [user?.id, user?.email, profile?.role, profile?.name]);

  useEffect(() => {
    loadHistory();

    const handleUpdate = () => {
      loadHistory();
    };

    window.addEventListener(NOTIFICATIONS_CHANGE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadHistory]);

  const handleDeleteRecord = (jobId: string) => {
    if (window.confirm('Are you sure you want to remove this completed job record from your personal history view?')) {
      if (user?.id) {
        mockDb.deleteCrewHistoryJob(jobId, user.id);
        setToastMessage('Record removed from your personal history.');
        setTimeout(() => setToastMessage(null), 4000);
        loadHistory();
      }
    }
  };

  return (
    <RoleGuard allowedRoles={['CREW', 'OPERATIONS']}>
      <div className="min-h-screen bg-slate-subtle text-slate-900 flex flex-col font-sans">
        <Header />

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
            <div>
              <div className="flex items-center gap-2.5">
                <Link
                  href="/crew"
                  className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Terminal
                </Link>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-mono font-bold">CREW-HIST &bull; ARCHIVE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1.5 text-white flex items-center gap-2.5">
                <CheckCircle2 className="text-emerald-400" size={28} />
                Completed Job History
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium flex items-center gap-1.5">
                <User size={13} className="text-amber-400" />
                Crew Specialist: <span className="text-slate-200 font-bold">{profile?.name || user?.email || 'Field Specialist'}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadHistory}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div
              role="status"
              className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 shadow-md flex items-center justify-between gap-4 animate-fadeIn"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <p className="text-xs font-bold text-emerald-900">{toastMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-emerald-700 font-black text-sm p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Records List or Empty State */}
          {completedJobs.length === 0 ? (
            <div className="stitch-card p-12 text-center max-w-md mx-auto my-8 border-2 border-dashed border-slate-700 bg-slate-900/60 text-slate-300 rounded-3xl">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-4 border border-slate-700">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-black text-white">No Completed Records</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Services you finalize on-site that are approved by customers will appear here in your personal job history.
              </p>
              <div className="pt-4">
                <Link
                  href="/crew"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md"
                >
                  <Truck size={15} /> Return to Active Terminal
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                <span>Showing {completedJobs.length} completed job{completedJobs.length > 1 ? 's' : ''}</span>
                <span className="text-emerald-400 font-bold">100% Verified Customer Approvals</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="stitch-card p-5 sm:p-6 border-2 border-slate-700/80 bg-slate-900/90 text-white rounded-2xl space-y-4 hover:border-emerald-500/60 transition-all shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded border border-emerald-400/30">
                            #{job.id.substring(0, 8)}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            {job.booking?.service?.name}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-white mt-1.5">
                          {job.booking?.vehicle_make} {job.booking?.vehicle_model}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded">
                            PLATE: {job.booking?.vehicle_plate}
                          </span>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/30">
                            ₱{job.booking?.service?.price?.toLocaleString() || '1,899'} PHP
                          </span>
                        </div>
                      </div>

                      <StatusBadge status="COMPLETED" size="sm" />
                    </div>

                    {/* Location & Time */}
                    <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-rose-400 shrink-0 mt-0.5" />
                        <span className="text-slate-200 font-bold leading-snug">
                          {job.booking?.service_location}
                          {job.booking?.city && ` (${job.booking.city})`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 font-medium">
                        <Clock size={14} className="text-sky-400 shrink-0" />
                        <span>
                          {job.booking?.appointment_date} &bull; Window: <strong>{job.booking?.time_slot}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Customer Rating & Approval Verification */}
                    <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={13} /> Customer Sign-Off Verified
                        </span>
                        {job.rating && (
                          <div className="flex items-center gap-1 text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={13}
                                className={star <= job.rating! ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
                              />
                            ))}
                            <span className="text-xs font-extrabold text-amber-300 ml-1">
                              {job.rating}.0
                            </span>
                          </div>
                        )}
                      </div>
                      {job.review && (
                        <p className="text-xs text-slate-300 italic">
                          &ldquo;{job.review}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Footer with Delete Action */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Archived in Personal History
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(job.id)}
                        className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/80 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        title="Remove this completed job record from your personal history"
                      >
                        <Trash2 size={14} /> Delete from History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </RoleGuard>
  );
}

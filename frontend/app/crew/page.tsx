'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CrewActionBar } from './_components/CrewActionBar';
import { Job, JobStatus, AppNotification } from '@/lib/types';
import { mockDb, NOTIFICATIONS_CHANGE_EVENT } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { RoleGuard } from '@/components/auth/RoleGuard';
import {
  Truck,
  MapPin,
  Clock,
  Car,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  WifiOff,
  Wifi,
  Navigation,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  User,
  Bell,
  Hand,
  XCircle,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

const STATUS_PROGRESSION: JobStatus[] = [
  'SCHEDULED',
  'ON_THE_WAY',
  'ARRIVED',
  'IN_PROGRESS',
  'AWAITING_APPROVAL',
  'COMPLETED',
];

const NEXT_STATUS_MAP: Record<JobStatus, JobStatus | null> = {
  SCHEDULED: 'ON_THE_WAY',
  ON_THE_WAY: 'ARRIVED',
  ARRIVED: 'IN_PROGRESS',
  IN_PROGRESS: 'AWAITING_APPROVAL',
  AWAITING_APPROVAL: null,
  COMPLETED: null,
  NEEDS_REVISIT: null,
  CANCELLED: null,
  DELAYED: 'ON_THE_WAY',
};

const NEXT_ACTION_LABELS: Record<JobStatus, string> = {
  SCHEDULED: 'Start Route → ON THE WAY',
  ON_THE_WAY: 'Confirm Arrival → ARRIVED AT LOCATION',
  ARRIVED: 'Begin Wash → IN PROGRESS',
  IN_PROGRESS: 'Finish Detail → SUBMIT FOR CUSTOMER APPROVAL',
  AWAITING_APPROVAL: 'Waiting for Customer Inspection & Sign-off',
  COMPLETED: 'Service Completed & Approved by Customer',
  NEEDS_REVISIT: 'Customer Requested Touch-up Visit',
  CANCELLED: 'Job Cancelled',
  DELAYED: 'Resume Route → ON THE WAY',
};

import dynamic from 'next/dynamic';

const FleetMap = dynamic(() => import('@/components/map/FleetMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-2 border border-slate-200">
      <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold">Loading Live Navigation Map...</span>
    </div>
  ),
});

export default function CrewTerminalPage() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showLiveMap, setShowLiveMap] = useState(true);

  // FTC-03 State Machine & Network Failure Simulation
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [syncError, setSyncError] = useState<{
    jobId: string;
    intendedStatus: JobStatus;
    message: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [completionNotice, setCompletionNotice] = useState<string | null>(null);
  const [activeTaskNotice, setActiveTaskNotice] = useState<AppNotification | null>(null);
  const [activeTab, setActiveTab] = useState<'ASSIGNED' | 'AVAILABLE'>('ASSIGNED');
  const [unassignedJobs, setUnassignedJobs] = useState<Job[]>([]);
  const [claimToast, setClaimToast] = useState<string | null>(null);
  const [claimAcceptedNotice, setClaimAcceptedNotice] = useState<AppNotification | null>(null);
  const [claimDeniedNotice, setClaimDeniedNotice] = useState<AppNotification | null>(null);

  const loadJobs = useCallback(() => {
    // FR-03 / AC-02.1: Crew members see their assigned jobs (or admin oversees all jobs)
    const activeJobs = user?.id
      ? mockDb.getJobsByCrewId(user.id, profile?.role, profile?.name)
      : mockDb.getJobs();
    setJobs(activeJobs);
    if (activeJobs.length > 0) {
      setSelectedJobId((prev) => {
        return prev && activeJobs.some((j) => j.id === prev) ? prev : activeJobs[0].id;
      });
    }

    // Load available unassigned appointments that crew can request to claim
    const unassigned = mockDb.getUnassignedJobs();
    setUnassignedJobs(unassigned);

    // Check for unread task assignment & claim notifications for this crew member
    if (user) {
      const notifs = mockDb.getNotifications(user.id, profile?.role, user.email);
      const latestAssignment = notifs.find((n) => n.type === 'CREW_ASSIGNED' && !n.read);
      if (latestAssignment) {
        setActiveTaskNotice(latestAssignment);
      }
      const latestAccepted = notifs.find((n) => n.type === 'CREW_CLAIM_ACCEPTED' && !n.read);
      if (latestAccepted) {
        setClaimAcceptedNotice(latestAccepted);
      }
      const latestDenied = notifs.find((n) => n.type === 'CREW_CLAIM_DENIED' && !n.read);
      if (latestDenied) {
        setClaimDeniedNotice(latestDenied);
      }
    }
  }, [user, profile?.role, profile?.name]);

  useEffect(() => {
    loadJobs();
    const handleUpdate = () => {
      loadJobs();
    };
    window.addEventListener(NOTIFICATIONS_CHANGE_EVENT, handleUpdate);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGE_EVENT, handleUpdate);
  }, [loadJobs]);

  const handleRequestClaim = (jobId: string) => {
    if (!user) return;
    const res = mockDb.requestJobClaim(jobId, user.id);
    if (res.success) {
      setClaimToast('Claim request submitted to Operations Dispatcher! Waiting for approval.');
      setTimeout(() => setClaimToast(null), 5000);
      loadJobs();
    } else {
      alert(res.error || 'Failed to submit claim request');
    }
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  const handleAdvanceStatus = async (jobId: string, nextStatus: JobStatus) => {
    setIsUpdating(true);
    setSyncError(null);
    setCompletionNotice(null);

    const targetJob = jobs.find((j) => j.id === jobId) || selectedJob;

    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(simulateFailure ? { 'x-simulate-failure': 'true' } : {}),
        },
        body: JSON.stringify({
          next_status: nextStatus,
          current_status: targetJob?.status,
          job_data: targetJob,
          simulate_failure: simulateFailure,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setSyncError({
          jobId,
          intendedStatus: nextStatus,
          message:
            data.error ||
            'FTC-03 Network Timeout: Failed to reach detail server. Retry connection.',
        });
      } else {
        mockDb.updateJobStatus(jobId, nextStatus, targetJob);
        loadJobs();
        setSelectedJobId(jobId);
        setSyncError(null);

        // Trigger positive completion or inspection feedback banner
        if (nextStatus === 'AWAITING_APPROVAL') {
          setCompletionNotice(
            `Detailing finished on-site! Submitted to customer for vehicle inspection and approval.`
          );
        } else if (nextStatus === 'COMPLETED') {
          setCompletionNotice(
            `Service Completed! Operations Admin and Customer have been automatically notified that vehicle detailing is finished.`
          );
        }
      }
    } catch (err) {
      setSyncError({
        jobId,
        intendedStatus: nextStatus,
        message: 'FTC-03 Network Failure: Server disconnected or offline.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['CREW', 'OPERATIONS']}>
      <div className="min-h-screen bg-slate-subtle text-slate-900 flex flex-col font-sans">
        <Header />

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Crew Terminal Banner & Failure Simulator */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] uppercase font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-sm">
                Crew Outdoor Field Terminal
              </span>
              <span className="text-xs text-slate-400 font-mono font-bold">CREW-01 &bull; AUTH-03</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1.5 text-white">
              Dispatch Execution Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium flex items-center gap-1.5">
              <User size={13} className="text-amber-400" />
              Active Operator: <span className="text-slate-200 font-bold">{profile?.name || user?.email || 'Crew Field Specialist'}</span>
            </p>
          </div>

          {/* FTC-03 Network Failure Simulation Switcher */}
          <div className="flex items-center gap-3 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              {simulateFailure ? (
                <WifiOff className="text-rose-400 animate-pulse" size={18} />
              ) : (
                <Wifi className="text-emerald-400" size={18} />
              )}
              <span className="text-xs font-bold text-slate-200">
                Network Failure:
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSimulateFailure(!simulateFailure);
                setSyncError(null);
              }}
              className={`min-h-[48px] px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all border ${
                simulateFailure
                  ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/50'
                  : 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600'
              }`}
            >
              {simulateFailure ? 'Enabled (500 Error)' : 'Normal (200 OK)'}
            </button>
          </div>
        </div>

        {/* Detail Service Completed Banner */}
        {completionNotice && (
          <div
            role="status"
            className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 shadow-md flex items-center justify-between gap-4 animate-fadeIn"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wide">
                  Service Completed Successfully
                </h3>
                <p className="text-xs font-bold text-emerald-800 mt-0.5">
                  {completionNotice}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCompletionNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 font-black text-sm p-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* New Task Dispatched Alert Banner */}
        {activeTaskNotice && (
          <div
            role="status"
            className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                <Bell size={22} className="animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                    New Dispatch Task
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    #{activeTaskNotice.job_id?.substring(0, 8)}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {activeTaskNotice.message}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (activeTaskNotice.job_id) {
                    setSelectedJobId(activeTaskNotice.job_id);
                  }
                  mockDb.markNotificationAsRead(activeTaskNotice.id);
                  setActiveTaskNotice(null);
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-amber-300 font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all"
              >
                View &amp; Start Task
              </button>
              <button
                type="button"
                onClick={() => {
                  mockDb.markNotificationAsRead(activeTaskNotice.id);
                  setActiveTaskNotice(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Claim Submitted Confirmation Toast */}
        {claimToast && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-sky-50 border-2 border-sky-400 text-sky-950 shadow-md flex items-center justify-between gap-4 animate-fadeIn"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                <Hand size={20} />
              </div>
              <p className="text-xs font-bold text-sky-900">{claimToast}</p>
            </div>
            <button
              type="button"
              onClick={() => setClaimToast(null)}
              className="text-sky-700 hover:text-sky-950 font-black text-sm p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Claim Request Accepted Banner (Admin Approved) */}
        {claimAcceptedNotice && (
          <div
            role="status"
            className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                    Claim Approved by Admin!
                  </span>
                  {claimAcceptedNotice.job_id && (
                    <span className="text-xs font-mono font-bold text-slate-500">
                      #{claimAcceptedNotice.job_id.substring(0, 8)}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {claimAcceptedNotice.message}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ASSIGNED');
                  if (claimAcceptedNotice.job_id) {
                    setSelectedJobId(claimAcceptedNotice.job_id);
                  }
                  mockDb.markNotificationAsRead(claimAcceptedNotice.id);
                  setClaimAcceptedNotice(null);
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all"
              >
                Start Detail Job Now
              </button>
              <button
                type="button"
                onClick={() => {
                  mockDb.markNotificationAsRead(claimAcceptedNotice.id);
                  setClaimAcceptedNotice(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Claim Request Denied Banner (Admin Declined) */}
        {claimDeniedNotice && (
          <div
            role="status"
            className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                <XCircle size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                    Claim Request Declined
                  </span>
                  {claimDeniedNotice.job_id && (
                    <span className="text-xs font-mono font-bold text-slate-500">
                      #{claimDeniedNotice.job_id.substring(0, 8)}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {claimDeniedNotice.message}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Please wait for Operations to manually assign an appointment, or request another available job.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                mockDb.markNotificationAsRead(claimDeniedNotice.id);
                setClaimDeniedNotice(null);
              }}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top-Level Terminal Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('ASSIGNED')}
            className={`flex-1 sm:flex-none min-h-[46px] px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              activeTab === 'ASSIGNED'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Truck size={16} />
            <span>My Assigned Tasks</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                activeTab === 'ASSIGNED' ? 'bg-slate-950 text-amber-300' : 'bg-slate-700 text-slate-200'
              }`}
            >
              {jobs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AVAILABLE')}
            className={`flex-1 sm:flex-none min-h-[46px] px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              activeTab === 'AVAILABLE'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Hand size={16} />
            <span>Claim Available Jobs</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                activeTab === 'AVAILABLE' ? 'bg-slate-950 text-amber-300' : 'bg-slate-700 text-slate-200'
              }`}
            >
              {unassignedJobs.length}
            </span>
            {unassignedJobs.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
            )}
          </button>
        </div>

        {/* FTC-03 Prominent Red Error Banner with Retry Button */}
        {syncError && (
          <div
            role="alert"
            className="p-5 rounded-2xl bg-rose-900 border-4 border-rose-500 text-white shadow-xl space-y-4 animate-bounce"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-rose-300 flex-shrink-0 mt-1" size={28} />
              <div>
                <h3 className="text-lg font-black text-rose-100 uppercase tracking-wide">
                  FTC-03 Network Sync Failure Detected
                </h3>
                <p className="text-sm font-bold text-white mt-1">{syncError.message}</p>
                <p className="text-xs text-rose-200 mt-1">
                  Target state change &quot;{syncError.intendedStatus}&quot; could not sync.
                </p>
              </div>
            </div>

            {/* WCAG 48px Min Target Retry Button */}
            <div>
              <button
                type="button"
                onClick={() => handleAdvanceStatus(syncError.jobId, syncError.intendedStatus)}
                disabled={isUpdating}
                className="w-full min-h-[52px] py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-base uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={isUpdating ? 'animate-spin' : ''} size={20} />
                <span>Retry Status Sync Now</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT: AVAILABLE JOBS TO CLAIM ────────────────────────── */}
        {activeTab === 'AVAILABLE' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Hand className="text-amber-400" size={20} />
                  Available Detailing Appointments ({unassignedJobs.length})
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Appointments booked by customers waiting for specialist assignment. Submit a claim to request this job from Operations.
                </p>
              </div>
              <button
                type="button"
                onClick={loadJobs}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw size={13} /> Refresh List
              </button>
            </div>

            {unassignedJobs.length === 0 ? (
              <div className="stitch-card p-10 text-center max-w-lg mx-auto my-6 border-2 border-dashed border-slate-700 bg-slate-900/60 text-slate-300">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-700">
                  <CheckCircle2 size={28} className="text-emerald-400" />
                </div>
                <h3 className="text-base font-extrabold text-white">No Unassigned Jobs Available</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  All customer appointments are currently assigned to specialists or undergoing service. Check back shortly for new bookings!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unassignedJobs.map((job) => {
                  const isClaimedByMe = job.claim_status === 'PENDING' && job.claim_requested_by === user?.id;
                  const isClaimedByOther = job.claim_status === 'PENDING' && job.claim_requested_by !== user?.id;

                  return (
                    <div
                      key={job.id}
                      className="stitch-card p-5 sm:p-6 border-2 border-slate-700/80 bg-slate-900/90 text-white rounded-2xl space-y-4 hover:border-amber-400/60 transition-all shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/30">
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

                        <StatusBadge status={job.status} size="sm" />
                      </div>

                      {/* Location & Time Window */}
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

                      {/* Claim Action Area */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
                        {isClaimedByMe ? (
                          <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-400/15 border border-amber-400/50 text-amber-300 rounded-xl text-xs font-black">
                            <Clock size={16} className="animate-spin text-amber-400" />
                            <span>Claim Sent • Awaiting Admin Review</span>
                          </div>
                        ) : isClaimedByOther ? (
                          <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 border border-slate-700 text-slate-400 rounded-xl text-xs font-bold">
                            <Hand size={15} className="text-slate-500" />
                            <span>Claim Requested by Another Specialist</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRequestClaim(job.id)}
                            className="w-full min-h-[48px] py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ring-2 ring-amber-400/30"
                          >
                            <Hand size={16} />
                            <span>Request to Claim Appointment</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB CONTENT: ASSIGNED TASKS (ACTIVE DISPATCH) ────────────────── */}
        {activeTab === 'ASSIGNED' && (
          <>
            {/* Outdoor Job Tabs */}
            {jobs.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {jobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => {
                        setSelectedJobId(job.id);
                        setSyncError(null);
                      }}
                      className={`min-h-[52px] px-4 py-3 rounded-xl border-2 font-bold text-xs flex items-center gap-2 flex-shrink-0 transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border-amber-500 font-extrabold shadow-md'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Car size={16} />
                      <span>
                        {job.booking?.vehicle_make} {job.booking?.vehicle_model}
                      </span>
                      <StatusBadge status={job.status} size="sm" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected Job High-Contrast Active Card */}
            {selectedJob && (
              <div className="stitch-card p-6 sm:p-8 border-2 border-slate-300 shadow-lg space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
                  <div>
                    <span className="text-xs font-bold uppercase text-sky-700 tracking-wider">
                      Active Dispatch #{selectedJob.id.substring(0, 8)}
                    </span>
                    <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
                      {selectedJob.booking?.vehicle_make} {selectedJob.booking?.vehicle_model}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 bg-slate-900 text-white font-extrabold text-xs rounded uppercase tracking-wider font-mono">
                        PLATE: {selectedJob.booking?.vehicle_plate}
                      </span>
                      <span className="text-slate-600 text-xs font-bold">
                        {selectedJob.booking?.service?.name}
                      </span>
                    </div>
                  </div>

                  <StatusBadge status={selectedJob.status} size="lg" />
                </div>

                {/* Customer Dissatisfaction Alert in Crew Terminal */}
                {selectedJob.status === 'NEEDS_REVISIT' && selectedJob.customer_feedback && (
                  <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 space-y-1 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                      <span className="text-xs font-black uppercase text-rose-900">
                        Customer Feedback &bull; Follow-up Touch-up Needed
                      </span>
                    </div>
                    <p className="text-xs font-bold text-rose-900 pl-6">
                      &quot;{selectedJob.customer_feedback}&quot;
                    </p>
                    <p className="text-[11px] text-rose-700 pl-6">
                      Operations dispatch is scheduling another day for your van to return and finish this detail.
                    </p>
                  </div>
                )}

                {/* Awaiting Customer Inspection Banner in Crew Terminal */}
                {selectedJob.status === 'AWAITING_APPROVAL' && (
                  <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-300 text-purple-950 flex items-center gap-3 animate-fadeIn">
                    <Clock size={22} className="text-purple-600 shrink-0 animate-spin" />
                    <div>
                      <span className="text-xs font-black uppercase text-purple-900 block">
                        Awaiting Customer Inspection &amp; Sign-off
                      </span>
                      <p className="text-xs text-purple-800 mt-0.5">
                        Detailing work has been completed on-site. The customer has been prompted to inspect their vehicle and submit their rating and approval.
                      </p>
                    </div>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                        <MapPin size={14} className="text-sky-600" /> Location
                      </span>
                      <p className="text-base font-extrabold text-slate-900">
                        {selectedJob.booking?.service_location}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                        <Clock size={14} className="text-sky-600" /> Scheduled Window
                      </span>
                      <p className="text-xs font-bold text-slate-700">
                        {selectedJob.booking?.appointment_date} ({selectedJob.booking?.time_slot})
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                        <Truck size={14} className="text-sky-600" /> Assigned Field Crew
                      </span>
                      <p className="text-xs font-bold text-slate-800">
                        {selectedJob.assignee?.name || 'Crew 01 (Field Unit)'}
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => alert('Dispatch helpline connected: (02) 8888-FOAM')}
                        className="min-h-[48px] px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1.5"
                      >
                        <PhoneCall size={14} className="text-amber-600" /> Call Dispatch
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLiveMap((v) => !v)}
                        className={`min-h-[48px] px-3 py-2 border rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          showLiveMap
                            ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                            : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                        }`}
                      >
                        <Navigation size={14} className={showLiveMap ? 'text-white' : 'text-sky-600'} />
                        {showLiveMap ? 'Hide Live GPS' : '🗺️ Open Live GPS Map'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Field Route Map (Leaflet OpenStreetMap) */}
                {showLiveMap && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Navigation size={14} className="text-sky-600" />
                        Live Route &amp; Customer Location Guidance
                      </span>
                      <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                        Destination: {selectedJob.booking?.service_location || 'Customer Site'}
                      </span>
                    </div>
                    <FleetMap
                      jobs={[selectedJob]}
                      selectedJobId={selectedJob.id}
                      height="260px"
                      showRoute={true}
                    />
                  </div>
                )}

                {/* FTC-03 Pipeline Steps */}
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                    FTC-03 Sequential Pipeline
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {STATUS_PROGRESSION.map((st, idx) => {
                      const currentIdx = STATUS_PROGRESSION.indexOf(selectedJob.status);
                      const isPast = idx <= currentIdx;
                      const isCurrent = st === selectedJob.status;

                      return (
                        <div
                          key={st}
                          className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                            isCurrent
                              ? 'bg-amber-400 text-slate-950 border-amber-500 font-extrabold shadow-sm'
                              : isPast
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold">Step {idx + 1}</span>
                          <span className="text-xs font-extrabold truncate mt-1">
                            {st.replace(/_/g, ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Colocated Outdoor Touch Target Action Bar (min-h-[60px]) */}
                <div className="pt-4 border-t border-slate-200">
                  <CrewActionBar
                    status={selectedJob.status}
                    isUpdating={isUpdating}
                    actionLabel={NEXT_ACTION_LABELS[selectedJob.status]}
                    rating={selectedJob.rating}
                    review={selectedJob.review}
                    onAdvance={() => {
                      const next = NEXT_STATUS_MAP[selectedJob.status];
                      if (next) {
                        handleAdvanceStatus(selectedJob.id, next);
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Empty State when no jobs assigned */}
            {jobs.length === 0 && (
              <div className="stitch-card p-10 text-center max-w-lg mx-auto my-8 border-2 border-dashed border-slate-300">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
                  <Truck size={32} />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                  No Assigned Field Dispatches
                </h3>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  You currently have no tasks assigned directly by Operations. You can browse available customer appointments and request to claim one!
                </p>
                {unassignedJobs.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('AVAILABLE')}
                    className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer ring-2 ring-amber-400/40"
                  >
                    <Hand size={16} /> Browse &amp; Claim {unassignedJobs.length} Available Appointment{unassignedJobs.length > 1 ? 's' : ''}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={loadJobs}
                    className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <RefreshCw size={16} /> Check for Available Dispatches
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
      </div>
    </RoleGuard>
  );
}

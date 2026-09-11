'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Job, JobStatus, Profile } from '@/lib/types';
import { mockDb, NOTIFICATIONS_CHANGE_EVENT } from '@/lib/supabase';
import { Sidebar } from '@/components/ui/Sidebar';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { PhilippinesDispatchMap } from '@/components/map/PhilippinesDispatchMap';
import { UserManagementModal } from '@/components/admin/UserManagementModal';
import {
  Activity,
  Calendar,
  UserCheck,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  Truck,
  Car,
  MapPin,
  Clock,
  CheckCircle2,
  Zap,
  ShieldAlert,
  Layers,
  PhoneCall,
  SlidersHorizontal,
  Users,
  Navigation,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Bell,
  Hand,
  XCircle,
  Star,
  X,
  CalendarDays,
} from 'lucide-react';

export default function OperationsDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserModal, setShowUserModal] = useState(false);
  const [viewMode, setViewMode] = useState<'SPLIT' | 'MAP' | 'MATRIX'>('SPLIT');
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [assignmentToast, setAssignmentToast] = useState<string | null>(null);

  // Revisit & Reschedule State
  const [rescheduleJob, setRescheduleJob] = useState<Job | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState<string>('09:00 AM - 11:00 AM');
  const [rescheduleCrewId, setRescheduleCrewId] = useState<string>('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener(NOTIFICATIONS_CHANGE_EVENT, handleUpdate);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGE_EVENT, handleUpdate);
  }, []);

  // Listen to tab changes from Sidebar
  useEffect(() => {
    if (activeTab === 'roster') {
      setShowUserModal(true);
    } else if (activeTab === 'map') {
      setViewMode('MAP');
    } else if (activeTab === 'dashboard') {
      setViewMode('SPLIT');
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      await mockDb.syncFromSupabase();
    } catch {
      // Fallback to local store
    }
    setJobs(mockDb.getJobs());
    setProfiles(mockDb.getProfiles());
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleCrewAssign = (jobId: string, crewId: string) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (targetJob?.status === 'COMPLETED') return;
    const updated = mockDb.assignCrew(jobId, crewId);
    loadData();
    if (crewId && updated?.assignee) {
      setAssignmentToast(
        `Dispatched order #${jobId.substring(0, 8)} to ${updated.assignee.name}! Crew notified of new task, and customer notified of appointment acceptance.`
      );
      setTimeout(() => setAssignmentToast(null), 6000);
    }
  };

  const handleAcceptClaim = (jobId: string) => {
    const res = mockDb.acceptJobClaim(jobId);
    loadData();
    if (res.success && res.job?.assignee) {
      setAssignmentToast(
        `Claim Approved! Assigned order #${jobId.substring(0, 8)} to ${res.job.assignee.name}. Crew and customer notified.`
      );
      setTimeout(() => setAssignmentToast(null), 6000);
    } else {
      alert(res.error || 'Failed to accept claim request');
    }
  };

  const handleDenyClaim = (jobId: string) => {
    const res = mockDb.denyJobClaim(jobId);
    loadData();
    if (res.success) {
      setAssignmentToast(
        `Claim Declined for order #${jobId.substring(0, 8)}. Crew member notified to wait for manual dispatch. Appointment remains open.`
      );
      setTimeout(() => setAssignmentToast(null), 6000);
    } else {
      alert(res.error || 'Failed to deny claim request');
    }
  };

  const handleStatusOverride = (jobId: string, status: JobStatus) => {
    mockDb.updateJobStatus(jobId, status);
    loadData();
  };

  const handleDeleteJob = (jobId: string) => {
    if (window.confirm('Are you sure you want to cancel and delete this dispatch order?')) {
      mockDb.deleteJob(jobId);
      loadData();
    }
  };

  const handleOpenReschedule = (job: Job) => {
    setRescheduleJob(job);
    setRescheduleCrewId(job.assigned_to || '');
    // Default reschedule date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setRescheduleDate(dateStr);
    setRescheduleTimeSlot(job.booking?.time_slot || '09:00 AM - 11:00 AM');
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleJob || !rescheduleDate || !rescheduleTimeSlot) return;
    setRescheduleSubmitting(true);
    try {
      const res = mockDb.rescheduleFollowup(
        rescheduleJob.id,
        rescheduleDate,
        rescheduleTimeSlot,
        rescheduleCrewId || undefined
      );
      if (res.success) {
        const assignedCrew = profiles.find(
          (p) => p.id === (rescheduleCrewId || rescheduleJob.assigned_to)
        );
        setAssignmentToast(
          `📅 Follow-up visit scheduled for #${rescheduleJob.id.substring(0, 8)} on ${rescheduleDate} (${rescheduleTimeSlot}) with ${assignedCrew?.name || 'Assigned Crew Specialist'}. Customer & Crew notified!`
        );
        setTimeout(() => setAssignmentToast(null), 7000);
        setRescheduleJob(null);
        await loadData();
      } else {
        alert(res.error || 'Failed to reschedule follow-up visit');
      }
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  // Metrics Calculations
  const totalBookings = jobs.length;
  const inProgressJobs = jobs.filter(
    (j) => j.status === 'IN_PROGRESS' || j.status === 'ON_THE_WAY' || j.status === 'ARRIVED'
  ).length;
  const completedJobs = jobs.filter((j) => j.status === 'COMPLETED').length;

  // Conflict Detection calculation (FTC-01)
  const timeSlotCounts: Record<string, number> = {};
  jobs.forEach((j) => {
    if (j.booking && j.status !== 'CANCELLED') {
      const key = `${j.booking.appointment_date}_${j.booking.time_slot}`;
      timeSlotCounts[key] = (timeSlotCounts[key] || 0) + 1;
    }
  });

  const conflictsDetected = Object.values(timeSlotCounts).filter((count) => count > 1).length;
  const delayedJobs = jobs.filter((j) => j.status === 'DELAYED').length;
  const cancelledJobs = jobs.filter((j) => j.status === 'CANCELLED').length;
  const totalExceptions = conflictsDetected + delayedJobs + cancelledJobs;

  // Filtered Jobs List
  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = filterStatus === 'ALL' || job.status === filterStatus;
    const matchesZone =
      selectedZone === 'ALL' ||
      job.booking?.zone_ph === selectedZone ||
      (selectedZone === 'BGC_TAGUIG' && job.booking?.city?.includes('Taguig')) ||
      (selectedZone === 'MAKATI_CBD' && job.booking?.city?.includes('Makati')) ||
      (selectedZone === 'ORTIGAS_PASIG' && job.booking?.city?.includes('Pasig')) ||
      (selectedZone === 'QC_NORTH' && job.booking?.city?.includes('Quezon')) ||
      (selectedZone === 'ALABANG_SOUTH' && job.booking?.city?.includes('Muntinlupa'));

    const query = searchQuery.toLowerCase();
    const matchesQuery =
      !query ||
      job.booking?.vehicle_make.toLowerCase().includes(query) ||
      job.booking?.vehicle_model.toLowerCase().includes(query) ||
      job.booking?.vehicle_plate.toLowerCase().includes(query) ||
      job.booking?.service_location.toLowerCase().includes(query) ||
      job.assignee?.name.toLowerCase().includes(query);

    return matchesStatus && matchesZone && matchesQuery;
  });

  const crewMembers = profiles.filter((p) => p.role === 'CREW' && p.status !== 'INACTIVE');

  return (
    <RoleGuard allowedRoles={['OPERATIONS']}>
      <div className="min-h-screen bg-slate-subtle text-slate-800 flex flex-col font-sans">
        <Header />
        <Sidebar currentTab={activeTab} onSelectTab={setActiveTab} />

        <div className="lg:pl-64 flex-1">
          <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
            {/* Top Title & Controls Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                    OPS-01 Live Monitor
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-xs text-slate-500 font-bold">Philippines Metro Manila Region (NCR)</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Operations Command &amp; Live Dispatch
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Bar */}
                <div className="relative w-full sm:w-56">
                  <input
                    type="text"
                    placeholder="Search plate, location, crew..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-white text-slate-800 rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent placeholder:text-slate-400"
                  />
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                </div>

                {/* Team Roster & Deletion Modal Trigger */}
                <button
                  type="button"
                  onClick={() => setShowUserModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  title="Manage users, crews, and account deletion"
                >
                  <Users size={15} />
                  <span>Team &amp; Roster (AUTH-04)</span>
                </button>

                {/* View Mode Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('SPLIT')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      viewMode === 'SPLIT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Combined
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('MAP')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      viewMode === 'MAP' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Map Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('MATRIX')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      viewMode === 'MATRIX' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Matrix Only
                  </button>
                </div>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
                  title="Refresh telemetry"
                >
                  <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-sky-600' : ''} />
                </button>
              </div>
            </div>

            {/* Executive KPIs Bar */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1 */}
              <div className="stitch-card p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Today&apos;s Appointments
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-slate-900">
                    {totalBookings}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Units in NCR</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-2 border-t border-slate-100">
                  <span className="text-emerald-600 font-bold">{completedJobs} Done</span>
                  <span className="text-sky-600 font-bold">{inProgressJobs} Active</span>
                  <span className="text-slate-400 font-bold">
                    {totalBookings - completedJobs - inProgressJobs} Plan
                  </span>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="stitch-card p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Active Field Crews
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Truck size={16} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-slate-900">
                    {crewMembers.length}
                  </span>
                  <span className="text-xs font-bold text-amber-700">100% Deployed</span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-600 pt-2 border-t border-slate-100 overflow-hidden">
                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Van Alpha (BGC)
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                    Van Bravo (Makati)
                  </span>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="stitch-card p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Operational Exceptions
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      totalExceptions > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <AlertTriangle size={16} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-slate-900">
                    {totalExceptions}
                  </span>
                  <span className={`text-xs font-bold ${totalExceptions > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {totalExceptions > 0 ? 'Requires Dispatch Attention' : 'All Clear'}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-slate-600 pt-2 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1 text-rose-600">
                    {delayedJobs} Delayed
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    {cancelledJobs} Cancelled
                  </span>
                  <span className={`inline-flex items-center gap-1 ${conflictsDetected > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                    {conflictsDetected} Slot Conflict
                  </span>
                </div>
              </div>

              {/* KPI 4 */}
              <div className="stitch-card p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Fleet Completion Rate
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-slate-900">
                    {totalBookings > 0 ? Math.round((completedJobs / totalBookings) * 100) : 100}%
                  </span>
                  <span className="text-xs font-bold text-emerald-600">On Target</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-2 border-t border-slate-100">
                  <span>Avg SLA: <strong>99.2%</strong></span>
                  <span>Currency: <strong>₱ PHP</strong></span>
                  <span className="text-sky-700 font-bold">AUTH-04 Active</span>
                </div>
              </div>
            </section>

            {/* LIVE PHILIPPINES DISPATCH MAP (Shown in SPLIT or MAP mode) */}
            {(viewMode === 'SPLIT' || viewMode === 'MAP') && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Navigation className="text-emerald-600" size={18} />
                    Live Philippines Fleet Map (Metro Manila)
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    Tracking {filteredJobs.length} active vehicle detail locations
                  </span>
                </div>

                <PhilippinesDispatchMap
                  jobs={jobs}
                  selectedZone={selectedZone}
                  onSelectZone={(zone) => setSelectedZone(zone)}
                  onJobSelect={(id) => {
                    const el = document.getElementById(`job-card-${id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                />
              </section>
            )}

            {/* DISPATCH MATRIX (Shown in SPLIT or MATRIX mode) */}
            {(viewMode === 'SPLIT' || viewMode === 'MATRIX') && (
              <section className="space-y-4">
                {/* Filter Bar with Status Tabs */}
                <div className="stitch-card p-4 border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm bg-white">
                  <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 sm:pb-0">
                    <Filter size={15} className="text-slate-400 flex-shrink-0" />
                    {[
                      'ALL',
                      'SCHEDULED',
                      'ON_THE_WAY',
                      'ARRIVED',
                      'IN_PROGRESS',
                      'AWAITING_APPROVAL',
                      'NEEDS_REVISIT',
                      'COMPLETED',
                      'DELAYED',
                    ].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFilterStatus(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                          filterStatus === st
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
                        }`}
                      >
                        {st.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Assignment Toast Notification */}
                {assignmentToast && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 shadow-sm flex items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                      <p className="text-xs font-bold">{assignmentToast}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAssignmentToast(null)}
                      className="text-emerald-700 hover:text-emerald-900 text-xs font-black p-1"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Customer Dissatisfaction / Needs Revisit Alert Banner */}
                {(() => {
                  const revisitJobs = jobs.filter((j) => j.status === 'NEEDS_REVISIT');
                  if (revisitJobs.length === 0) return null;
                  return (
                    <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-200 text-rose-900 flex items-center justify-center font-bold shrink-0">
                          <AlertTriangle className="animate-pulse text-rose-700" size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-rose-950">
                            ⚠️ {revisitJobs.length} Customer Dissatisfaction - Follow-up Revisit Required
                          </h4>
                          <p className="text-xs text-rose-800 mt-0.5 font-medium">
                            Customer inspected the detail and reported issues. Admin action needed: Re-schedule another day for the crew specialist to return and finish the job.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-rose-200 text-rose-900 px-3 py-1 rounded-xl border border-rose-300">
                        Action Required
                      </span>
                    </div>
                  );
                })()}

                {/* Pending Crew Claim Requests Alert Banner */}
                {(() => {
                  const pendingClaims = jobs.filter(
                    (j) => j.claim_status === 'PENDING' && !j.assigned_to && j.status !== 'CANCELLED'
                  );
                  if (pendingClaims.length === 0) return null;
                  return (
                    <div className="p-4 rounded-2xl bg-amber-500 text-slate-950 border-2 border-amber-600 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-300 flex items-center justify-center font-bold shrink-0">
                          <Hand size={20} className="animate-bounce" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-950">
                            ✋ {pendingClaims.length} Crew Claim Request{pendingClaims.length > 1 ? 's' : ''} Pending Review
                          </h4>
                          <p className="text-xs font-bold text-slate-900 mt-0.5">
                            Specialist(s) sent request to claim unassigned appointment(s). Review each request card below to Accept or Deny.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-slate-950 text-amber-300 px-3 py-1 rounded-xl shadow-xs">
                        Action Required
                      </span>
                    </div>
                  );
                })()}

                {/* Unassigned Bookings Notification Alert Banner (Event 1) */}
                {(() => {
                  const unassignedJobs = jobs.filter((j) => !j.assigned_to && j.status !== 'CANCELLED');
                  if (unassignedJobs.length === 0) return null;
                  return (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0">
                          <Bell className="animate-bounce" size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                            {unassignedJobs.length} New Booking{unassignedJobs.length > 1 ? 's' : ''} Awaiting Crew Assignment
                          </h4>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Customer scheduled a detailing service. Select a crew specialist in the queue below to assign the job and notify the customer.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-amber-200/80 text-amber-900 px-3 py-1 rounded-xl border border-amber-300">
                        Assignment Required
                      </span>
                    </div>
                  );
                })()}

                {/* Dispatch Queue Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="text-sky-600" /> Active Dispatch Queue ({filteredJobs.length})
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">
                    Manage assignments, status progression, and cancellation
                  </span>
                </div>

                {jobs.length === 0 ? (
                  <div className="stitch-card p-12 text-center border-2 border-dashed border-slate-200 bg-white shadow-xs rounded-2xl">
                    <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3 border border-sky-100 shadow-xs">
                      <Car size={30} />
                    </div>
                    <h3 className="text-base font-black text-slate-900">Active Dispatch Queue Is Clean &amp; Ready</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                      All previous mock data has been cleared. When new customer accounts book detailing services, their dispatch orders will appear here in real-time ready for crew assignment.
                    </p>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="stitch-card p-12 text-center border border-slate-200">
                    <Car className="mx-auto text-slate-400 mb-3" size={36} />
                    <h3 className="text-base font-bold text-slate-700">No matching dispatch orders</h3>
                    <p className="text-xs text-slate-500 mt-1">Adjust search terms, zone, or status filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {filteredJobs.map((job) => {
                      return (
                        <div
                          key={job.id}
                          id={`job-card-${job.id}`}
                          className={`stitch-card p-6 border transition-all shadow-sm space-y-4 ${
                            !job.assigned_to && job.status !== 'CANCELLED'
                              ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-200'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          {/* Card Top: Service & Vehicle */}
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                  #{job.id.substring(0, 8)}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">
                                  {job.booking?.service?.name}
                                </span>
                                {!job.assigned_to && job.status !== 'CANCELLED' && (
                                  <span className="text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                    {job.claim_status === 'PENDING' ? '✋ Claim Requested' : '⚠️ Needs Crew Assignment'}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                                {job.booking?.vehicle_make} {job.booking?.vehicle_model}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-900 text-white rounded inline-block">
                                  PLATE: {job.booking?.vehicle_plate}
                                </span>
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  ₱{job.booking?.service?.price?.toLocaleString() || '1,899'} PHP
                                </span>
                              </div>
                            </div>
                            <StatusBadge status={job.status} size="md" />
                          </div>

                          {/* Philippine Location & Schedule */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                            <div>
                              <span className="text-slate-400 font-bold flex items-center gap-1">
                                <MapPin size={12} className="text-rose-500" /> Service Location (PH)
                              </span>
                              <span className="font-bold text-slate-900 truncate block mt-0.5">
                                {job.booking?.service_location}
                              </span>
                              {job.booking?.city && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {job.booking.city}
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold flex items-center gap-1">
                                <Clock size={12} className="text-sky-600" /> Schedule Window
                              </span>
                              <span className="font-bold text-slate-900 block mt-0.5">
                                {job.booking?.appointment_date} ({job.booking?.time_slot})
                              </span>
                              {job.eta_minutes !== undefined && (
                                <span className="text-[11px] text-emerald-600 font-bold">
                                  ETA: ~{job.eta_minutes} mins traffic drive
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Crew Claim Request Action Box (Admin Review) */}
                          {job.claim_status === 'PENDING' && (
                            <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-400 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Hand size={16} className="text-amber-700" />
                                  <span className="text-xs font-black uppercase text-amber-950">
                                    Crew Claim Request
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-mono">
                                  {job.claim_requested_at
                                    ? new Date(job.claim_requested_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : 'Pending'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-800">
                                Specialist <strong className="text-slate-950 font-black">{job.claim_requester?.name || 'Crew Member'}</strong> requested to service this appointment.
                              </p>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleAcceptClaim(job.id)}
                                  className="flex-1 min-h-[38px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <CheckCircle2 size={14} /> Accept Claim
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDenyClaim(job.id)}
                                  className="flex-1 min-h-[38px] px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <XCircle size={14} /> Deny Claim
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Customer Dissatisfaction Feedback & Re-schedule Button */}
                          {job.status === 'NEEDS_REVISIT' && (
                            <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <AlertTriangle size={16} className="text-rose-600" />
                                  <span className="text-xs font-black uppercase tracking-wider text-rose-950">
                                    Customer Dissatisfaction Feedback
                                  </span>
                                </div>
                                {job.revisit_count ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-200 text-rose-900 rounded font-mono">
                                    Revisit Cycle #{job.revisit_count}
                                  </span>
                                ) : null}
                              </div>
                              <div className="bg-white/90 p-2.5 rounded-lg border border-rose-200 text-xs text-rose-900">
                                <span className="font-bold text-[10px] uppercase text-rose-600 block mb-0.5">
                                  Customer Reported:
                                </span>
                                <p className="italic font-medium">
                                  &ldquo;{job.customer_feedback || 'Customer was not satisfied with the work and requested a touch-up visit.'}&rdquo;
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenReschedule(job)}
                                className="w-full min-h-[38px] px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                              >
                                <Calendar size={15} /> Re-schedule Follow-up Day for this Crew
                              </button>
                            </div>
                          )}

                          {/* Awaiting Customer Inspection & Approval Banner */}
                          {job.status === 'AWAITING_APPROVAL' && (
                            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Clock size={16} className="text-purple-600 animate-spin shrink-0" />
                                <div>
                                  <span className="font-black uppercase tracking-wider text-[11px] block text-purple-950">
                                    Crew Finished Detailing
                                  </span>
                                  <span className="text-purple-800 text-[11px]">
                                    Awaiting customer inspection and approval in Customer Portal.
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-purple-200 text-purple-900 rounded-lg shrink-0">
                                In Inspection
                              </span>
                            </div>
                          )}

                          {/* Customer Verified Rating & Review */}
                          {job.status === 'COMPLETED' && (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                  <ShieldCheck size={12} className="text-emerald-600" /> Customer Approval &amp; Rating
                                </span>
                                {job.rating ? (
                                  <div className="flex items-center gap-1 text-amber-500 font-black">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        size={13}
                                        className={i < (job.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                                      />
                                    ))}
                                    <span className="ml-1 text-xs text-slate-900 font-extrabold">{job.rating}/5</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                                    Approved by Customer
                                  </span>
                                )}
                              </div>
                              {job.review && (
                                <p className="text-xs text-slate-700 italic bg-white p-2 rounded border border-slate-200">
                                  &ldquo;{job.review}&rdquo;
                                </p>
                              )}
                            </div>
                          )}

                          {/* Action Controls & Deletion */}
                          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            {/* Crew Assignment Dropdown */}
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <UserCheck
                                size={16}
                                className={
                                  job.status === 'COMPLETED'
                                    ? 'text-slate-400'
                                    : !job.assigned_to
                                    ? 'text-amber-600'
                                    : 'text-slate-500'
                                }
                              />
                              <select
                                value={job.assigned_to || ''}
                                onChange={(e) => handleCrewAssign(job.id, e.target.value)}
                                disabled={job.status === 'COMPLETED'}
                                title={
                                  job.status === 'COMPLETED'
                                    ? 'Service completed. Crew assignment is locked.'
                                    : 'Assign field crew specialist'
                                }
                                className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-sky-500 w-full sm:w-auto transition-all ${
                                  job.status === 'COMPLETED'
                                    ? 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed select-none font-bold shadow-none'
                                    : !job.assigned_to && job.status !== 'CANCELLED'
                                    ? 'bg-amber-50 border-2 border-amber-400 text-amber-900 font-bold shadow-xs'
                                    : 'bg-white border border-slate-300 text-slate-800'
                                }`}
                              >
                                <option value="">-- Assign Crew Van --</option>
                                {crewMembers.map((cm) => (
                                  <option key={cm.id} value={cm.id}>
                                    {cm.name}
                                  </option>
                                ))}
                                {job.assigned_to && !crewMembers.some((cm) => cm.id === job.assigned_to) && (
                                  <option value={job.assigned_to}>
                                    {job.assignee?.name || 'Assigned Specialist'}
                                  </option>
                                )}
                              </select>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                              {/* Status Override */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Status:</span>
                                <select
                                  value={job.status}
                                  onChange={(e) =>
                                    handleStatusOverride(job.id, e.target.value as JobStatus)
                                  }
                                  className="bg-white border border-slate-300 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:ring-2 focus:ring-sky-500"
                                >
                                  <option value="SCHEDULED">SCHEDULED</option>
                                  <option value="ON_THE_WAY">ON THE WAY</option>
                                  <option value="ARRIVED">ARRIVED</option>
                                  <option value="IN_PROGRESS">IN PROGRESS</option>
                                  <option value="AWAITING_APPROVAL">AWAITING APPROVAL</option>
                                  <option value="NEEDS_REVISIT">NEEDS REVISIT</option>
                                  <option value="COMPLETED" disabled={job.status !== 'COMPLETED'}>
                                    {job.status === 'COMPLETED' ? 'COMPLETED (Customer Approved)' : 'COMPLETED (Requires Customer Approval)'}
                                  </option>
                                  <option value="CANCELLED">CANCELLED</option>
                                  <option value="DELAYED">DELAYED</option>
                                </select>
                              </div>

                              {/* Order Deletion / Cancellation Action */}
                              <button
                                type="button"
                                onClick={() => handleDeleteJob(job.id)}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
                                title="Delete / Cancel Order"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </main>
        </div>

        {/* User & Crew Roster Management Modal */}
        <UserManagementModal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setActiveTab('dashboard');
          }}
          onUsersChanged={loadData}
        />

        {/* Re-schedule Follow-up Day Modal */}
        {rescheduleJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight">Re-schedule Follow-up Visit</h3>
                    <p className="text-xs text-rose-100 font-medium">
                      Order #{rescheduleJob.id.substring(0, 8)} • Touch-up Return
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRescheduleJob(null)}
                  className="p-1.5 rounded-xl hover:bg-white/20 transition-all text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4 text-xs">
                {/* Customer Feedback Callout */}
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-rose-600 block mb-1">
                    Customer Dissatisfaction Note:
                  </span>
                  <p className="italic font-medium">
                    &ldquo;{rescheduleJob.customer_feedback || 'Customer requested a follow-up touch-up visit.'}&rdquo;
                  </p>
                </div>

                {/* Vehicle & Location Info */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Vehicle:</span>
                    <span>
                      {rescheduleJob.booking?.vehicle_make} {rescheduleJob.booking?.vehicle_model} (
                      {rescheduleJob.booking?.vehicle_plate})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Location:</span>
                    <span className="truncate max-w-[260px]">
                      {rescheduleJob.booking?.service_location}
                    </span>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Assigned Crew Specialist (Default is original crew)
                    </label>
                    <select
                      value={rescheduleCrewId}
                      onChange={(e) => setRescheduleCrewId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-rose-500 text-slate-800"
                    >
                      <option value="">-- Keep Original / Select Crew --</option>
                      {crewMembers.map((cm) => (
                        <option key={cm.id} value={cm.id}>
                          {cm.name} {cm.id === rescheduleJob.assigned_to ? '(Original Specialist)' : ''}
                        </option>
                      ))}
                      {rescheduleJob.assigned_to &&
                        !crewMembers.some((cm) => cm.id === rescheduleJob.assigned_to) && (
                          <option value={rescheduleJob.assigned_to}>
                            {rescheduleJob.assignee?.name || 'Original Specialist'} (Original Specialist)
                          </option>
                        )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Select New Follow-up Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-rose-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Select Time Slot Window *
                    </label>
                    <select
                      required
                      value={rescheduleTimeSlot}
                      onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-rose-500 text-slate-800"
                    >
                      <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM</option>
                      <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                      <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                      <option value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM</option>
                      <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                      <option value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM</option>
                      <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                    </select>
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRescheduleJob(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rescheduleSubmitting || !rescheduleDate}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar size={14} />
                    {rescheduleSubmitting ? 'Rescheduling...' : 'Confirm & Dispatch Follow-up'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

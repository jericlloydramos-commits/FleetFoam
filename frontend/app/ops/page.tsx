'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Job, JobStatus, Profile, SupportTicket } from '@/lib/types';
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
  RotateCcw,
  Headphones,
  Lock,
  MessageSquare,
  Send,
  CheckCheck,
} from 'lucide-react';

export default function OperationsDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [ticketFilter, setTicketFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    subject: '',
    message: '',
    priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW',
    vehicle_plate: '',
  });

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserModal, setShowUserModal] = useState(false);
  const [viewMode, setViewMode] = useState<'SPLIT' | 'MAP' | 'MATRIX'>('SPLIT');
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [assignmentToast, setAssignmentToast] = useState<string | null>(null);

  // 15-Second Map Auto-Refresh Interval (Per Sir Kristian's Requirement)
  const [refreshCountdown, setRefreshCountdown] = useState<number>(15);

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
    window.addEventListener('storage', handleUpdate);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('fleetfoam_state_channel');
        bc.onmessage = () => {
          handleUpdate();
        };
      }
    } catch {}

    // Check URL tab parameter on initial load
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam) setActiveTab(tabParam);
    }

    // 15-Second Map & Dispatch Auto-Refresh Interval
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          loadData();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      if (bc) bc.close();
      clearInterval(timer);
    };
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
      await mockDb.syncJobsFromApi();
    } catch {
      // Fallback to local store
    }
    setJobs(mockDb.getJobs());
    setProfiles(mockDb.getProfiles());
    setSupportTickets(mockDb.getSupportTickets());
  };

  const handleApproveBooking = (bookingOrJobId: string) => {
    const res = mockDb.approveBooking(bookingOrJobId);
    if (res.success) {
      loadData();
      setAssignmentToast('✅ Appointment Approved! Customer online cancellation locked per policy.');
      setTimeout(() => setAssignmentToast(null), 6000);
    }
  };

  const handleUpdateTicketStatus = (
    ticketId: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED',
    notes?: string
  ) => {
    mockDb.updateSupportTicketStatus(ticketId, status, notes);
    setSupportTickets(mockDb.getSupportTickets());
    setAssignmentToast(`Support Ticket #${ticketId} status updated to ${status}.`);
    setTimeout(() => setAssignmentToast(null), 5000);
  };

  const handleCreateSupportTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketForm.customer_name || !newTicketForm.customer_phone || !newTicketForm.subject) {
      alert('Please fill out customer name, contact phone number, and subject.');
      return;
    }
    mockDb.createSupportTicket({
      customer_name: newTicketForm.customer_name,
      customer_phone: newTicketForm.customer_phone,
      customer_email: newTicketForm.customer_email || 'customer@fleetfoam.com',
      subject: newTicketForm.subject,
      message: newTicketForm.message,
      priority: newTicketForm.priority,
      status: 'OPEN',
      vehicle_plate: newTicketForm.vehicle_plate || undefined,
    });
    setSupportTickets(mockDb.getSupportTickets());
    setShowNewTicketModal(false);
    setNewTicketForm({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      subject: '',
      message: '',
      priority: 'MEDIUM',
      vehicle_plate: '',
    });
    setAssignmentToast('🎧 New Customer Support Ticket logged successfully.');
    setTimeout(() => setAssignmentToast(null), 5000);
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

  const handleResetDemoData = async () => {
    if (window.confirm('Reset all dispatch data to clean 3-order demonstration state for instructors?')) {
      try {
        setIsRefreshing(true);
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'RESET_DEMO' }),
        });
        if (res.ok) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('fleetfoam_mock_jobs_v4');
            localStorage.removeItem('fleetfoam_mock_bookings_v4');
          }
          await loadData();
          setAssignmentToast('✨ Demo Data Reset Complete! Clean 3-order scenario is ready for your instructor presentation.');
          setTimeout(() => setAssignmentToast(null), 7000);
        }
      } catch (err) {
        alert('Failed to reset demo data: ' + err);
      } finally {
        setIsRefreshing(false);
      }
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

                {/* Customer Support Desk Quick Toggle (Evaluation Item 6) */}
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'support' ? 'dashboard' : 'support')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                    activeTab === 'support'
                      ? 'bg-sky-600 text-white ring-2 ring-sky-300'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Open Customer Support Management Center"
                >
                  <Headphones size={15} className={activeTab === 'support' ? 'text-white' : 'text-sky-600'} />
                  <span>Support Desk</span>
                  {supportTickets.filter((t) => t.status === 'OPEN').length > 0 && (
                    <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full">
                      {supportTickets.filter((t) => t.status === 'OPEN').length}
                    </span>
                  )}
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

                {/* Restart Demo Button */}
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Reset all active dispatches to clean demonstration state for instructors"
                >
                  <RotateCcw size={14} className="text-amber-700" />
                  <span>Restart Demo (3 Clean Orders)</span>
                </button>

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

            {activeTab === 'support' ? (
              <section className="space-y-4 animate-fadeIn">
                {/* Support Desk Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                        <Headphones size={20} />
                      </span>
                      <div>
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                          Customer Support &amp; Dispatch Resolution Center (CS-01)
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                            Live Queue
                          </span>
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Real-time customer inquiries, rescheduling requests, phone inbound logs, and complaint resolution
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Filters */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
                      {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setTicketFilter(status)}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            ticketFilter === status
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {status === 'ALL'
                            ? `All (${supportTickets.length})`
                            : status === 'OPEN'
                            ? `Open (${supportTickets.filter((t) => t.status === 'OPEN').length})`
                            : status === 'IN_PROGRESS'
                            ? `In Progress (${supportTickets.filter((t) => t.status === 'IN_PROGRESS').length})`
                            : `Resolved (${supportTickets.filter((t) => t.status === 'RESOLVED').length})`}
                        </button>
                      ))}
                    </div>

                    {/* Log Inbound Call Button */}
                    <button
                      type="button"
                      onClick={() => setShowNewTicketModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <PhoneCall size={14} />
                      <span>+ Log Support Call</span>
                    </button>
                  </div>
                </div>

                {/* Ticket List */}
                <div className="grid grid-cols-1 gap-3">
                  {supportTickets
                    .filter((ticket) => ticketFilter === 'ALL' || ticket.status === ticketFilter)
                    .map((ticket) => (
                      <div
                        key={ticket.id}
                        className="stitch-card p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-400">
                              #{ticket.id}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                ticket.status === 'OPEN'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : ticket.status === 'IN_PROGRESS'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}
                            >
                              {ticket.status.replace('_', ' ')}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                ticket.priority === 'HIGH'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : ticket.priority === 'MEDIUM'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-50 text-slate-700 border border-slate-200'
                              }`}
                            >
                              Priority: {ticket.priority}
                            </span>
                            {ticket.vehicle_plate && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                Plate: {ticket.vehicle_plate}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 font-medium">
                              {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{ticket.subject}</h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ticket.message}</p>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-1 flex-wrap">
                            <span>Customer: <strong className="text-slate-800">{ticket.customer_name}</strong></span>
                            <a
                              href={`tel:${ticket.customer_phone}`}
                              className="inline-flex items-center gap-1 font-bold text-sky-700 hover:text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200"
                            >
                              <PhoneCall size={12} />
                              {ticket.customer_phone}
                            </a>
                            {ticket.customer_email && (
                              <span className="hidden sm:inline text-slate-400">{ticket.customer_email}</span>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {ticket.status !== 'IN_PROGRESS' && ticket.status !== 'RESOLVED' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateTicketStatus(ticket.id, 'IN_PROGRESS')}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                              >
                                Start Working
                              </button>
                            )}
                            {ticket.status !== 'RESOLVED' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateTicketStatus(ticket.id, 'RESOLVED')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                              >
                                <CheckCheck size={14} />
                                Resolve Ticket
                              </button>
                            )}
                            {ticket.status === 'RESOLVED' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateTicketStatus(ticket.id, 'OPEN')}
                                className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                              >
                                Reopen
                              </button>
                            )}
                            <a
                              href={`tel:${ticket.customer_phone}`}
                              className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <PhoneCall size={13} />
                              Direct Call
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}

                  {supportTickets.filter((ticket) => ticketFilter === 'ALL' || ticket.status === ticketFilter).length === 0 && (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                      <Headphones className="mx-auto text-slate-300 mb-2" size={36} />
                      <h4 className="text-sm font-bold text-slate-700">No support tickets found</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        There are no customer inquiries matching the selected filter.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <>
                {/* LIVE PHILIPPINES DISPATCH MAP (Shown in SPLIT or MAP mode) */}
                {(viewMode === 'SPLIT' || viewMode === 'MAP') && (
              <section className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Navigation className="text-emerald-600" size={18} />
                      Live Philippines Fleet Map (Metro Manila)
                    </h2>
                    <span className="text-xs text-slate-500 font-medium">
                      Tracking {filteredJobs.length} active vehicle detail locations
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Map Sync: {refreshCountdown}s (15s Interval)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleRefresh();
                        setRefreshCountdown(15);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Force refresh telemetry now"
                    >
                      <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-sky-600' : ''} />
                    </button>
                  </div>
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

                {/* Pending Crew Claim Requests Alert Banner & Action Desk */}
                {(() => {
                  const pendingClaims = jobs.filter(
                    (j) => j.claim_status === 'PENDING' && !j.assigned_to && j.status !== 'CANCELLED'
                  );
                  if (pendingClaims.length === 0) return null;
                  return (
                    <div className="space-y-3">
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

                      {/* Immediate Action Desk Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {pendingClaims.map((claimJob) => (
                          <div
                            key={claimJob.id}
                            className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-400 shadow-sm space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                    #{claimJob.id.substring(0, 8)}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-500">
                                    {claimJob.booking?.service?.name}
                                  </span>
                                </div>
                                <h4 className="text-sm font-black text-slate-900 mt-1">
                                  {claimJob.booking?.vehicle_make} {claimJob.booking?.vehicle_model}
                                </h4>
                                <span className="text-xs font-mono font-bold text-slate-700">
                                  Plate: {claimJob.booking?.vehicle_plate} &bull; {claimJob.booking?.service_location}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                ₱{claimJob.booking?.service?.price?.toLocaleString() || '1,899'} PHP
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-xs text-slate-800 flex items-center justify-between">
                              <span>
                                Specialist: <strong className="text-slate-950 font-black">{claimJob.claim_requester?.name || 'Field Specialist'}</strong>
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {claimJob.claim_requested_at
                                  ? new Date(claimJob.claim_requested_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Just now'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleAcceptClaim(claimJob.id)}
                                className="flex-1 min-h-[40px] py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <CheckCircle2 size={15} /> Approve &amp; Assign
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDenyClaim(claimJob.id)}
                                className="flex-1 min-h-[40px] py-2 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-black text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <XCircle size={15} /> Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
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
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-900 text-white rounded inline-block">
                                  PLATE: {job.booking?.vehicle_plate}
                                </span>
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  ₱{job.booking?.service?.price?.toLocaleString() || '1,899'} PHP
                                </span>
                                {(job.customer_phone || job.booking?.customer_phone) && (
                                  <a
                                    href={`tel:${job.customer_phone || job.booking?.customer_phone}`}
                                    className="text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 flex items-center gap-1 transition-colors"
                                    title="Customer Contact Number - Click to Call"
                                  >
                                    <PhoneCall size={12} className="text-sky-600" />
                                    <span>{job.customer_phone || job.booking?.customer_phone}</span>
                                  </a>
                                )}
                                {(job.is_approved || job.booking?.is_approved) && job.status !== 'CANCELLED' && (
                                  <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                                    <Lock size={10} className="text-emerald-700" /> Approved &bull; Locked
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={job.status} size="md" />
                              {job.status === 'COMPLETED' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteJob(job.id)}
                                  className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-300 font-bold text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                                  title="Clear completed job from active dispatch queue"
                                >
                                  <Trash2 size={13} className="text-rose-600" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
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

                          {/* Action Controls & Deletion Footer */}
                          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2.5">
                            {/* Left Side: Crew Assignment Dropdown OR Pending Crew Request Controls OR Completed Archive Bar */}
                            <div className="flex-1 min-w-0">
                              {job.status === 'COMPLETED' ? (
                                <div className="flex items-center justify-between gap-2 bg-emerald-50/90 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-950 shadow-2xs">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                    <span className="truncate text-emerald-900">
                                      Finished &amp; Approved &bull; {job.assignee?.name || 'Crew Specialist'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteJob(job.id)}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] uppercase tracking-wider rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                                    title="Delete and clear completed job from active dispatch queue"
                                  >
                                    <Trash2 size={12} />
                                    <span>Delete from Queue</span>
                                  </button>
                                </div>
                              ) : job.claim_status === 'PENDING' && !job.assigned_to ? (
                                <div className="flex items-center justify-between gap-2 bg-amber-50 border-2 border-amber-400 px-3 py-1 rounded-xl shadow-xs animate-fadeIn">
                                  <div className="flex items-center gap-1.5 text-xs text-amber-950 font-bold min-w-0 truncate">
                                    <Hand size={14} className="text-amber-600 shrink-0 animate-bounce" />
                                    <span className="truncate">
                                      Claim: <strong className="font-black text-slate-900">{job.claim_requester?.name || 'Specialist'}</strong>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleAcceptClaim(job.id)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-wider rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95"
                                      title="Approve claim and assign specialist"
                                    >
                                      <CheckCircle2 size={13} />
                                      <span>Approve</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDenyClaim(job.id)}
                                      className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 hover:border-rose-400 font-black text-[11px] uppercase tracking-wider rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95"
                                      title="Deny claim and leave unassigned"
                                    >
                                      <XCircle size={13} />
                                      <span>Deny</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 min-w-0">
                                  <UserCheck
                                    size={16}
                                    className={
                                      !job.assigned_to
                                        ? 'text-amber-600 shrink-0'
                                        : 'text-slate-500 shrink-0'
                                    }
                                  />
                                  <select
                                    value={job.assigned_to || ''}
                                    onChange={(e) => handleCrewAssign(job.id, e.target.value)}
                                    title="Assign field crew specialist"
                                    className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-sky-500 w-full max-w-[210px] transition-all truncate ${
                                      !job.assigned_to && job.status !== 'CANCELLED'
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
                              )}
                            </div>

                            {/* Right Side: Compact Status Override, Approval & Delete Button */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Approve Booking Button ("Once approved, dili na ma cancel") */}
                              {!job.is_approved && !job.booking?.is_approved && job.status !== 'CANCELLED' && job.status !== 'COMPLETED' && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveBooking(job.id)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                                  title="Approve booking (locks customer cancellation)"
                                >
                                  <ShieldCheck size={13} />
                                  <span>Approve</span>
                                </button>
                              )}

                              {/* Status Override Pill */}
                              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 shadow-2xs">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Status:</span>
                                <select
                                  value={job.status}
                                  onChange={(e) =>
                                    handleStatusOverride(job.id, e.target.value as JobStatus)
                                  }
                                  className="bg-transparent text-slate-900 font-bold text-xs focus:outline-none cursor-pointer max-w-[130px]"
                                >
                                  <option value="SCHEDULED">SCHEDULED</option>
                                  <option value="ON_THE_WAY">ON THE WAY</option>
                                  <option value="ARRIVED">ARRIVED</option>
                                  <option value="IN_PROGRESS">IN PROGRESS</option>
                                  <option value="AWAITING_APPROVAL">AWAIT APPROVAL</option>
                                  <option value="NEEDS_REVISIT">NEEDS REVISIT</option>
                                  <option value="COMPLETED" disabled={job.status !== 'COMPLETED'}>
                                    COMPLETED
                                  </option>
                                  <option value="CANCELLED">CANCELLED</option>
                                  <option value="DELAYED">DELAYED</option>
                                </select>
                              </div>

                              {/* Order Deletion Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteJob(job.id)}
                                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer shadow-xs flex items-center justify-center shrink-0"
                                title="Cancel and delete this dispatch order"
                                aria-label="Delete order"
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
              </>
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

        {/* Log Inbound Support Call / Ticket Modal */}
        {showNewTicketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
              <div className="p-5 bg-gradient-to-r from-sky-600 to-sky-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Headphones size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight">Log Inbound Support Call / Ticket</h3>
                    <p className="text-xs text-sky-100 font-medium">Customer Support Desk (CS-01)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="p-1.5 rounded-xl hover:bg-white/20 transition-all text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSupportTicket} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Atty. Miguel Santos"
                      value={newTicketForm.customer_name}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, customer_name: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-sky-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Customer Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +63 917 555 0192"
                      value={newTicketForm.customer_phone}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, customer_phone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-sky-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
                    <select
                      value={newTicketForm.priority}
                      onChange={(e) =>
                        setNewTicketForm({
                          ...newTicketForm,
                          priority: e.target.value as 'HIGH' | 'MEDIUM' | 'LOW',
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-sky-500 text-slate-800"
                    >
                      <option value="HIGH">High (Urgent / Active Job Delay)</option>
                      <option value="MEDIUM">Medium (Rescheduling / Inquiry)</option>
                      <option value="LOW">Low (General Feedback / Quotation)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vehicle Plate (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. NBD-8821"
                      value={newTicketForm.vehicle_plate}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, vehicle_plate: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-sky-500 text-slate-800 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ticket Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Request to change arrival time / Location gate access instructions"
                    value={newTicketForm.subject}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Details &amp; Customer Notes *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Document conversation details, customer requests, or crew instructions..."
                    value={newTicketForm.message}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, message: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-sky-500 text-slate-800 resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTicketModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Send size={14} />
                    Log Ticket to Queue
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

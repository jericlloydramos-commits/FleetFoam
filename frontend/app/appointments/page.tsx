'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Booking, Job, AppNotification } from '@/lib/types';
import { mockDb, NOTIFICATIONS_CHANGE_EVENT } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { RoleGuard } from '@/components/auth/RoleGuard';
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  AlertTriangle,
  XCircle,
  PlusCircle,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  PhoneCall,
  UserCheck,
  Sparkles,
  Star,
  RefreshCw,
} from 'lucide-react';

export default function MyAppointmentsPage() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellationSuccess, setCancellationSuccess] = useState(false);
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  const [ratingReview, setRatingReview] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBookings = useCallback(async () => {
    if (!user) {
      setBookings([]);
      setJobs([]);
      return;
    }

    try {
      // 1. Live sync customer's bookings from Supabase
      await mockDb.syncBookingsFromSupabase(user.id, profile?.role);
    } catch {
      // Fallback to local cache
    }

    // 2. Filter bookings strictly by authenticated customer (or all for Operations)
    const userBookings = mockDb.getBookingsByCustomerId(user.id, profile?.role, user.email);
    setBookings(userBookings);

    // 3. Load all jobs to dynamically resolve crew assignees and live statuses
    const allJobs = mockDb.getJobs();
    setJobs(allJobs);

    // 4. Selected booking tracking
    setSelectedBooking((prev) => {
      if (prev && userBookings.some((b) => b.id === prev.id)) {
        return userBookings.find((b) => b.id === prev.id) || null;
      }
      return userBookings.length > 0 ? userBookings[0] : null;
    });

    // 5. Look for recent unread notifications for this customer
    const notifs = mockDb.getNotifications(user.id, profile?.role, user.email);
    const latest = notifs.find(
      (n) =>
        (n.type === 'CUSTOMER_ACCEPTED' ||
          n.type === 'SERVICE_AWAITING_APPROVAL' ||
          n.type === 'CUSTOMER_APPROVED_RATED' ||
          n.type === 'FOLLOWUP_RESCHEDULED' ||
          n.type === 'JOB_COMPLETED_CUSTOMER') &&
        !n.read
    );
    if (latest) {
      setActiveNotification(latest);
    }
  }, [user, profile]);

  useEffect(() => {
    loadBookings();
    const handleUpdate = () => {
      loadBookings();
    };
    window.addEventListener(NOTIFICATIONS_CHANGE_EVENT, handleUpdate);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGE_EVENT, handleUpdate);
  }, [loadBookings]);

  const handleCancelBooking = async (bookingId: string) => {
    // FR-06 / AC-05.1: Cancel both the booking AND its associated job
    // so crew dashboard AND ops dashboard both reflect the cancellation
    mockDb.cancelBooking(bookingId);
    await loadBookings();
    setCancelModalOpen(false);
    setCancellationSuccess(true);
    setTimeout(() => setCancellationSuccess(false), 4000);
  };

  // Customer clicks "Approve Work" -> marks service as completed and triggers rating feature right after
  const handleApprove = async () => {
    if (!selectedBooking) return;
    const matchingJob = jobs.find((j) => j.booking_id === selectedBooking.id) ||
                        mockDb.getJobs().find((j) => j.booking_id === selectedBooking.id);
    const targetId = matchingJob ? matchingJob.id : selectedBooking.id;

    setIsSubmitting(true);
    try {
      const res = mockDb.approveJob(targetId);
      if (res.success) {
        await loadBookings();
        // Immediately pop up the rating feature right after approving
        setRatingValue(5);
        setRatingReview('');
        setRateModalOpen(true);
        setActionToast(
          '🎉 Appointment approved & marked completed! Please take a moment to rate your specialist below.'
        );
        setTimeout(() => setActionToast(null), 7000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Customer submits rating right after approval or from history
  const handleRateSubmit = async () => {
    if (!selectedBooking) return;
    const matchingJob = jobs.find((j) => j.booking_id === selectedBooking.id) ||
                        mockDb.getJobs().find((j) => j.booking_id === selectedBooking.id);
    const targetId = matchingJob ? matchingJob.id : selectedBooking.id;

    setIsSubmitting(true);
    try {
      const res = mockDb.rateCompletedJob(
        targetId,
        ratingValue,
        ratingReview.trim() || undefined
      );
      if (res.success) {
        setRateModalOpen(false);
        setRatingReview('');
        setActionToast(
          `Thank you for your rating! Specialist work rated ${ratingValue}★ stars.`
        );
        setTimeout(() => setActionToast(null), 6000);
        await loadBookings();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveAndRate = async () => {
    if (!selectedBooking) return;
    const matchingJob = jobs.find((j) => j.booking_id === selectedBooking.id) ||
                        mockDb.getJobs().find((j) => j.booking_id === selectedBooking.id);
    const targetId = matchingJob ? matchingJob.id : selectedBooking.id;

    setIsSubmitting(true);
    try {
      const res = mockDb.approveAndRateJob(targetId, ratingValue, ratingReview.trim() || undefined);
      if (res.success) {
        setRateModalOpen(false);
        setRatingReview('');
        setActionToast(
          `Thank you! You approved this detailing appointment with a ${ratingValue}★ rating. Your service is marked completed.`
        );
        setTimeout(() => setActionToast(null), 6000);
        await loadBookings();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!selectedBooking || !feedbackText.trim()) return;
    const matchingJob = jobs.find((j) => j.booking_id === selectedBooking.id) ||
                        mockDb.getJobs().find((j) => j.booking_id === selectedBooking.id);
    const targetId = matchingJob ? matchingJob.id : selectedBooking.id;

    setIsSubmitting(true);
    try {
      const res = mockDb.rejectJobWithFeedback(targetId, feedbackText.trim());
      if (res.success) {
        setFeedbackModalOpen(false);
        setFeedbackText('');
        setActionToast(
          'Your feedback has been sent to Operations. Admin will schedule another day for your specialist to return.'
        );
        setTimeout(() => setActionToast(null), 6000);
        await loadBookings();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['CUSTOMER', 'OPERATIONS']}>
      <div className="min-h-screen bg-slate-subtle text-slate-900 flex flex-col font-sans">
        <Header />

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
              <span>Customer Portal</span>
              <span>&bull;</span>
              <span>CUS-09 &bull; CUS-10</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              My Detail Appointments
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your scheduled mobile fleet detailing appointments and dispatch status.
            </p>
          </div>

          <Link
            href="/booking"
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all min-h-[44px]"
          >
            <PlusCircle size={16} /> Book New Service
          </Link>
        </div>

        {/* Toast confirmation banner */}
        {actionToast && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 shadow-md flex items-center justify-between gap-4 animate-fadeIn"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <p className="text-xs font-bold">{actionToast}</p>
            </div>
            <button
              type="button"
              onClick={() => setActionToast(null)}
              className="text-emerald-700 hover:text-emerald-950 font-black text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Cancellation Success Feedback Toast */}
        {cancellationSuccess && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 shadow-sm flex items-center gap-3 animate-fadeIn"
          >
            <CheckCircle2 size={20} className="text-amber-600 flex-shrink-0" />
            <div className="text-xs font-bold">
              Appointment successfully cancelled. Status has been broadcasted to Fleet Crew and Operations.
            </div>
          </div>
        )}

        {/* Real-Time Notification Alert Banner */}
        {activeNotification && (
          <div
            role="status"
            className={`p-4 rounded-2xl border-2 shadow-md flex items-center justify-between gap-4 animate-fadeIn ${
              activeNotification.type === 'JOB_COMPLETED_CUSTOMER'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                : 'bg-sky-50 border-sky-400 text-sky-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  activeNotification.type === 'JOB_COMPLETED_CUSTOMER'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-sky-600 text-white'
                }`}
              >
                {activeNotification.type === 'JOB_COMPLETED_CUSTOMER' ? (
                  <Sparkles size={22} className="animate-pulse" />
                ) : (
                  <UserCheck size={22} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      activeNotification.type === 'JOB_COMPLETED_CUSTOMER'
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-sky-200 text-sky-900'
                    }`}
                  >
                    {activeNotification.title}
                  </span>
                </div>
                <p className="text-xs font-bold mt-1">
                  {activeNotification.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                mockDb.markNotificationAsRead(activeNotification.id);
                setActiveNotification(null);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {bookings.length === 0 ? (
          /* Empty State (CUS Empty State) */
          <div className="stitch-card p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto border border-sky-100">
              <Calendar size={32} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">No Appointments Scheduled</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any active detailing appointments. Book an on-demand wash for your fleet today.
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-sky-700"
            >
              <PlusCircle size={14} /> Schedule First Detail
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Appointments List (CUS-09) */}
            <div className="space-y-3 lg:col-span-1">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider block">
                Your Bookings ({bookings.length})
              </span>

              <div className="space-y-2">
                {bookings.map((booking) => {
                  const isSelected = selectedBooking?.id === booking.id;
                  const matchingJob = jobs.find((j) => j.booking_id === booking.id);
                  return (
                    <button
                      key={booking.id}
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-sky-50/80 border-sky-400 shadow-sm ring-2 ring-sky-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{booking.id.slice(-6)}
                        </span>
                        <StatusBadge status={booking.status} size="sm" />
                      </div>

                      <h4 className="text-sm font-extrabold text-slate-900">
                        {booking.vehicle_make} {booking.vehicle_model}
                      </h4>
                      <p className="text-xs font-medium text-slate-600 mt-0.5 truncate">
                        {booking.service?.name}
                      </p>

                      {/* Dynamic Crew Assignment status */}
                      <div className="mt-2 text-[11px] font-semibold flex items-center gap-1.5">
                        {matchingJob?.assignee ? (
                          <span className="text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-bold truncate">
                            Specialist: {matchingJob.assignee.name}
                          </span>
                        ) : booking.status === 'CANCELLED' ? (
                          <span className="text-slate-400 font-medium">Cancelled</span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold truncate">
                            ⏳ Awaiting Crew Assignment
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-sky-600" /> {booking.appointment_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-sky-600" /> {booking.time_slot.split(' - ')[0]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Appointment Details View (CUS-10) */}
            {selectedBooking && (
              <div className="lg:col-span-2 space-y-6">
                <div className="stitch-card p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
                    <div>
                      <span className="text-xs font-bold uppercase text-sky-700 tracking-wider">
                        Appointment Details &bull; #{selectedBooking.id}
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 mt-1">
                        {selectedBooking.vehicle_make} {selectedBooking.vehicle_model}
                      </h2>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        Plate Number: <span className="font-mono font-bold text-slate-800">{selectedBooking.vehicle_plate}</span>
                      </p>
                    </div>

                    <StatusBadge status={selectedBooking.status} size="lg" />
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Car size={14} className="text-sky-600" /> Selected Detailing Package
                      </span>
                      <p className="text-sm font-extrabold text-slate-900">
                        {selectedBooking.service?.name}
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        {selectedBooking.service?.description}
                      </p>
                      <div className="pt-2 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">Duration: {selectedBooking.service?.duration_min} mins</span>
                        <span className="text-sky-800 font-extrabold text-sm">
                          ₱{selectedBooking.service?.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })} PHP
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <MapPin size={14} className="text-sky-600" /> Service Location
                      </span>
                      <p className="text-sm font-extrabold text-slate-900">
                        {selectedBooking.service_location}
                      </p>
                      <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1 pt-2">
                        <Clock size={14} className="text-sky-600" /> Reserved Window
                      </span>
                      <p className="text-xs font-bold text-slate-800">
                        {selectedBooking.appointment_date} &bull; {selectedBooking.time_slot}
                      </p>
                    </div>
                  </div>

                  {/* Operational Crew & Service Assignment Status */}
                  {(() => {
                    const selectedJob = jobs.find((j) => j.booking_id === selectedBooking.id);
                    const isCompleted = selectedBooking.status === 'COMPLETED';
                    const isCancelled = selectedBooking.status === 'CANCELLED';
                    const isAwaitingApproval = selectedBooking.status === 'AWAITING_APPROVAL';
                    const isNeedsRevisit = selectedBooking.status === 'NEEDS_REVISIT';
                    const hasAssignee = Boolean(selectedJob?.assignee);

                    return (
                      <div className="space-y-4">
                        {/* ─── CUSTOMER INSPECTION & APPROVAL CARD ───────────── */}
                        {!isCompleted && !isCancelled && (
                          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-emerald-50/40 border-2 border-indigo-300 shadow-md space-y-4 animate-fadeIn">
                            <div className="flex items-start gap-3.5">
                              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                                <Sparkles size={22} className="text-amber-300" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                                    isAwaitingApproval 
                                      ? 'bg-purple-700 text-white shadow-xs animate-pulse' 
                                      : selectedBooking.status === 'IN_PROGRESS'
                                      ? 'bg-sky-700 text-white shadow-xs'
                                      : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                  }`}>
                                    {isAwaitingApproval 
                                      ? 'Detailing Finished • Customer Sign-off Required' 
                                      : selectedBooking.status === 'IN_PROGRESS'
                                      ? 'Detailing Underway • Customer Final Decision'
                                      : selectedBooking.status === 'ARRIVED'
                                      ? 'Specialist On Site • Customer Sign-off'
                                      : 'Customer Verification & Sign-off'}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-slate-500">
                                    Plate: {selectedBooking.vehicle_plate}
                                  </span>
                                </div>
                                <h3 className="text-base font-black text-slate-900 mt-1.5">
                                  {isAwaitingApproval
                                    ? 'Your Specialist Finished Detailing Your Vehicle!'
                                    : selectedBooking.status === 'IN_PROGRESS'
                                    ? 'Vehicle Detailing Underway — Customer Approval Required'
                                    : 'Customer Quality Verification & Approval'}
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                  As the customer, you have the final say on whether the job is finished. Specialist <strong className="text-slate-900">{selectedJob?.assignee?.name || 'Assigned Specialist'}</strong> cannot officially complete this service without your approval. If you are satisfied with the detailing work, click <strong className="text-emerald-700">Approve Work</strong> to officially mark it completed and leave a rating. If any spots were missed or you are unsatisfied, click <strong className="text-rose-700">Report Issue</strong> so our Admin can schedule a return visit.
                                </p>
                              </div>
                            </div>

                            {/* Customer Decision Action Buttons: Approve Work & Report Issue */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                              {/* Approve Work Button */}
                              <button
                                id="btn-approve-work"
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleApprove}
                                className="w-full sm:flex-1 min-h-[52px] py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer ring-2 ring-emerald-400/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                                title="Click to approve and officially mark service as completed"
                              >
                                <CheckCircle2 size={19} className="shrink-0 text-emerald-100" />
                                <span className="text-sm font-black">Approve Work</span>
                                <span className="text-[11px] font-bold opacity-90 hidden sm:inline">
                                  &bull; Mark as Completed
                                </span>
                              </button>

                              {/* Report Issue Button */}
                              <button
                                id="btn-report-issue"
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => {
                                  setFeedbackText('');
                                  setFeedbackModalOpen(true);
                                }}
                                className="w-full sm:flex-1 min-h-[52px] py-3.5 px-5 bg-white hover:bg-rose-50 text-rose-700 border-2 border-rose-300 hover:border-rose-400 font-black text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                                title="Report issue to admin so the crew can return and fix the work"
                              >
                                <AlertTriangle size={19} className="text-rose-600 shrink-0" />
                                <span className="text-sm font-black">Report Issue</span>
                                <span className="text-[11px] font-bold opacity-80 hidden sm:inline">
                                  &bull; Send to Admin
                                </span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ─── DISSATISFACTION / REVISIT ALERT ───────────────── */}
                        {isNeedsRevisit && (
                          <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 shadow-sm space-y-2 animate-fadeIn">
                            <div className="flex items-center gap-2">
                              <RefreshCw size={18} className="text-rose-600 animate-spin" />
                              <h4 className="text-xs font-black uppercase tracking-wider text-rose-900">
                                Touch-up Visit Pending With Operations
                              </h4>
                            </div>
                            <p className="text-xs text-rose-900 leading-relaxed">
                              Your feedback was received: <strong className="italic">&quot;{selectedBooking.customer_feedback}&quot;</strong>.
                              Operations Dispatch is scheduling another day for specialist <strong>{selectedJob?.assignee?.name || 'Assigned Specialist'}</strong> to return and finish your vehicle.
                            </p>
                          </div>
                        )}

                        {/* ─── COMPLETED RATING & REVIEW CARD ────────────────── */}
                        {isCompleted && (
                          <div className="p-5 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-emerald-950 shadow-sm space-y-3 animate-fadeIn">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 size={20} className="text-emerald-600" />
                                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                                  Service Completed &amp; Customer Approved
                                </h4>
                              </div>
                              {selectedBooking.rating ? (
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      size={16}
                                      className={
                                        s <= (selectedBooking.rating || 0)
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-slate-300'
                                      }
                                    />
                                  ))}
                                  <span className="text-xs font-black text-slate-800 ml-1">
                                    {selectedBooking.rating}/5 Stars
                                  </span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRatingValue(5);
                                    setRatingReview('');
                                    setRateModalOpen(true);
                                  }}
                                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer ring-2 ring-amber-300 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                  <Star size={16} className="fill-slate-950" /> Rate Specialist&apos;s Work Now
                                </button>
                              )}
                            </div>
                            {selectedBooking.review && (
                              <p className="text-xs text-emerald-900 italic bg-white/70 p-3 rounded-xl border border-emerald-200">
                                &quot;{selectedBooking.review}&quot;
                              </p>
                            )}
                          </div>
                        )}

                        {/* Status Information Box */}
                        <div
                          className={`p-5 rounded-2xl border flex items-start gap-3.5 transition-all ${
                            isCompleted
                              ? 'bg-slate-50 border-slate-200 text-slate-700'
                              : isCancelled
                              ? 'bg-slate-50 border-slate-200 text-slate-700'
                              : hasAssignee
                              ? 'bg-sky-50/80 border-sky-300 text-sky-950 shadow-sm'
                              : 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-sm'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                          ) : isCancelled ? (
                            <XCircle size={24} className="text-slate-400 flex-shrink-0 mt-0.5" />
                          ) : hasAssignee ? (
                            <ShieldCheck size={24} className="text-sky-700 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Clock size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black uppercase tracking-wider">
                                {isCompleted
                                  ? 'Detailing Verified'
                                  : isCancelled
                                  ? 'Appointment Cancelled'
                                  : isAwaitingApproval
                                  ? 'Work Completed • Awaiting Sign-off'
                                  : isNeedsRevisit
                                  ? 'Touch-up Revisit Scheduled'
                                  : hasAssignee
                                  ? 'Appointment Accepted & Crew Assigned'
                                  : 'Pending Crew Assignment'}
                              </h4>
                              {hasAssignee && !isCompleted && !isCancelled && (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-sky-200/90 text-sky-900 px-2 py-0.5 rounded">
                                  Confirmed
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-medium leading-relaxed">
                              {isCompleted ? (
                                <>
                                  Vehicle service finalized. Detailed by specialist{' '}
                                  <strong className="font-extrabold">{selectedJob?.assignee?.name || 'Mobile Field Crew'}</strong>. Thank you for choosing FleetFoam!
                                </>
                              ) : isCancelled ? (
                                <>
                                  This appointment was cancelled. Your slot has been released back to dispatch.
                                </>
                              ) : isAwaitingApproval ? (
                                <>
                                  Your vehicle was detailed on-site by{' '}
                                  <strong className="font-extrabold">{selectedJob?.assignee?.name}</strong>. Please check your car and approve the work above.
                                </>
                              ) : isNeedsRevisit ? (
                                <>
                                  Follow-up required. Operations is assigning another slot for{' '}
                                  <strong className="font-extrabold">{selectedJob?.assignee?.name}</strong> to return.
                                </>
                              ) : hasAssignee ? (
                                <>
                                  Your appointment was accepted by Detail Specialist{' '}
                                  <strong className="font-extrabold">{selectedJob?.assignee?.name}</strong>. They will arrive at your service location during your reserved window with the FleetFoam mobile unit.
                                </>
                              ) : (
                                <>
                                  Booking confirmed! Operations dispatch is currently assigning your detail specialist. You will receive an instant notification once assigned.
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Actions (Cancel vs Call vs Decision) */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => alert('Customer Care Line: (800) 555-FOAM')}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      <PhoneCall size={14} className="text-sky-600" /> Contact Support
                    </button>

                    {/* Prominent Customer Decision Buttons in the action bar */}
                    {selectedBooking.status !== 'CANCELLED' && selectedBooking.status !== 'COMPLETED' && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            setFeedbackText('');
                            setFeedbackModalOpen(true);
                          }}
                          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border-2 border-rose-300 hover:border-rose-400 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px]"
                          title="Report issue to admin"
                        >
                          <AlertTriangle size={15} className="text-rose-600" /> Report Issue
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleApprove}
                          className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer min-h-[44px]"
                          title="Approve work and rate specialist"
                        >
                          <CheckCircle2 size={16} /> Approve Work
                        </button>
                      </div>
                    )}

                    {selectedBooking.status !== 'CANCELLED' && selectedBooking.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() => setCancelModalOpen(true)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition-all min-h-[44px]"
                      >
                        <XCircle size={16} /> Cancel Appointment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── MODAL 1: Customer Rating Modal (Right After Approval or On-Demand) ─── */}
        {rateModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="stitch-card max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-scaleIn bg-white rounded-3xl border border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
                <Star size={28} className="fill-amber-400 text-amber-400" />
              </div>

              <div className="text-center space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-sky-700">
                  Customer Sign-off &bull; Specialist Rating
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Rate Specialist&apos;s Work
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Service has been approved and marked completed! How would you rate the specialist&apos;s work on your {selectedBooking.vehicle_make} {selectedBooking.vehicle_model}?
                </p>
              </div>

              {/* Interactive Star Picker */}
              <div className="py-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeRating = ratingHover || ratingValue;
                    const isFilled = star <= activeRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setRatingHover(star)}
                        onMouseLeave={() => setRatingHover(null)}
                        onClick={() => setRatingValue(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                        title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          size={32}
                          className={
                            isFilled
                              ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                              : 'text-slate-300'
                          }
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs font-black text-slate-700">
                  {ratingValue === 5 && '⭐⭐⭐⭐⭐ 5 Stars — Exceptional / Mirror Gloss!'}
                  {ratingValue === 4 && '⭐⭐⭐⭐ 4 Stars — Very Good Quality'}
                  {ratingValue === 3 && '⭐⭐⭐ 3 Stars — Good Standard Wash'}
                  {ratingValue === 2 && '⭐⭐ 2 Stars — Fair'}
                  {ratingValue === 1 && '⭐ 1 Star — Needs Improvement'}
                </div>
              </div>

              {/* Review Text Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Write a Review or Commendation (Optional)
                </label>
                <textarea
                  value={ratingReview}
                  onChange={(e) => setRatingReview(e.target.value)}
                  placeholder="e.g., Car is shining like brand new! Super polite specialist, great attention to rims."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[80px]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRateModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 min-h-[46px] cursor-pointer"
                >
                  Done / Skip
                </button>
                <button
                  type="button"
                  onClick={handleRateSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md min-h-[46px] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Star size={16} className="fill-slate-950" />
                  <span>{isSubmitting ? 'Saving Rating...' : 'Submit Rating'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL 2: Customer Report Issue to Admin Modal ─────────── */}
        {feedbackModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="stitch-card max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-scaleIn bg-white rounded-3xl border border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle size={28} />
              </div>

              <div className="text-center space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-rose-700">
                  Issue Report &bull; Customer Care
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Report Issue to Admin
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  If you are unsatisfied with the crew&apos;s work, submit feedback to our Operations Admin. The Admin will then schedule the crew to return and fix the issue.
                </p>
              </div>

              {/* Feedback Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Describe what needs correction or touch-up <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="e.g. Water spots left on the passenger windshield, wheels not fully degreased, or trunk interior missed."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none min-h-[100px]"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <strong className="block font-black uppercase tracking-wider text-amber-950">
                  What happens next?
                </strong>
                <p>
                  Operations Admin will review your feedback and schedule the crew to return on another day to finish the work.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 min-h-[46px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendFeedback}
                  disabled={isSubmitting || !feedbackText.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-md min-h-[46px] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={16} />
                  <span>{isSubmitting ? 'Sending...' : 'Report Issue to Admin'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUS-11: Cancellation Confirmation Modal */}
        {cancelModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="stitch-card max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleIn">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  Are you sure you want to cancel?
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Cancelling will release your reserved slot for {selectedBooking.appointment_date} ({selectedBooking.time_slot}) and notify our dispatch crew.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle:</span>
                  <span className="font-bold text-slate-800">
                    {selectedBooking.vehicle_make} {selectedBooking.vehicle_model}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Service:</span>
                  <span className="font-bold text-slate-800">{selectedBooking.service?.name}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 min-h-[44px]"
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md min-h-[44px]"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </RoleGuard>
  );
}

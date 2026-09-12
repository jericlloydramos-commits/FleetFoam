'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Service, Booking } from '@/lib/types';
import { mockDb, supabase, isMockMode, generateUUID } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { RoleGuard } from '@/components/auth/RoleGuard';
import {
  Sparkles,
  Car,
  MapPin,
  Calendar,
  CalendarCheck,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  ShieldCheck,
  Check,
  SlidersHorizontal,
  Crosshair,
  Loader2,
} from 'lucide-react';

const TIME_SLOTS = [
  '08:00 AM - 09:30 AM',
  '09:30 AM - 11:00 AM',
  '11:00 AM - 12:30 PM',
  '01:30 PM - 03:00 PM',
  '03:00 PM - 04:30 PM',
  '04:30 PM - 06:00 PM',
];

export default function BookingPage() {
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const services = mockDb.getServices();

  // Form State
  const [selectedService, setSelectedService] = useState<Service | null>(services[0]);
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [serviceLocation, setServiceLocation] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [customerName, setCustomerName] = useState(profile?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (profile?.name) setCustomerName(profile.name);
    if (user?.email) setCustomerEmail(user.email);
  }, [user, profile]);

  // Live GPS Geolocation States (Mindanao & Nationwide)
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsDetectedZone, setGpsDetectedZone] = useState<string | null>(null);

  const handleDetectLiveGPS = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGps(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsLat(latitude);
        setGpsLng(longitude);
        const isMindanao = latitude < 10.0;
        setGpsDetectedZone(isMindanao ? 'MINDANAO' : 'NCR');
        setServiceLocation(
          isMindanao
            ? `Davao / Mindanao Regional Hub (Live GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
            : `Client Premises (Live GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
        );
        setIsDetectingGps(false);
      },
      (err) => {
        setIsDetectingGps(false);
        // Fallback default Mindanao Davao coordinates if hardware GPS unavailable
        setGpsLat(7.1907);
        setGpsLng(125.4578);
        setServiceLocation('J.P. Laurel Ave, Bajada, Davao City, Mindanao (GPS: 7.1907, 125.4578)');
        setGpsDetectedZone('MINDANAO');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Validation & Error States
  const [validationError, setValidationError] = useState<string | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityConflict, setAvailabilityConflict] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // FTC-02 Defense Validation for Step 2
  const validateStep2 = () => {
    if (!vehicleMake.trim() || !vehicleModel.trim() || !vehiclePlate.trim()) {
      setValidationError(
        'FTC-02 Alert: Vehicle Make, Model, and License Plate are mandatory before proceeding to Step 3.'
      );
      return false;
    }
    setValidationError(null);
    return true;
  };

  // FTC-01 Conflict Detection check for Step 4
  const checkSlotAvailability = async (slot: string) => {
    setSelectedTimeSlot(slot);
    setAvailabilityConflict(null);
    setCheckingAvailability(true);

    try {
      const res = await fetch(
        `/api/bookings/availability?date=${encodeURIComponent(
          appointmentDate
        )}&time_slot=${encodeURIComponent(slot)}`
      );
      const data = await res.json();

      if (!res.ok || !data.available) {
        setAvailabilityConflict(
          data.message ||
            'FTC-01 Conflict Detected: Selected time slot is already occupied.'
        );
      } else {
        setAvailabilityConflict(null);
      }
    } catch (err) {
      const isAvailable = mockDb.checkAvailability(appointmentDate, slot);
      if (!isAvailable) {
        setAvailabilityConflict(
          'FTC-01 Conflict Detected: Selected time slot is occupied by an existing job.'
        );
      } else {
        setAvailabilityConflict(null);
      }
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleNextStep = async () => {
    setValidationError(null);

    // Step 1 Validation
    if (currentStep === 1 && !selectedService) {
      setValidationError('Please select a detailing service package.');
      return;
    }

    // Step 2 FTC-02 Validation
    if (currentStep === 2) {
      if (!validateStep2()) return;
    }

    // Step 3 Location Validation
    if (currentStep === 3) {
      if (!serviceLocation.trim()) {
        setValidationError('Please enter a valid service location address.');
        return;
      }
    }

    // Step 4 Date & Slot Validation (FTC-01 Check)
    if (currentStep === 4) {
      if (!appointmentDate || !selectedTimeSlot) {
        setValidationError('Please choose both an appointment date and time slot.');
        return;
      }
      if (availabilityConflict) {
        setValidationError('Cannot proceed: ' + availabilityConflict);
        return;
      }
    }

    // Step 5 Contact Validation
    if (currentStep === 5) {
      if (!customerName.trim() || !customerEmail.trim()) {
        setValidationError('Please provide your full name and email address.');
        return;
      }
    }

    // Step 6 Submit Booking
    if (currentStep === 6) {
      setIsSubmitting(true);
      try {
        const activeCustomerId = user?.id || profile?.id || 'a1111111-1111-1111-1111-111111111111';
        const detectedLat = gpsLat || (serviceLocation.toLowerCase().includes('davao') ? 7.0945 : undefined);
        const detectedLng = gpsLng || (serviceLocation.toLowerCase().includes('davao') ? 125.6120 : undefined);
        const detectedZone = gpsDetectedZone || (serviceLocation.toLowerCase().includes('mindanao') || serviceLocation.toLowerCase().includes('davao') ? 'MINDANAO' : 'BGC_TAGUIG');

        const newBooking = mockDb.addBooking({
          customer_id: activeCustomerId,
          service_id: selectedService!.id,
          vehicle_make: vehicleMake,
          vehicle_model: vehicleModel,
          vehicle_plate: vehiclePlate.toUpperCase(),
          service_location: serviceLocation,
          appointment_date: appointmentDate,
          time_slot: selectedTimeSlot,
          lat: detectedLat,
          lng: detectedLng,
          zone_ph: detectedZone,
        });

        setCreatedBooking(newBooking);
        setCurrentStep(7);
      } catch (err) {
        setValidationError('Failed to create booking. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 7));
  };

  const handlePrevStep = () => {
    setValidationError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const stepTitles = [
    'Service',
    'Vehicle',
    'Location',
    'Schedule',
    'Contact',
    'Review',
    'Confirmed',
  ];

  return (
    <RoleGuard allowedRoles={['CUSTOMER', 'OPERATIONS']}>
      <div className="min-h-screen mesh-bg text-slate-800 flex flex-col font-sans">
        <Header />

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Stitch CUS-01 Customer Hub Sub-Navigation Bar */}
        <header className="w-full bg-white border border-slate-200/80 shadow-xs rounded-2xl mb-5 p-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 rounded-xl border border-sky-100">
              <Car size={18} className="text-sky-600" />
              <span className="text-sm text-sky-950 font-black tracking-tight">FleetFoam Portal</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-200 hidden md:block" />
            <nav className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <button
                type="button"
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
              >
                <CalendarCheck size={14} /> Book a Detail
              </button>
              <Link
                href="/appointments"
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs flex items-center gap-2 transition-all"
              >
                <Calendar size={14} /> My Appointments
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-100 font-extrabold text-[11px]">
              CUS-01 &bull; VIP Fleet Pass
            </span>
          </div>
        </header>

        {/* Stitch CUS-01 Simulation Helper Banner */}
        <div className="w-full mb-6 bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-900 block">
                Customer Flow Interactive Engine (CUS-01 — CUS-08)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Click stepper milestones, test real-time FTC-01 crew conflict algorithms, or view confirmed bookings.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setAppointmentDate(new Date().toISOString().split('T')[0]);
                checkSlotAvailability('09:00 AM - 10:30 AM');
                setCurrentStep(4);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-xs flex items-center gap-1.5 hover:bg-rose-100 transition-colors"
            >
              <AlertCircle size={14} /> Simulate FTC-01 Conflict
            </button>
            <button
              type="button"
              onClick={() => {
                setAvailabilityConflict(null);
                setCurrentStep(4);
              }}
              className="px-3 py-1.5 rounded-xl bg-sky-600 text-white font-extrabold text-xs flex items-center gap-1.5 hover:bg-sky-700 shadow-xs transition-colors"
            >
              <Check size={14} /> Dispatch Valid
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(7)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/70 font-extrabold text-xs hover:bg-slate-200 transition-colors"
            >
              Jump to Confirmation
            </button>
          </div>
        </div>

        {/* Wizard Header Bar */}
        <div className="stitch-card p-6 sm:p-7 mb-8 border border-slate-200/90 shadow-sm bg-white/95 backdrop-blur-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <span className="text-xs font-black text-sky-700 uppercase tracking-widest block">
                Customer Mobile Wash Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                Book Precision Detailing
              </h1>
            </div>
            <div className="text-left sm:text-right bg-sky-50/80 px-4 py-2 rounded-2xl border border-sky-200/70">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Stage {currentStep} of 7</span>
              <div className="text-sm font-extrabold text-sky-800">{stepTitles[currentStep - 1]}</div>
            </div>
          </div>

          {/* 7-Step Horizontal Progress Bar */}
          <div className="grid grid-cols-7 gap-2">
            {stepTitles.map((title, idx) => {
              const stepNum = idx + 1;
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-full h-2.5 rounded-full transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-500 shadow-sm'
                        : isCurrent
                        ? 'bg-sky-600 ring-4 ring-sky-100 shadow-sm'
                        : 'bg-slate-200'
                    }`}
                  />
                  <span
                    className={`text-[11px] truncate font-bold ${
                      isCurrent
                        ? 'text-sky-700'
                        : isCompleted
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {stepNum}. {title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Validation Error Alert */}
        {validationError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-sm">
            <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm font-medium">{validationError}</div>
          </div>
        )}

        {/* Wizard Main Card */}
        <div className="stitch-card p-6 sm:p-8 border border-slate-200 shadow-sm">
          {/* STEP 1: Select Service */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Sparkles className="text-sky-600" /> Select Detailing Package
              </h2>
              <p className="text-slate-500 text-xs mb-6">
                Choose the high-foam eco-wash detailing service for your vehicle.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {services.map((svc) => {
                  const isSelected = selectedService?.id === svc.id;
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => {
                        setSelectedService(svc);
                        setValidationError(null);
                      }}
                      className={`text-left rounded-xl p-5 border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-sky-50/80 border-sky-600 ring-2 ring-sky-500/20 shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-slate-900 text-base">{svc.name}</h3>
                          {isSelected && <Check className="text-sky-600 flex-shrink-0" size={18} />}
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed mb-4">
                          {svc.description}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-200/80 flex justify-between items-center">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={14} /> {svc.duration_min} mins
                        </span>
                        <span className="text-lg font-extrabold text-sky-700">
                          ₱{svc.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Vehicle Details (FTC-02 Guard) */}
          {currentStep === 2 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Car className="text-sky-600" /> Step 2: Vehicle Specifications
                </h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  FTC-02 Guard Active
                </span>
              </div>
              <p className="text-slate-500 text-xs mb-6">
                All fields are strictly mandatory for mobile detailers to bring exact equipment.
              </p>

              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Vehicle Make <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Toyota, Mitsubishi, Ford, BYD"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Vehicle Model <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fortuner GR-S, Montero Sport, Ranger Raptor"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Philippine License Plate Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NDP 4812 or ABC 1234"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm uppercase font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Location (Mindanao & Nationwide) */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                <MapPin className="text-sky-600" /> Step 3: Service Location Address (Mindanao &amp; Nationwide)
              </h2>
              <p className="text-slate-500 text-xs mb-5">
                Specify where our mobile detailing van will park and perform the wash in Mindanao or Metro Manila.
              </p>

              <div className="max-w-lg space-y-4">
                {/* Live GPS Detection Button */}
                <div>
                  <button
                    type="button"
                    onClick={handleDetectLiveGPS}
                    disabled={isDetectingGps}
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer border border-sky-400/30"
                  >
                    {isDetectingGps ? (
                      <Loader2 size={16} className="animate-spin text-white" />
                    ) : (
                      <Crosshair size={16} className="text-white animate-pulse" />
                    )}
                    <span>
                      {isDetectingGps
                        ? 'Pinpointing Hardware GPS...'
                        : '📍 Auto-Detect My Live GPS Location (Mindanao & Nationwide)'}
                    </span>
                  </button>
                  {gpsDetectedZone && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-lg border border-sky-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>GPS Locked: {gpsDetectedZone === 'MINDANAO' ? 'Mindanao Region Hub' : 'Metro Manila Hub'}</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        ({gpsLat?.toFixed(4)}, {gpsLng?.toFixed(4)})
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Service Location Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. J.P. Laurel Ave, Bajada, Davao City or BGC, Taguig City"
                    value={serviceLocation}
                    onChange={(e) => setServiceLocation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm resize-none"
                  />
                </div>

                {/* Mindanao Quick-Picks */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-sky-700 flex items-center gap-1">
                    🏝️ Quick-Pick Mindanao Districts:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Davao City, Mindanao', lat: 7.0945, lng: 125.612 },
                      { name: 'Cagayan de Oro, Mindanao', lat: 8.4542, lng: 124.6319 },
                      { name: 'General Santos City, Mindanao', lat: 6.1164, lng: 125.1716 },
                      { name: 'Zamboanga City, Mindanao', lat: 6.9214, lng: 122.079 },
                      { name: 'Iligan City, Mindanao', lat: 8.228, lng: 124.2452 },
                      { name: 'Butuan City, Mindanao', lat: 8.9475, lng: 125.5406 },
                    ].map((loc) => (
                      <button
                        key={loc.name}
                        type="button"
                        onClick={() => {
                          setServiceLocation(loc.name);
                          setGpsLat(loc.lat);
                          setGpsLng(loc.lng);
                          setGpsDetectedZone('MINDANAO');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-bold border border-sky-200 transition-colors cursor-pointer"
                      >
                        + {loc.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metro Manila Quick-Picks */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500">
                    🏙️ Quick-Pick Metro Manila (NCR) Districts:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'BGC, Taguig City',
                      'Ayala Ave, Makati CBD',
                      'Ortigas Center, Pasig',
                      'Tomas Morato, Quezon City',
                      'Filinvest City, Alabang',
                    ].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setServiceLocation(loc);
                          setGpsDetectedZone('NCR');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                      >
                        + {loc}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="text-sky-600" size={16} />
                  Mobile crew requires 3 feet clearance around vehicle and access to power.
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Date & Time (FTC-01 Conflict Guard) */}
          {currentStep === 4 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="text-sky-600" /> Step 4: Schedule Appointment Slot
                </h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-sky-50 text-sky-800 border border-sky-200">
                  FTC-01 Schedule Guard
                </span>
              </div>
              <p className="text-slate-500 text-xs mb-6">
                Pick your preferred service date and available detail window.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={appointmentDate}
                    onChange={(e) => {
                      setAppointmentDate(e.target.value);
                      if (selectedTimeSlot) checkSlotAvailability(selectedTimeSlot);
                    }}
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Time Window
                  </label>
                  <div className="space-y-2">
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = selectedTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => checkSlotAvailability(slot)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg border text-xs font-semibold transition-all flex justify-between items-center ${
                            isSelected
                              ? 'bg-sky-50 border-sky-600 text-sky-900 ring-2 ring-sky-300'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            {slot}
                          </span>
                          {isSelected && !availabilityConflict && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                              Slot Available
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* FTC-01 Conflict Error Alert */}
              {availabilityConflict && (
                <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3">
                  <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider">FTC-01 Schedule Conflict</h4>
                    <p className="text-xs text-rose-700 mt-0.5">{availabilityConflict}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Contact Info */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                <User className="text-sky-600" /> Step 5: Contact Information
              </h2>
              <p className="text-slate-500 text-xs mb-6">
                Enter contact details for dispatcher &amp; field technician updates.
              </p>

              <div className="max-w-lg space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Special Parking Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Gate code #4490..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Review */}
          {currentStep === 6 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                <CheckCircle2 className="text-sky-600" /> Step 6: Final Order Summary
              </h2>
              <p className="text-slate-500 text-xs mb-6">
                Please verify all detail order specifications before dispatch creation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400">
                    Selected Wash Package
                  </span>
                  <p className="text-lg font-extrabold text-slate-900 mt-1">{selectedService?.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedService?.description}</p>
                  <p className="text-xl font-extrabold text-sky-700 mt-3">
                    ₱{selectedService?.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })} PHP
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-bold uppercase">Vehicle</span>
                    <span className="font-bold text-slate-800">
                      {vehicleMake} {vehicleModel} [{vehiclePlate.toUpperCase()}]
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase">Location</span>
                    <span className="font-bold text-slate-800">{serviceLocation}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase">Schedule</span>
                    <span className="font-bold text-slate-800">
                      {appointmentDate} ({selectedTimeSlot})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Confirmation */}
          {currentStep === 7 && createdBooking && (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-700 shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
                Detail Wash Scheduled!
              </h2>
              <p className="text-slate-500 text-xs max-w-md mx-auto mb-6">
                Your booking reference pass has been registered in the FleetFoam dispatch database.
              </p>

              <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-md mx-auto text-left mb-6 shadow-sm">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Booking Reference ID
                    </span>
                    <span className="font-mono text-xs font-bold text-sky-700">
                      {createdBooking.id}
                    </span>
                  </div>
                  <StatusBadge status={createdBooking.status} size="sm" />
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service:</span>
                    <span className="font-bold text-slate-900">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle:</span>
                    <span className="font-bold text-slate-900">
                      {createdBooking.vehicle_make} {createdBooking.vehicle_model} [
                      {createdBooking.vehicle_plate}]
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Schedule:</span>
                    <span className="font-bold text-slate-900">
                      {createdBooking.appointment_date} ({createdBooking.time_slot})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/appointments"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                >
                  <CalendarCheck size={14} /> View My Appointments →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setCreatedBooking(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm"
                >
                  Book Another Vehicle
                </button>
              </div>
            </div>
          )}

          {/* Action Footer */}
          {currentStep < 7 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1 || isSubmitting}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentStep === 1
                    ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ArrowLeft size={16} /> Back
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={isSubmitting || checkingAvailability}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : currentStep === 6 ? (
                  <span>Confirm &amp; Schedule Dispatch</span>
                ) : (
                  <>
                    <span>Next Step</span> <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
      </div>
    </RoleGuard>
  );
}

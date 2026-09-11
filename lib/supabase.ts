import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Booking, Job, Service, Profile, JobStatus, AppNotification } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-fleetfoam.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

export const isMockMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('mock');

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export const NOTIFICATIONS_CHANGE_EVENT = 'fleetfoam_notifications_updated';

// Guaranteed RFC4122 v4 UUID generator (Postgres strict UUID compatible)
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback if crypto.randomUUID fails
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Initial Mock Services with Philippine Peso (₱ PHP) Pricing
let mockServices: Service[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Express Foam Wash',
    description: 'Exterior high-pressure foam bath, hand shampoo wash, tire gloss, and crystal exterior window polish.',
    duration_min: 45,
    price: 799.00,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Full Fleet Interior & Exterior',
    description: 'Complete exterior foam wash, spray paint sealant, deep interior vacuum, steam sanitation, and leather conditioning.',
    duration_min: 90,
    price: 1899.00,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Ceramic Shield & Engine Bay Detail',
    description: 'Full executive detail, hydrophobic ceramic gloss coating, and comprehensive engine bay degrease.',
    duration_min: 150,
    price: 3499.00,
  },
];

// System Administrator & Operations Profiles (Clean Initial State)
let mockProfiles: Profile[] = [
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    email: 'dispatch@fleetfoam.com',
    name: 'Metro Dispatch Core',
    role: 'OPERATIONS',
    phone: '+63 2 8888 3333',
    status: 'ACTIVE',
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    email: 'ops@fleetfoam.com',
    name: 'Sarah Jenkins (Ops Admin)',
    role: 'OPERATIONS',
    phone: '+63 917 890 0001',
    status: 'ACTIVE',
  },
  {
    id: 'c6666666-6666-6666-6666-666666666666',
    email: 'admin@fleetfoam.com',
    name: 'System Administrator',
    role: 'OPERATIONS',
    phone: '+63 917 800 0000',
    status: 'ACTIVE',
  },
];

// Clean Initial State: No mock bookings or jobs in dispatch queue
let mockBookings: Booking[] = [];
let mockJobs: Job[] = [];

// Helper to sync with localStorage in browser
const STORAGE_KEY_BOOKINGS = 'fleetfoam_mock_bookings_v4';
const STORAGE_KEY_JOBS = 'fleetfoam_mock_jobs_v4';
const STORAGE_KEY_PROFILES = 'fleetfoam_mock_profiles_v3';
const STORAGE_KEY_NOTIFICATIONS = 'fleetfoam_notifications_v2';

let mockNotifications: AppNotification[] = [];

function notifySubscribers() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGE_EVENT));
  }
}

function loadStoredData() {
  if (typeof window !== 'undefined') {
    try {
      // Purge all legacy caches so old mock data never leaks into clean tests
      localStorage.removeItem('fleetfoam_mock_bookings_v2');
      localStorage.removeItem('fleetfoam_mock_jobs_v2');
      localStorage.removeItem('fleetfoam_mock_bookings_v3');
      localStorage.removeItem('fleetfoam_mock_jobs_v3');
      localStorage.removeItem('fleetfoam_mock_profiles_v2');
      localStorage.removeItem('fleetfoam_notifications_v1');
      localStorage.removeItem('fleetfoam_mock_users');

      const storedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (storedProfiles) {
        const parsed = JSON.parse(storedProfiles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          mockProfiles = parsed;
        }
      }
      const storedBookings = localStorage.getItem(STORAGE_KEY_BOOKINGS);
      if (storedBookings) {
        const parsed = JSON.parse(storedBookings);
        if (Array.isArray(parsed)) {
          mockBookings = parsed;
        }
      }
      const storedJobs = localStorage.getItem(STORAGE_KEY_JOBS);
      if (storedJobs) {
        const parsed = JSON.parse(storedJobs);
        if (Array.isArray(parsed)) {
          mockJobs = parsed;
        }
      }
      const storedNotifications = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        if (Array.isArray(parsed)) {
          mockNotifications = parsed;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }
}

function persistStoredData() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(mockProfiles));
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(mockBookings));
      localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(mockJobs));
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(mockNotifications));
    } catch {
      // Ignore write errors
    }
  }
}

loadStoredData();

// Enhanced mockDb with safe deletion, user management, and reassignment
export const mockDb = {
  getServices: () => [...mockServices],

  // Live Sync with Supabase Profiles table
  syncFromSupabase: async (): Promise<Profile[]> => {
    loadStoredData();
    if (!isMockMode) {
      try {
        const { data: dbProfiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbProfiles && !error) {
          // 1. Sync remote Supabase profiles into local mockProfiles
          dbProfiles.forEach((sbP: any) => {
            const existingIdx = mockProfiles.findIndex(
              (p) => p.id === sbP.id || p.email.toLowerCase() === sbP.email.toLowerCase()
            );
            if (existingIdx !== -1) {
              mockProfiles[existingIdx] = {
                ...mockProfiles[existingIdx],
                ...sbP,
                status: mockProfiles[existingIdx].status || 'ACTIVE',
              };
            } else {
              mockProfiles.unshift({
                id: sbP.id,
                email: sbP.email,
                name: sbP.name,
                role: sbP.role,
                phone: sbP.phone || '+63 917 555 0100',
                status: sbP.status || 'ACTIVE',
              });
            }
          });

          // 2. Bidirectional Auto-Push: If any local profile is missing in Supabase, push it up
          const dbEmailSet = new Set(dbProfiles.map((p) => p.email.toLowerCase()));
          for (let i = 0; i < mockProfiles.length; i++) {
            const localP = mockProfiles[i];
            if (!dbEmailSet.has(localP.email.toLowerCase())) {
              const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(localP.id);
              const validId = isUuid ? localP.id : generateUUID();
              localP.id = validId;
              try {
                const { data: pushedRow } = await supabase
                  .from('profiles')
                  .upsert(
                    {
                      id: validId,
                      email: localP.email.toLowerCase().trim(),
                      name: localP.name.trim(),
                      role: localP.role,
                    },
                    { onConflict: 'email' }
                  )
                  .select()
                  .single();

                if (pushedRow) {
                  localP.id = pushedRow.id;
                  dbEmailSet.add(localP.email.toLowerCase());
                }
              } catch (pushErr) {
                console.warn('Could not auto-push local profile to Supabase:', pushErr);
              }
            }
          }

          persistStoredData();
        }
      } catch (err) {
        console.warn('Could not sync mockDb with Supabase:', err);
      }
    }
    return mockDb.getProfiles();
  },

  getProfiles: () => {
    loadStoredData();
    // Compute active jobs count for each profile
    return mockProfiles.map((p) => {
      const activeCount = mockJobs.filter(
        (j) => j.assigned_to === p.id && j.status !== 'COMPLETED' && j.status !== 'CANCELLED'
      ).length;
      return { ...p, active_jobs_count: activeCount };
    });
  },

  getBookings: (customerId?: string, role?: string): Booking[] => {
    loadStoredData();
    if (role === 'OPERATIONS') {
      return [...mockBookings];
    }
    if (customerId) {
      return mockBookings.filter((b) => b.customer_id === customerId);
    }
    return [...mockBookings];
  },

  // FR-06 / CUS-09: Filter bookings strictly by customer ID or email (Operations can see all)
  getBookingsByCustomerId: (customerId: string, role?: string, email?: string): Booking[] => {
    loadStoredData();
    if (role === 'OPERATIONS') {
      return [...mockBookings];
    }
    return mockBookings.filter(
      (b) =>
        (customerId && b.customer_id === customerId) ||
        (email && (b as any).customer_email?.toLowerCase() === email.toLowerCase())
    );
  },

  // Live Sync Bookings from Supabase for a specific customer or fleet dispatcher
  syncBookingsFromSupabase: async (customerId?: string, role?: string): Promise<Booking[]> => {
    loadStoredData();
    if (!isMockMode) {
      try {
        let query = supabase
          .from('bookings')
          .select('*, service:services(*)')
          .order('created_at', { ascending: false });

        // If Customer, only query bookings belonging to their customer_id
        if (role !== 'OPERATIONS' && customerId) {
          query = query.eq('customer_id', customerId);
        }

        const { data: dbBookings, error } = await query;
        if (dbBookings && !error) {
          dbBookings.forEach((sbB: any) => {
            const existingIdx = mockBookings.findIndex((b) => b.id === sbB.id);
            const bookingObj: Booking = {
              id: sbB.id,
              customer_id: sbB.customer_id,
              service_id: sbB.service_id,
              vehicle_make: sbB.vehicle_make,
              vehicle_model: sbB.vehicle_model,
              vehicle_plate: sbB.vehicle_plate,
              service_location: sbB.service_location,
              appointment_date: sbB.appointment_date,
              time_slot: sbB.time_slot,
              status: sbB.status,
              created_at: sbB.created_at,
              service: sbB.service || mockServices.find((s) => s.id === sbB.service_id),
              rating: sbB.rating,
              review: sbB.review,
              rated_at: sbB.rated_at,
              customer_feedback: sbB.customer_feedback,
              revisit_date: sbB.revisit_date,
              revisit_time_slot: sbB.revisit_time_slot,
              revisit_count: sbB.revisit_count,
            };
            if (existingIdx !== -1) {
              mockBookings[existingIdx] = { ...mockBookings[existingIdx], ...bookingObj };
            } else {
              mockBookings.unshift(bookingObj);
            }
          });
          persistStoredData();
        }
      } catch (err) {
        console.warn('Supabase syncBookingsFromSupabase error:', err);
      }
    }
    return mockDb.getBookingsByCustomerId(customerId || '', role);
  },

  getJobs: () => {
    loadStoredData();
    return [...mockJobs];
  },

  checkAvailability: (date: string, timeSlot: string): boolean => {
    loadStoredData();
    return !mockBookings.some(
      (b) => b.appointment_date === date && b.time_slot === timeSlot && b.status !== 'CANCELLED'
    );
  },

  // ─── NOTIFICATION SUBSYSTEM ────────────────────────────────────────────────
  getNotifications: (userId?: string, role?: string, email?: string): AppNotification[] => {
    loadStoredData();
    if (role === 'OPERATIONS') {
      return mockNotifications.filter((n) => n.recipient_role === 'OPERATIONS' || !n.recipient_role);
    }
    if (role === 'CREW') {
      return mockNotifications.filter(
        (n) =>
          (userId && n.recipient_user_id === userId) ||
          (email && n.recipient_email?.toLowerCase() === email.toLowerCase()) ||
          (n.recipient_role === 'CREW' && !n.recipient_user_id)
      );
    }
    if (role === 'CUSTOMER') {
      return mockNotifications.filter(
        (n) =>
          (userId && n.recipient_user_id === userId) ||
          (email && n.recipient_email?.toLowerCase() === email.toLowerCase())
      );
    }
    return [...mockNotifications];
  },

  addNotification: (
    data: Omit<AppNotification, 'id' | 'created_at' | 'read'>
  ): AppNotification => {
    loadStoredData();
    const newNotif: AppNotification = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      read: false,
    };
    mockNotifications.unshift(newNotif);
    persistStoredData();
    notifySubscribers();
    return newNotif;
  },

  markNotificationAsRead: (notificationId: string): void => {
    loadStoredData();
    const target = mockNotifications.find((n) => n.id === notificationId);
    if (target) {
      target.read = true;
      persistStoredData();
      notifySubscribers();
    }
  },

  markAllNotificationsAsRead: (userId?: string, role?: string, email?: string): void => {
    loadStoredData();
    mockNotifications.forEach((n) => {
      if (role === 'OPERATIONS' && (n.recipient_role === 'OPERATIONS' || !n.recipient_role)) {
        n.read = true;
      } else if (
        role === 'CREW' &&
        ((userId && n.recipient_user_id === userId) ||
          (email && n.recipient_email?.toLowerCase() === email.toLowerCase()) ||
          (n.recipient_role === 'CREW' && !n.recipient_user_id))
      ) {
        n.read = true;
      } else if (
        role === 'CUSTOMER' &&
        ((userId && n.recipient_user_id === userId) ||
          (email && n.recipient_email?.toLowerCase() === email.toLowerCase()))
      ) {
        n.read = true;
      }
    });
    persistStoredData();
    notifySubscribers();
  },

  clearNotifications: (): void => {
    mockNotifications = [];
    persistStoredData();
    notifySubscribers();
  },

  addBooking: (bookingData: Omit<Booking, 'id' | 'status'>): Booking => {
    loadStoredData();
    const bookingId = generateUUID();
    const jobId = generateUUID();
    const service = mockServices.find((s) => s.id === bookingData.service_id) || mockServices[0];
    const newBooking: Booking = {
      ...bookingData,
      id: bookingId,
      status: 'SCHEDULED',
      created_at: new Date().toISOString(),
      service,
    };
    mockBookings.unshift(newBooking);

    // Auto-create corresponding Job initially UNASSIGNED so Admin / Operations assigns crew
    const newJob: Job = {
      id: jobId,
      booking_id: newBooking.id,
      assigned_to: undefined,
      status: 'SCHEDULED',
      updated_at: new Date().toISOString(),
      lat: newBooking.lat || 14.5505,
      lng: newBooking.lng || 121.0494,
      current_location_ph: newBooking.service_location,
      eta_minutes: 15,
      booking: newBooking,
      assignee: undefined,
    };
    mockJobs.unshift(newJob);

    // ─── EVENT 1: Notify Admin / Operations on new booking ──────────────────
    mockNotifications.unshift({
      id: generateUUID(),
      recipient_role: 'OPERATIONS',
      title: 'New Booking Received',
      message: `Customer scheduled ${newBooking.vehicle_make} ${newBooking.vehicle_model} (${newBooking.vehicle_plate}) at ${newBooking.service_location} on ${newBooking.appointment_date} (${newBooking.time_slot}). Pending crew assignment.`,
      type: 'BOOKING_CREATED',
      job_id: jobId,
      booking_id: bookingId,
      created_at: new Date().toISOString(),
      read: false,
    });

    persistStoredData();
    notifySubscribers();

    // Async sync with Supabase
    if (!isMockMode) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        bookingData.customer_id || ''
      );
      const validCustomerId = isUuid ? bookingData.customer_id : 'a1111111-1111-1111-1111-111111111111';

      supabase
        .from('bookings')
        .insert({
          id: bookingId,
          customer_id: validCustomerId,
          service_id: bookingData.service_id,
          vehicle_make: bookingData.vehicle_make,
          vehicle_model: bookingData.vehicle_model,
          vehicle_plate: bookingData.vehicle_plate,
          service_location: bookingData.service_location,
          appointment_date: bookingData.appointment_date,
          time_slot: bookingData.time_slot,
          status: 'SCHEDULED',
        })
        .then(() => {
          supabase
            .from('jobs')
            .insert({
              id: jobId,
              booking_id: bookingId,
              assigned_to: null,
              status: 'SCHEDULED',
              lat: newBooking.lat || 14.5505,
              lng: newBooking.lng || 121.0494,
            })
            .then();
        });
    }

    return newBooking;
  },

  updateJobStatus: (jobId: string, newStatus: JobStatus, fallbackData?: Partial<Job>): Job => {
    loadStoredData();
    let jobIndex = mockJobs.findIndex((j) => j.id === jobId);

    if (jobIndex === -1) {
      const crewMember = mockProfiles.find((p) => p.role === 'CREW') || mockProfiles[2];
      const newJob: Job = {
        id: jobId,
        booking_id: fallbackData?.booking_id || 'book-' + jobId,
        assigned_to: fallbackData?.assigned_to || crewMember.id,
        status: newStatus,
        updated_at: new Date().toISOString(),
        booking: fallbackData?.booking || {
          id: fallbackData?.booking_id || 'book-' + jobId,
          customer_id: 'a1111111-1111-1111-1111-111111111111',
          service_id: mockServices[0].id,
          vehicle_make: fallbackData?.booking?.vehicle_make || 'Toyota',
          vehicle_model: fallbackData?.booking?.vehicle_model || 'Fortuner',
          vehicle_plate: fallbackData?.booking?.vehicle_plate || 'NDP 4812',
          service_location: fallbackData?.booking?.service_location || 'BGC, Taguig City',
          appointment_date: new Date().toISOString().split('T')[0],
          time_slot: '09:00 AM - 10:30 AM',
          status: newStatus,
          service: mockServices[0],
        },
        assignee: crewMember,
      };
      mockJobs.unshift(newJob);
      jobIndex = 0;
    } else {
      mockJobs[jobIndex].status = newStatus;
      mockJobs[jobIndex].updated_at = new Date().toISOString();
    }

    const bookingIndex = mockBookings.findIndex((b) => b.id === mockJobs[jobIndex].booking_id);
    if (bookingIndex !== -1) {
      mockBookings[bookingIndex].status = newStatus;
      mockJobs[jobIndex].booking = mockBookings[bookingIndex];
    }

    // ─── EVENT 3: Crew submits for customer inspection & approval ───────────
    if (newStatus === 'AWAITING_APPROVAL') {
      const pendingJob = mockJobs[jobIndex];
      const booking = pendingJob.booking || mockBookings.find((b) => b.id === pendingJob.booking_id);
      const crewName = pendingJob.assignee?.name || 'Assigned Specialist';

      // 1. Notify Customer to inspect & approve/feedback
      if (booking?.customer_id) {
        mockNotifications.unshift({
          id: generateUUID(),
          recipient_user_id: booking.customer_id,
          recipient_role: 'CUSTOMER',
          title: 'Service Finished - Please Inspect & Approve',
          message: `Specialist ${crewName} has finished detailing your ${booking.vehicle_make} ${booking.vehicle_model} [${booking.vehicle_plate}]. Please inspect your vehicle and approve the work or send feedback.`,
          type: 'SERVICE_AWAITING_APPROVAL',
          job_id: jobId,
          booking_id: pendingJob.booking_id,
          crew_name: crewName,
          created_at: new Date().toISOString(),
          read: false,
        });
      }

      // 2. Notify Operations
      mockNotifications.unshift({
        id: generateUUID(),
        recipient_role: 'OPERATIONS',
        title: 'Detailing Awaiting Customer Sign-off',
        message: `Specialist ${crewName} finished detailing order #${jobId.substring(0, 8)} (${booking?.vehicle_make} ${booking?.vehicle_model}). Awaiting customer inspection and approval.`,
        type: 'SERVICE_AWAITING_APPROVAL',
        job_id: jobId,
        booking_id: pendingJob.booking_id,
        crew_name: crewName,
        created_at: new Date().toISOString(),
        read: false,
      });
    }

    // ─── EVENT 4: When completed, notify BOTH Admin and Customer ─────────────
    if (newStatus === 'COMPLETED') {
      const completedJob = mockJobs[jobIndex];
      const booking = completedJob.booking || mockBookings.find((b) => b.id === completedJob.booking_id);
      const crewName = completedJob.assignee?.name || 'Assigned Crew';

      // 1. Notify Admin / Operations
      mockNotifications.unshift({
        id: generateUUID(),
        recipient_role: 'OPERATIONS',
        title: 'Service Completed',
        message: `Crew ${crewName} has completed vehicle detail for ${booking?.vehicle_make || 'Vehicle'} ${booking?.vehicle_model || ''} [${booking?.vehicle_plate || 'N/A'}].`,
        type: 'JOB_COMPLETED_ADMIN',
        job_id: jobId,
        booking_id: completedJob.booking_id,
        crew_name: crewName,
        created_at: new Date().toISOString(),
        read: false,
      });

      // 2. Simultaneously notify Customer
      if (booking?.customer_id) {
        mockNotifications.unshift({
          id: generateUUID(),
          recipient_user_id: booking.customer_id,
          recipient_role: 'CUSTOMER',
          title: 'Service Completed!',
          message: `Your vehicle ${booking.vehicle_make} ${booking.vehicle_model} [${booking.vehicle_plate}] is sparkling clean! Your service was completed by ${crewName}. Thank you for choosing FleetFoam!`,
          type: 'JOB_COMPLETED_CUSTOMER',
          job_id: jobId,
          booking_id: completedJob.booking_id,
          crew_name: crewName,
          created_at: new Date().toISOString(),
          read: false,
        });
      }
    }

    persistStoredData();
    notifySubscribers();

    // Async sync to Supabase
    if (!isMockMode) {
      supabase.from('jobs').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', jobId).then();
      if (mockJobs[jobIndex].booking_id) {
        supabase.from('bookings').update({ status: newStatus }).eq('id', mockJobs[jobIndex].booking_id).then();
      }
    }

    return mockJobs[jobIndex];
  },

  // ─── EVENT 2: Admin assigns crew -> Notify Crew & Customer ─────────────────
  assignCrew: (jobId: string, crewId: string): Job | null => {
    loadStoredData();
    const jobIndex = mockJobs.findIndex((j) => j.id === jobId);
    if (jobIndex === -1) return null;
    if (mockJobs[jobIndex].status === 'COMPLETED') return mockJobs[jobIndex];

    const crew = mockProfiles.find((p) => p.id === crewId);
    mockJobs[jobIndex].assigned_to = crewId || undefined;
    mockJobs[jobIndex].assignee = crew;
    mockJobs[jobIndex].updated_at = new Date().toISOString();

    const job = mockJobs[jobIndex];
    const booking = job.booking || mockBookings.find((b) => b.id === job.booking_id);

    if (crew) {
      // 1. Notify Crew Member about new task
      mockNotifications.unshift({
        id: generateUUID(),
        recipient_user_id: crew.id,
        recipient_email: crew.email,
        recipient_role: 'CREW',
        title: 'New Task Assigned',
        message: `You have been assigned to detail ${booking?.vehicle_make || 'Vehicle'} ${booking?.vehicle_model || ''} [${booking?.vehicle_plate || 'N/A'}] at ${booking?.service_location || 'Designated Location'} on ${booking?.appointment_date || 'Scheduled Date'} (${booking?.time_slot || 'Window'}).`,
        type: 'CREW_ASSIGNED',
        job_id: jobId,
        booking_id: job.booking_id,
        crew_name: crew.name,
        created_at: new Date().toISOString(),
        read: false,
      });

      // 2. Simultaneously notify Customer that appointment was accepted by this crew member
      if (booking?.customer_id) {
        mockNotifications.unshift({
          id: generateUUID(),
          recipient_user_id: booking.customer_id,
          recipient_role: 'CUSTOMER',
          title: 'Appointment Accepted!',
          message: `Your mobile detailing appointment for ${booking.vehicle_make} ${booking.vehicle_model} [${booking.vehicle_plate}] has been accepted and assigned to Detail Specialist ${crew.name}.`,
          type: 'CUSTOMER_ACCEPTED',
          job_id: jobId,
          booking_id: job.booking_id,
          crew_name: crew.name,
          created_at: new Date().toISOString(),
          read: false,
        });
      }
    }

    persistStoredData();
    notifySubscribers();

    if (!isMockMode) {
      supabase
        .from('jobs')
        .update({ assigned_to: crewId || null, updated_at: new Date().toISOString() })
        .eq('id', jobId)
        .then();
    }

    return mockJobs[jobIndex];
  },

  // ─── CREW CLAIM REQUEST WORKFLOW ──────────────────────────────────────────
  getUnassignedJobs: (): Job[] => {
    loadStoredData();
    return mockJobs.filter((j) => !j.assigned_to && j.status !== 'CANCELLED');
  },

  requestJobClaim: (jobId: string, crewId: string): { success: boolean; error?: string } => {
    loadStoredData();
    const job = mockJobs.find((j) => j.id === jobId);
    if (!job) return { success: false, error: 'Job not found' };
    if (job.assigned_to) return { success: false, error: 'Job has already been assigned' };

    const crew = mockProfiles.find((p) => p.id === crewId);
    if (!crew) return { success: false, error: 'Crew profile not found' };

    job.claim_requested_by = crewId;
    job.claim_requester = crew;
    job.claim_status = 'PENDING';
    job.claim_requested_at = new Date().toISOString();

    const booking = job.booking || mockBookings.find((b) => b.id === job.booking_id);

    // Notify Operations Dispatcher that this crew member wants to claim the job
    mockNotifications.unshift({
      id: generateUUID(),
      recipient_role: 'OPERATIONS',
      title: 'Job Claim Request',
      message: `Specialist ${crew.name} requested to claim order #${jobId.substring(0, 8)} (${booking?.vehicle_make || 'Vehicle'} ${booking?.vehicle_model || ''} - ${booking?.service_location || ''}). Review and accept or deny.`,
      type: 'CREW_CLAIM_REQUESTED',
      job_id: jobId,
      booking_id: job.booking_id,
      crew_name: crew.name,
      created_at: new Date().toISOString(),
      read: false,
    });

    persistStoredData();
    notifySubscribers();

    return { success: true };
  },

  acceptJobClaim: (jobId: string): { success: boolean; error?: string; job?: Job } => {
    loadStoredData();
    const job = mockJobs.find((j) => j.id === jobId);
    if (!job) return { success: false, error: 'Job not found' };
    if (!job.claim_requested_by) return { success: false, error: 'No claim request found for this job' };

    const crewId = job.claim_requested_by;
    const crew = job.claim_requester || mockProfiles.find((p) => p.id === crewId);
    const booking = job.booking || mockBookings.find((b) => b.id === job.booking_id);

    // 1. Assign crew
    job.assigned_to = crewId;
    job.assignee = crew;
    job.claim_status = 'ACCEPTED';
    job.updated_at = new Date().toISOString();

    // 2. Notify Crew member that their claim was accepted
    if (crew) {
      mockNotifications.unshift({
        id: generateUUID(),
        recipient_user_id: crew.id,
        recipient_email: crew.email,
        recipient_role: 'CREW',
        title: 'Claim Request Accepted!',
        message: `Operations approved your claim request for order #${jobId.substring(0, 8)} (${booking?.vehicle_make || 'Vehicle'} ${booking?.vehicle_model || ''}). You can now start this detailing appointment.`,
        type: 'CREW_CLAIM_ACCEPTED',
        job_id: jobId,
        booking_id: job.booking_id,
        crew_name: crew.name,
        created_at: new Date().toISOString(),
        read: false,
      });
    }

    // 3. Notify Customer that appointment was accepted by this crew member
    if (booking?.customer_id && crew) {
      mockNotifications.unshift({
        id: generateUUID(),
        recipient_user_id: booking.customer_id,
        recipient_role: 'CUSTOMER',
        title: 'Appointment Accepted!',
        message: `Your mobile detailing appointment for ${booking.vehicle_make} ${booking.vehicle_model} [${booking.vehicle_plate}] has been accepted and assigned to Detail Specialist ${crew.name}.`,
        type: 'CUSTOMER_ACCEPTED',
        job_id: jobId,
        booking_id: job.booking_id,
        crew_name: crew.name,
        created_at: new Date().toISOString(),
        read: false,
      });
    }

    persistStoredData();
    notifySubscribers();

    if (!isMockMode) {
      supabase
        .from('jobs')
        .update({ assigned_to: crewId, updated_at: new Date().toISOString() })
        .eq('id', jobId)
        .then();
    }

    return { success: true, job };
  },

  denyJobClaim: (jobId: string): { success: boolean; error?: string } => {
    loadStoredData();
    const job = mockJobs.find((j) => j.id === jobId);
    if (!job) return { success: false, error: 'Job not found' };

    const crew = job.claim_requester || (job.claim_requested_by ? mockProfiles.find((p) => p.id === job.claim_requested_by) : null);
    const booking = job.booking || mockBookings.find((b) => b.id === job.booking_id);

    // Notify Crew member that claim was denied
    if (crew) {
      mockNotifications.unshift({
        id: generateUUID(),
        recipient_user_id: crew.id,
        recipient_email: crew.email,
        recipient_role: 'CREW',
        title: 'Claim Request Declined',
        message: `Operations declined your claim request for order #${jobId.substring(0, 8)} (${booking?.vehicle_make || 'Vehicle'} ${booking?.vehicle_model || ''}). Please wait for dispatch to assign you a job.`,
        type: 'CREW_CLAIM_DENIED',
        job_id: jobId,
        booking_id: job.booking_id,
        crew_name: crew.name,
        created_at: new Date().toISOString(),
        read: false,
      });
    }

    // Reset claim fields so the job remains unassigned for manual assignment
    job.claim_requested_by = undefined;
    job.claim_requester = undefined;
    job.claim_status = 'DENIED';
    job.assigned_to = undefined;
    job.assignee = undefined;
    job.updated_at = new Date().toISOString();

    persistStoredData();
    notifySubscribers();

    return { success: true };
  },

  // ─── CUSTOMER APPROVAL, DISSATISFACTION & RATING SYSTEM ───────────────────

  // Customer clicks "Approve" to mark service as completed
  approveJob: (jobId: string): { success: boolean; error?: string; job?: Job } => {
    loadStoredData();
    let jobIndex = mockJobs.findIndex((j) => j.id === jobId || j.booking_id === jobId);
    if (jobIndex === -1) {
      const bookingIdx = mockBookings.findIndex((b) => b.id === jobId);
      if (bookingIdx !== -1) {
        const newJob: Job = {
          id: generateUUID(),
          booking_id: mockBookings[bookingIdx].id,
          booking: mockBookings[bookingIdx],
          status: 'COMPLETED',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockJobs.unshift(newJob);
        jobIndex = 0;
      } else {
        return { success: false, error: 'Job not found' };
      }
    }

    const job = mockJobs[jobIndex];
    const now = new Date().toISOString();

    job.status = 'COMPLETED';
    job.updated_at = now;

    const bookingIndex = mockBookings.findIndex((b) => b.id === job.booking_id);
    if (bookingIndex !== -1) {
      mockBookings[bookingIndex].status = 'COMPLETED';
      job.booking = mockBookings[bookingIndex];
    }

    const booking = job.booking || mockBookings[bookingIndex];
    const crewName = job.assignee?.name || 'Detail Specialist';

    // 1. Notify Operations Dispatch
    mockNotifications.unshift({
      id: generateUUID(),
      recipient_role: 'OPERATIONS',
      title: 'Customer Approved Service',
      message: `Customer approved detailing for ${booking?.vehicle_make || 'Vehicle'} ${booking?.vehicle_model || ''} [${booking?.vehicle_plate || 'N/A'}]. Service marked completed.`,
      type: 'JOB_COMPLETED_ADMIN',
      job_id: jobId,
      booking_id: job.booking_id,
      crew_name: crewName,
      created_at: now,
      read: false,
    });

    // 2. Notify Crew Member that customer approved
    if (job.assigned_to) {
      mockNotifications.unshift({
        id: generateUUID(),
        recipient_user_id: job.assigned_to,
        recipient_role: 'CREW',
        title: 'Customer Approved Your Work! 🎉',
        message: `Customer inspected and approved your detailing on ${booking?.vehicle_make || 'Vehicle'} ${booking?.vehicle_model || ''}. Job marked completed!`,
        type: 'JOB_COMPLETED_CUSTOMER',
        job_id: jobId,
        booking_id: job.booking_id,
        crew_name: crewName,
        created_at: now,
        read: false,
      });
    }

    persistStoredData();
    notifySubscribers();

    if (!isMockMode) {
      supabase
        .from('jobs')
        .update({ status: 'COMPLETED', updated_at: now })
        .eq('id', jobId)
        .then();
      if (job.booking_id) {
        supabase
          .from('bookings')
          .update({ status: 'COMPLETED' })
          .eq('id', job.booking_id)
          .then();
      }
    }

    return { success: true, job };
  },

  // Customer rates the completed job right after approval or from history
  rateCompletedJob: (
    jobId: string,
    rating: number,
    review?: string
  ): { success: boolean; error?: string; job?: Job } => {
    loadStoredData();
    let jobIndex = mockJobs.findIndex((j) => j.id === jobId || j.booking_id === jobId);
    if (jobIndex === -1) return { success: false, error: 'Job not found' };

    const job = mockJobs[jobIndex];
    const now = new Date().toISOString();

    job.rating = rating;
    job.review = review;
    job.rated_at = now;
    job.updated_at = now;

    const bookingIndex = mockBookings.findIndex((b) => b.id === job.booking_id);
    if (bookingIndex !== -1) {
      mockBookings[bookingIndex].rating = rating;
      mockBookings[bookingIndex].review = review;
      mockBookings[bookingIndex].rated_at = now;
      job.booking = mockBookings[bookingIndex];
    }

    const booking = job.booking || mockBookings[bookingIndex];
    const crewName = job.assignee?.name || 'Detail Specialist';

    mockNotifications.unshift({
      id: generateUUID(),
      recipient_role: 'OPERATIONS',
      title: 'Customer Rated Specialist Work ⭐',
      message: `Customer submitted a ${rating}/5 star rating for ${booking?.vehicle_make || 'Vehicle'} ${booking?.vehicle_model || ''}. Review: "${review || 'Great job!'}"`,
      type: 'CUSTOMER_APPROVED_RATED',
      job_id: jobId,
      booking_id: job.booking_id,
      crew_name: crewName,
      rating,
      created_at: now,
      read: false,
    });

    if (job.assigned_to) {
      mockNotifications.unshift({
        id: generateUUID(),
        recipient_user_id: job.assigned_to,
        recipient_role: 'CREW',
        title: 'New Star Rating Received! ⭐',
        message: `You received a ${rating}/5 star rating for your detailing work! Review: "${review || 'Satisfied customer!'}"`,
        type: 'CUSTOMER_APPROVED_RATED',
        job_id: jobId,
        booking_id: job.booking_id,
        crew_name: crewName,
        rating,
        created_at: now,
        read: false,
      });
    }

    persistStoredData();
    notifySubscribers();

    if (!isMockMode) {
      supabase
        .from('jobs')
        .update({ rating, review, rated_at: now, updated_at: now })
        .eq('id', jobId)
        .then();
      if (job.booking_id) {
        supabase
          .from('bookings')
          .update({ rating, review, rated_at: now })
          .eq('id', job.booking_id)
          .then();
      }
    }

    return { success: true, job };
  },

  // Customer approves service and submits 1–5 star rating + review in one step
  approveAndRateJob: (
    jobId: string,
    rating: number,
    review?: string
  ): { success: boolean; error?: string; job?: Job } => {
    let jobIndex = mockJobs.findIndex((j) => j.id === jobId || j.booking_id === jobId);
    if (jobIndex === -1) {
      const bookingIdx = mockBookings.findIndex((b) => b.id === jobId);
      if (bookingIdx !== -1) {
        const newJob: Job = {
          id: generateUUID(),
          booking_id: mockBookings[bookingIdx].id,
          booking: mockBookings[bookingIdx],
          status: 'COMPLETED',
          rating,
          review,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockJobs.unshift(newJob);
        jobIndex = 0;
      } else {
        return { success: false, error: 'Job not found' };
      }
    }

    const job = mockJobs[jobIndex];
    const now = new Date().toISOString();

    job.status = 'COMPLETED';
    job.rating = rating;
    job.review = review;
    job.rated_at = now;
    job.updated_at = now;

    const bookingIndex = mockBookings.findIndex((b) => b.id === job.booking_id);
    if (bookingIndex !== -1) {
      mockBookings[bookingIndex].status = 'COMPLETED';
      mockBookings[bookingIndex].rating = rating;
      mockBookings[bookingIndex].review = review;
      mockBookings[bookingIndex].rated_at = now;
      job.booking = mockBookings[bookingIndex];
    }

    const booking = job.booking || mockBookings[bookingIndex];
    const crewName = job.assignee?.name || 'Detail Specialist';

    // 1. Notify Operations Dispatch
    mockNotifications.unshift({
      id: generateUUID(),
      recipient_role: 'OPERATIONS',
      title: 'Customer Approved & Rated Service',
      message: `Customer approved detailing for ${booking?.vehicle_make || 'Vehicle'} ${booking?.vehicle_model || ''} [${booking?.vehicle_plate || 'N/A'}] with a ${rating}/5 star rating! Review: "${review || 'Satisfied with the service.'}"`,
      type: 'CUSTOMER_APPROVED_RATED',
      job_id: jobId,
      booking_id: job.booking_id,
      crew_name: crewName,
      rating,
      created_at: now,
      read: false,
    });

    // 2. Notify Crew Member with praise & rating
    if (job.assigned_to) {
      mockNotifications.unshift({
        id: generateUUID(),
        recipient_user_id: job.assigned_to,
        recipient_role: 'CREW',
        title: 'Customer Approved Your Work! ⭐',
        message: `Customer inspected and approved your detailing on ${booking?.vehicle_make || 'Vehicle'} ${booking?.vehicle_model || ''} with ${rating}/5 stars! Review: "${review || 'Great work!'}"`,
        type: 'CUSTOMER_APPROVED_RATED',
        job_id: jobId,
        booking_id: job.booking_id,
        crew_name: crewName,
        rating,
        created_at: now,
        read: false,
      });
    }

    persistStoredData();
    notifySubscribers();

    // Async sync to Supabase
    if (!isMockMode) {
      supabase
        .from('jobs')
        .update({ status: 'COMPLETED', rating, review, rated_at: now, updated_at: now })
        .eq('id', jobId)
        .then();
      if (job.booking_id) {
        supabase
          .from('bookings')
          .update({ status: 'COMPLETED', rating, review, rated_at: now })
          .eq('id', job.booking_id)
          .then();
      }
    }

    return { success: true, job };
  },

  // Customer is unsatisfied and sends feedback to admin for a follow-up revisit
  rejectJobWithFeedback: (
    jobId: string,
    feedback: string
  ): { success: boolean; error?: string; job?: Job } => {
    loadStoredData();
    let jobIndex = mockJobs.findIndex((j) => j.id === jobId || j.booking_id === jobId);
    if (jobIndex === -1) {
      const bookingIdx = mockBookings.findIndex((b) => b.id === jobId);
      if (bookingIdx !== -1) {
        const newJob: Job = {
          id: generateUUID(),
          booking_id: mockBookings[bookingIdx].id,
          booking: mockBookings[bookingIdx],
          status: 'NEEDS_REVISIT',
          customer_feedback: feedback,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockJobs.unshift(newJob);
        jobIndex = 0;
      } else {
        return { success: false, error: 'Job not found' };
      }
    }

    const job = mockJobs[jobIndex];
    const now = new Date().toISOString();

    job.status = 'NEEDS_REVISIT';
    job.customer_feedback = feedback;
    job.updated_at = now;

    const bookingIndex = mockBookings.findIndex((b) => b.id === job.booking_id);
    if (bookingIndex !== -1) {
      mockBookings[bookingIndex].status = 'NEEDS_REVISIT';
      mockBookings[bookingIndex].customer_feedback = feedback;
      job.booking = mockBookings[bookingIndex];
    }

    const booking = job.booking || mockBookings[bookingIndex];
    const crewName = job.assignee?.name || 'Detail Specialist';

    // 1. Notify Operations Dispatch of Dissatisfaction and Revisit Need
    mockNotifications.unshift({
      id: generateUUID(),
      recipient_role: 'OPERATIONS',
      title: 'Customer Unsatisfied - Revisit Required ⚠️',
      message: `Customer reported an issue for order #${jobId.substring(0, 8)} (${booking?.vehicle_make} ${booking?.vehicle_model} [${booking?.vehicle_plate}]): "${feedback}". Action required: Schedule another day for ${crewName} to return and finish.`,
      type: 'CUSTOMER_DISSATISFIED',
      job_id: jobId,
      booking_id: job.booking_id,
      crew_name: crewName,
      created_at: now,
      read: false,
    });

    // 2. Notify Crew Member about customer feedback
    if (job.assigned_to) {
      mockNotifications.unshift({
        id: generateUUID(),
        recipient_user_id: job.assigned_to,
        recipient_role: 'CREW',
        title: 'Customer Touch-up Requested ⚠️',
        message: `Customer reported feedback for order #${jobId.substring(0, 8)}: "${feedback}". Operations will schedule another day for you to return and finish the job.`,
        type: 'CUSTOMER_DISSATISFIED',
        job_id: jobId,
        booking_id: job.booking_id,
        crew_name: crewName,
        created_at: now,
        read: false,
      });
    }

    persistStoredData();
    notifySubscribers();

    // Async sync to Supabase
    if (!isMockMode) {
      supabase
        .from('jobs')
        .update({ status: 'NEEDS_REVISIT', customer_feedback: feedback, updated_at: now })
        .eq('id', jobId)
        .then();
      if (job.booking_id) {
        supabase
          .from('bookings')
          .update({ status: 'NEEDS_REVISIT', customer_feedback: feedback })
          .eq('id', job.booking_id)
          .then();
      }
    }

    return { success: true, job };
  },

  // Admin schedules another day for the crew member to return and finish the job
  rescheduleFollowup: (
    jobId: string,
    newDate: string,
    newTimeSlot: string,
    crewId?: string
  ): { success: boolean; error?: string; job?: Job } => {
    loadStoredData();
    const jobIndex = mockJobs.findIndex((j) => j.id === jobId);
    if (jobIndex === -1) return { success: false, error: 'Job not found' };

    const job = mockJobs[jobIndex];
    const now = new Date().toISOString();

    // Target crew (defaults to original specialist)
    const targetCrewId = crewId || job.assigned_to;
    const targetCrew = targetCrewId ? mockProfiles.find((p) => p.id === targetCrewId) : job.assignee;

    job.status = 'SCHEDULED';
    job.revisit_date = newDate;
    job.revisit_time_slot = newTimeSlot;
    job.revisit_count = (job.revisit_count || 0) + 1;
    job.assigned_to = targetCrewId;
    job.assignee = targetCrew;
    job.updated_at = now;

    const bookingIndex = mockBookings.findIndex((b) => b.id === job.booking_id);
    if (bookingIndex !== -1) {
      mockBookings[bookingIndex].appointment_date = newDate;
      mockBookings[bookingIndex].time_slot = newTimeSlot;
      mockBookings[bookingIndex].status = 'SCHEDULED';
      mockBookings[bookingIndex].revisit_date = newDate;
      mockBookings[bookingIndex].revisit_time_slot = newTimeSlot;
      mockBookings[bookingIndex].revisit_count = (mockBookings[bookingIndex].revisit_count || 0) + 1;
      job.booking = mockBookings[bookingIndex];
    }

    const booking = job.booking || mockBookings[bookingIndex];
    const crewName = targetCrew?.name || 'Detail Specialist';

    // 1. Notify Customer that follow-up day was scheduled
    if (booking?.customer_id) {
      mockNotifications.unshift({
        id: generateUUID(),
        recipient_user_id: booking.customer_id,
        recipient_role: 'CUSTOMER',
        title: 'Follow-up Detailing Scheduled! 📅',
        message: `Operations has scheduled specialist ${crewName} to return on ${newDate} (${newTimeSlot}) to complete detailing for your ${booking?.vehicle_make} ${booking?.vehicle_model} [${booking?.vehicle_plate}].`,
        type: 'FOLLOWUP_RESCHEDULED',
        job_id: jobId,
        booking_id: job.booking_id,
        crew_name: crewName,
        created_at: now,
        read: false,
      });
    }

    // 2. Notify Crew Specialist of the return visit
    if (targetCrewId) {
      mockNotifications.unshift({
        id: generateUUID(),
        recipient_user_id: targetCrewId,
        recipient_role: 'CREW',
        title: 'Follow-up Visit Scheduled 📅',
        message: `Admin scheduled you to return to detail ${booking?.vehicle_make} ${booking?.vehicle_model} at ${booking?.service_location} on ${newDate} (${newTimeSlot}) to address customer feedback.`,
        type: 'FOLLOWUP_RESCHEDULED',
        job_id: jobId,
        booking_id: job.booking_id,
        crew_name: crewName,
        created_at: now,
        read: false,
      });
    }

    persistStoredData();
    notifySubscribers();

    // Async sync to Supabase
    if (!isMockMode) {
      supabase
        .from('jobs')
        .update({
          status: 'SCHEDULED',
          revisit_date: newDate,
          revisit_time_slot: newTimeSlot,
          revisit_count: job.revisit_count,
          assigned_to: targetCrewId,
          updated_at: now,
        })
        .eq('id', jobId)
        .then();
      if (job.booking_id) {
        supabase
          .from('bookings')
          .update({
            status: 'SCHEDULED',
            appointment_date: newDate,
            time_slot: newTimeSlot,
            revisit_date: newDate,
            revisit_time_slot: newTimeSlot,
            revisit_count: job.revisit_count,
          })
          .eq('id', job.booking_id)
          .then();
      }
    }

    return { success: true, job };
  },

  // ─── NEW: Safe User Deletion with Reassignment ──────────────────────────────
  deleteProfile: (profileId: string, reassignToCrewId?: string): { success: boolean; affectedJobs: number } => {
    loadStoredData();
    const targetProfile = mockProfiles.find((p) => p.id === profileId);
    if (!targetProfile) return { success: false, affectedJobs: 0 };

    let affectedJobs = 0;

    if (targetProfile.role === 'CREW') {
      // Find all active/scheduled jobs assigned to this crew member
      const newAssignee = reassignToCrewId ? mockProfiles.find((p) => p.id === reassignToCrewId) : undefined;
      mockJobs.forEach((job) => {
        if (job.assigned_to === profileId) {
          job.assigned_to = reassignToCrewId || undefined;
          job.assignee = newAssignee;
          job.updated_at = new Date().toISOString();
          affectedJobs++;
        }
      });
    } else if (targetProfile.role === 'CUSTOMER') {
      // Safe unlink per ON DELETE SET NULL
      mockBookings.forEach((b) => {
        if (b.customer_id === profileId) {
          b.customer_id = undefined;
          affectedJobs++;
        }
      });
    }

    // Remove profile from list
    mockProfiles = mockProfiles.filter((p) => p.id !== profileId);
    persistStoredData();

    // Async sync with Supabase
    if (!isMockMode) {
      if (targetProfile.role === 'CREW') {
        supabase.from('jobs').update({ assigned_to: reassignToCrewId || null }).eq('assigned_to', profileId).then();
      } else {
        supabase.from('bookings').update({ customer_id: null }).eq('customer_id', profileId).then();
      }
      supabase.from('profiles').delete().eq('id', profileId).then();
    }

    return { success: true, affectedJobs };
  },

  deleteProfileAsync: async (profileId: string, reassignToCrewId?: string) => {
    loadStoredData();
    if (!isMockMode) {
      try {
        const targetProfile = mockProfiles.find((p) => p.id === profileId);
        if (targetProfile?.role === 'CREW') {
          await supabase.from('jobs').update({ assigned_to: reassignToCrewId || null }).eq('assigned_to', profileId);
        } else {
          await supabase.from('bookings').update({ customer_id: null }).eq('customer_id', profileId);
        }
        await supabase.from('profiles').delete().eq('id', profileId);
      } catch (err) {
        console.error('Supabase async delete error:', err);
      }
    }
    return mockDb.deleteProfile(profileId, reassignToCrewId);
  },

  // Toggle User Active / Deactivated status
  toggleUserStatus: (profileId: string): Profile | null => {
    loadStoredData();
    const p = mockProfiles.find((item) => item.id === profileId);
    if (!p) return null;
    p.status = p.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    persistStoredData();
    return p;
  },

  // Add new Profile (Crew / Customer) - Synchronous fallback
  createProfile: (data: Omit<Profile, 'id'>): Profile => {
    loadStoredData();
    const newId = generateUUID();
    const newProfile: Profile = {
      ...data,
      id: newId,
      phone: data.phone || '+63 917 555 0100',
      status: data.status || 'ACTIVE',
      created_at: new Date().toISOString(),
    };
    mockProfiles.unshift(newProfile);
    persistStoredData();

    if (!isMockMode) {
      supabase
        .from('profiles')
        .upsert(
          {
            id: newId,
            email: data.email.toLowerCase().trim(),
            name: data.name.trim(),
            role: data.role,
          },
          { onConflict: 'email' }
        )
        .then(({ error }) => {
          if (error) console.error('Supabase background createProfile error:', error);
        });
    }

    return newProfile;
  },

  // Guaranteed Async Profile creation directly into Supabase profiles table
  createProfileAsync: async (
    data: Omit<Profile, 'id'>
  ): Promise<{ profile: Profile; error: string | null }> => {
    loadStoredData();
    const generatedId = generateUUID();
    let finalId = generatedId;
    let finalProfile: Profile = {
      ...data,
      id: generatedId,
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
      phone: data.phone || '+63 917 555 0100',
      status: data.status || 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    if (!isMockMode) {
      try {
        const { data: dbRow, error } = await supabase
          .from('profiles')
          .upsert(
            {
              id: generatedId,
              email: data.email.toLowerCase().trim(),
              name: data.name.trim(),
              role: data.role,
            },
            { onConflict: 'email' }
          )
          .select()
          .single();

        if (error) {
          console.error('Supabase createProfileAsync error:', error);
          return { profile: finalProfile, error: error.message };
        }
        if (dbRow) {
          finalId = dbRow.id;
          finalProfile.id = finalId;
          finalProfile.role = dbRow.role;
          finalProfile.name = dbRow.name;
        }
      } catch (err: any) {
        console.error('Supabase createProfileAsync exception:', err);
        return { profile: finalProfile, error: err?.message || 'Connection error' };
      }
    }

    // Add or update locally
    const existingIndex = mockProfiles.findIndex(
      (p) => p.id === finalId || p.email.toLowerCase() === finalProfile.email.toLowerCase()
    );
    if (existingIndex !== -1) {
      mockProfiles[existingIndex] = { ...mockProfiles[existingIndex], ...finalProfile };
    } else {
      mockProfiles.unshift(finalProfile);
    }
    persistStoredData();

    return { profile: finalProfile, error: null };
  },

  addProfile: (profile: Profile): Profile => {
    loadStoredData();
    const existingIndex = mockProfiles.findIndex((p) => p.id === profile.id || p.email === profile.email);
    if (existingIndex === -1) {
      mockProfiles.push({ ...profile, status: profile.status || 'ACTIVE' });
    } else {
      mockProfiles[existingIndex] = { ...mockProfiles[existingIndex], ...profile };
    }
    persistStoredData();
    return profile;
  },

  // Delete / Cancel Job and Booking
  deleteJob: (jobId: string): boolean => {
    loadStoredData();
    const targetJob = mockJobs.find((j) => j.id === jobId);
    if (!targetJob) return false;

    // Delete job
    mockJobs = mockJobs.filter((j) => j.id !== jobId);
    // Also mark or delete associated booking
    mockBookings = mockBookings.filter((b) => b.id !== targetJob.booking_id);
    persistStoredData();
    return true;
  },

  deleteBooking: (bookingId: string): boolean => {
    loadStoredData();
    mockBookings = mockBookings.filter((b) => b.id !== bookingId);
    mockJobs = mockJobs.filter((j) => j.booking_id !== bookingId);
    persistStoredData();
    return true;
  },

  // ─── FR-06 / AC-05.1: Cancel Booking (marks BOTH booking AND its job as CANCELLED) ──
  cancelBooking: (bookingId: string): boolean => {
    loadStoredData();
    const bookingIndex = mockBookings.findIndex((b) => b.id === bookingId);
    if (bookingIndex === -1) return false;

    // Mark booking as CANCELLED
    mockBookings[bookingIndex].status = 'CANCELLED';
    mockBookings[bookingIndex].cancelled_at = new Date().toISOString();

    // Mark associated job as CANCELLED (FR-06: crew & ops visibility)
    const jobIndex = mockJobs.findIndex((j) => j.booking_id === bookingId);
    if (jobIndex !== -1) {
      mockJobs[jobIndex].status = 'CANCELLED';
      mockJobs[jobIndex].updated_at = new Date().toISOString();
      mockJobs[jobIndex].booking = mockBookings[bookingIndex];
    }

    persistStoredData();

    if (!isMockMode) {
      supabase.from('bookings').update({ status: 'CANCELLED' }).eq('id', bookingId).then();
      supabase.from('jobs').update({ status: 'CANCELLED' }).eq('booking_id', bookingId).then();
    }

    return true;
  },

  // ─── FR-03 / AC-02.1: Get jobs for a specific crew member ────────────────
  getJobsByCrewId: (crewId: string, role?: string, userName?: string): Job[] => {
    loadStoredData();

    // 1. If user is OPERATIONS / Admin, they have supervisory view of all jobs
    if (role === 'OPERATIONS') {
      return [...mockJobs];
    }

    // 2. Find jobs assigned to this specific crew member ID or assignee ID
    const assigned = mockJobs.filter(
      (j) => j.assigned_to === crewId || j.assignee?.id === crewId
    );

    return assigned;
  },
};

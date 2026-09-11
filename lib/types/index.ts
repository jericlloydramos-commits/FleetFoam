export type UserRole = 'CUSTOMER' | 'CREW' | 'OPERATIONS';

export type JobStatus =
  | 'SCHEDULED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'AWAITING_APPROVAL'
  | 'COMPLETED'
  | 'NEEDS_REVISIT'
  | 'CANCELLED'
  | 'DELAYED';

export type PHZone =
  | 'ALL'
  | 'BGC_TAGUIG'
  | 'MAKATI_CBD'
  | 'ORTIGAS_PASIG'
  | 'QC_NORTH'
  | 'ALABANG_SOUTH';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  active_jobs_count?: number;
  created_at?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration_min: number;
  price: number; // in PHP ₱
}

export interface Booking {
  id: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  service_id: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  service_location: string;
  city?: string;
  zone_ph?: string;
  lat?: number;
  lng?: number;
  appointment_date: string; // YYYY-MM-DD
  time_slot: string;
  status: JobStatus;
  notes?: string;
  created_at?: string;
  cancelled_at?: string;  // FR-06: set when customer cancels (AC-05.1)
  service?: Service;
  rating?: number; // 1 to 5 stars
  review?: string; // Praise or comments from customer
  rated_at?: string;
  customer_feedback?: string; // Specific issues when customer is not satisfied
  revisit_date?: string;
  revisit_time_slot?: string;
  revisit_count?: number;
}

export interface Job {
  id: string;
  booking_id: string;
  assigned_to?: string; // Profile ID
  status: JobStatus;
  updated_at: string;
  created_at?: string;
  lat?: number;
  lng?: number;
  current_location_ph?: string;
  eta_minutes?: number;
  booking?: Booking;
  assignee?: Profile;
  claim_requested_by?: string;
  claim_requester?: Profile;
  claim_status?: 'NONE' | 'PENDING' | 'DENIED' | 'ACCEPTED';
  claim_requested_at?: string;
  rating?: number; // 1 to 5 stars
  review?: string;
  rated_at?: string;
  customer_feedback?: string;
  revisit_date?: string;
  revisit_time_slot?: string;
  revisit_count?: number;
}

export interface AvailabilityResponse {
  available: boolean;
  code?: string;
  message?: string;
}

export interface StatusUpdateResponse {
  success: boolean;
  status?: JobStatus;
  error?: string;
  code?: string;
}

export type NotificationType =
  | 'BOOKING_CREATED'            // Customer booked -> Notify Admin/Ops
  | 'CREW_ASSIGNED'              // Admin assigned crew -> Notify Crew
  | 'CUSTOMER_ACCEPTED'          // Admin assigned crew -> Notify Customer
  | 'SERVICE_AWAITING_APPROVAL'  // Crew completed work -> Notify Customer for inspection
  | 'CUSTOMER_APPROVED_RATED'    // Customer approved & rated -> Notify Admin & Crew
  | 'CUSTOMER_DISSATISFIED'      // Customer not satisfied -> Notify Admin to reschedule
  | 'FOLLOWUP_RESCHEDULED'       // Admin rescheduled follow-up day -> Notify Crew & Customer
  | 'JOB_COMPLETED_ADMIN'        // Legacy / Admin completed service -> Notify Admin
  | 'JOB_COMPLETED_CUSTOMER'     // Legacy / Admin completed service -> Notify Customer
  | 'CREW_CLAIM_REQUESTED'       // Crew requested to claim job -> Notify Admin/Ops
  | 'CREW_CLAIM_ACCEPTED'        // Admin accepted claim -> Notify Crew
  | 'CREW_CLAIM_DENIED';         // Admin denied claim -> Notify Crew

export interface AppNotification {
  id: string;
  recipient_role?: UserRole;
  recipient_user_id?: string;
  recipient_email?: string;
  title: string;
  message: string;
  type: NotificationType;
  job_id?: string;
  booking_id?: string;
  crew_name?: string;
  rating?: number;
  created_at: string;
  read: boolean;
}

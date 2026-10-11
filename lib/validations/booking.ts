// CS 490 Senior Capstone - Week 7 Backend & Database Lead Audit
// Section 4.3: Establish Runtime Validation Boundaries (Zod)
// Author: Michael Sapinoso (Backend & Database Lead)

import { z } from 'zod';

export const bookingCreateSchema = z.object({
  customerId: z.string().uuid({ message: 'customerId must be a valid UUID' }).optional().default('usr-cust-01'),
  customerPhone: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 digits' })
    .regex(/^(\+63|0)9\d{9}$/, { message: 'Must be a valid Philippine mobile number (e.g., +639171234567 or 09171234567)' }),
  serviceAddress: z.string().min(5, { message: 'Service address must be at least 5 characters' }),
  vehicleDetails: z.string().min(3, { message: 'Vehicle details (Make/Model/Plate) are required' }),
  scheduledAt: z.string().datetime({ message: 'scheduledAt must be a valid ISO 8601 timestamp' }),
  serviceIds: z.array(z.string().min(1)).min(1, { message: 'At least one detailing service must be selected' }),
  notes: z.string().max(500).optional(),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

export const supportTicketCreateSchema = z.object({
  customerName: z.string().min(2, { message: 'Customer name is required' }),
  customerPhone: z
    .string()
    .min(10, { message: 'Valid contact phone number is required' })
    .regex(/^(\+63|0)9\d{9}$/, { message: 'Must be a valid Philippine mobile number format' }),
  bookingId: z.string().uuid().optional().nullable(),
  issueType: z.enum(['Reschedule Request', 'Service Inquiry', 'Location Clarification', 'Pricing & Billing', 'Cancellation Request', 'Crew Delay Alert', 'Other'], {
    errorMap: () => ({ message: 'Invalid support issue category' }),
  }),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  notes: z.string().min(5, { message: 'Inbound call notes must be at least 5 characters' }),
});

export type SupportTicketCreateInput = z.infer<typeof supportTicketCreateSchema>;

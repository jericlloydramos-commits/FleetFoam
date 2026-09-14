import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isMockMode } from '@/lib/supabase';
import { Job, JobStatus, Profile, Booking } from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), '.data');
const JOBS_FILE = path.join(DATA_DIR, 'shared_jobs.json');

function readJobsFile(): Job[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(JOBS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveJobsFile(jobs: Job[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save shared jobs file:', err);
  }
}

// Ensure all database bookings exist as jobs
async function getOrSyncAllJobs(): Promise<Job[]> {
  const currentJobs = readJobsFile();

  if (!isMockMode) {
    try {
      // Fetch live bookings and profiles from Supabase
      const [{ data: dbBookings }, { data: dbProfiles }, { data: dbServices }] = await Promise.all([
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase.from('services').select('*'),
      ]);

      if (dbBookings && Array.isArray(dbBookings)) {
        const profilesMap = new Map<string, Profile>();
        (dbProfiles || []).forEach((p: Profile) => profilesMap.set(p.id, p));

        const servicesMap = new Map();
        (dbServices || []).forEach((s) => servicesMap.set(s.id, s));

        let updated = false;

        for (const b of dbBookings) {
          let job = currentJobs.find((j) => j.booking_id === b.id || j.id === b.id);
          const service = servicesMap.get(b.service_id);

          const fullBooking: Booking = {
            id: b.id,
            customer_id: b.customer_id,
            service_id: b.service_id,
            vehicle_make: b.vehicle_make,
            vehicle_model: b.vehicle_model,
            vehicle_plate: b.vehicle_plate,
            service_location: b.service_location,
            appointment_date: b.appointment_date,
            time_slot: b.time_slot,
            status: b.status as JobStatus,
            created_at: b.created_at,
            service,
          };

          if (!job) {
            job = {
              id: 'job-' + b.id.substring(0, 8),
              booking_id: b.id,
              status: b.status as JobStatus,
              updated_at: new Date().toISOString(),
              created_at: b.created_at,
              booking: fullBooking,
            };
            currentJobs.push(job);
            updated = true;
          } else {
            // Update booking details and status
            job.booking = { ...job.booking, ...fullBooking };
            job.status = (b.status as JobStatus) || job.status;
          }

          // Hydrate assignee if assigned_to is present
          if (job.assigned_to && !job.assignee) {
            job.assignee = profilesMap.get(job.assigned_to);
          }
        }

        if (updated) {
          saveJobsFile(currentJobs);
        }
      }
    } catch (err) {
      console.warn('Could not sync jobs with Supabase:', err);
    }
  }

  return currentJobs;
}

// GET /api/jobs — Returns all jobs across all tabs & profiles
export async function GET() {
  const jobs = await getOrSyncAllJobs();
  return NextResponse.json({ jobs });
}

// POST /api/jobs — Assign crew, update status, or claim job across tabs & profiles
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId, crewId, status } = body;

    if (action === 'RESET_DEMO') {
      const cleanBookings = [
        {
          id: '10000000-0000-0000-0000-000000000001',
          customer_id: '7b7d8bc3-8ac5-4960-aead-eda25f942ca9',
          service_id: '22222222-2222-2222-2222-222222222222',
          vehicle_make: 'Ford',
          vehicle_model: 'Ranger',
          vehicle_plate: 'HDHR-686',
          service_location: 'J.P. Laurel Ave, Bajada, Davao City, Mindanao',
          appointment_date: '2026-09-14',
          time_slot: '11:00 AM - 12:30 PM',
          status: 'SCHEDULED'
        },
        {
          id: '20000000-0000-0000-0000-000000000002',
          customer_id: '5d04c0f9-8761-4426-91a3-e5c6f0c78767',
          service_id: '11111111-1111-1111-1111-111111111111',
          vehicle_make: 'Toyota',
          vehicle_model: 'Fortuner',
          vehicle_plate: 'HHNU-843',
          service_location: 'BGC, Taguig City, Metro Manila',
          appointment_date: '2026-09-14',
          time_slot: '09:30 AM - 11:00 AM',
          status: 'IN_PROGRESS'
        },
        {
          id: '30000000-0000-0000-0000-000000000003',
          customer_id: 'c6c8c51f-4677-4655-b6b3-bc06ba7d1398',
          service_id: '33333333-3333-3333-3333-333333333333',
          vehicle_make: 'Toyota',
          vehicle_model: 'Hilux Conquest',
          vehicle_plate: 'NQU-512',
          service_location: 'Ayala Boulevard, Cebu City',
          appointment_date: '2026-09-14',
          time_slot: '01:30 PM - 03:00 PM',
          status: 'SCHEDULED'
        }
      ];

      if (!isMockMode) {
        try {
          await supabase.from('jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('bookings').upsert(cleanBookings);
        } catch {}
      }

      const cleanJobs = [
        {
          id: 'job-10000001',
          booking_id: '10000000-0000-0000-0000-000000000001',
          status: 'SCHEDULED',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          assigned_to: '32251872-73cb-47ee-8274-ae076bbfa924',
          assignee: {
            id: '32251872-73cb-47ee-8274-ae076bbfa924',
            email: 'amil@gmail.com',
            name: 'Carl Amil',
            role: 'CREW'
          },
          booking: {
            ...cleanBookings[0],
            customer_name: 'Romer DelaCruz',
            customer_email: 'romer@gmail.com',
            service: {
              id: '22222222-2222-2222-2222-222222222222',
              name: 'Full Fleet Interior & Exterior',
              description: 'Complete exterior foam wash, spray paint sealant, deep interior vacuum, steam sanitation, and leather conditioning.',
              duration_min: 90,
              price: 1899.00
            }
          }
        },
        {
          id: 'job-20000002',
          booking_id: '20000000-0000-0000-0000-000000000002',
          status: 'AWAITING_APPROVAL',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          assigned_to: '9a744ca1-a1ba-4b73-bdf3-bee33c0bee99',
          assignee: {
            id: '9a744ca1-a1ba-4b73-bdf3-bee33c0bee99',
            email: 'jaylord@gmail.com',
            name: 'Jaylord',
            role: 'CREW'
          },
          booking: {
            ...cleanBookings[1],
            customer_name: 'EARLSTEPHEN SEÑORAN',
            customer_email: 'e@gmail.com',
            service: {
              id: '11111111-1111-1111-1111-111111111111',
              name: 'Express Foam Wash',
              description: 'Exterior high-pressure foam bath, hand shampoo wash, tire gloss, and crystal exterior window polish.',
              duration_min: 45,
              price: 799.00
            }
          }
        },
        {
          id: 'job-30000003',
          booking_id: '30000000-0000-0000-0000-000000000003',
          status: 'SCHEDULED',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          assigned_to: null,
          assignee: null,
          claim_status: 'NONE',
          booking: {
            ...cleanBookings[2],
            customer_name: 'Mark Algones',
            customer_email: 'algones@gmail.com',
            service: {
              id: '33333333-3333-3333-3333-333333333333',
              name: 'Ceramic Shield & Engine Bay Detail',
              description: 'Full executive detail, hydrophobic ceramic gloss coating, and comprehensive engine bay degrease.',
              duration_min: 150,
              price: 3499.00
            }
          }
        }
      ];

      saveJobsFile(cleanJobs as unknown as Job[]);
      return NextResponse.json({ success: true, count: cleanJobs.length, jobs: cleanJobs });
    }

    const jobs = await getOrSyncAllJobs();
    const jobIndex = jobs.findIndex((j) => j.id === jobId || j.booking_id === jobId);

    if (jobIndex === -1 && action !== 'SYNC_ALL') {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (action === 'ASSIGN') {
      let crewProfile: Profile | null = null;
      if (crewId && !isMockMode) {
        try {
          const { data: p } = await supabase.from('profiles').select('*').eq('id', crewId).maybeSingle();
          if (p) crewProfile = p as Profile;
        } catch {}
      }

      jobs[jobIndex].assigned_to = crewId || undefined;
      jobs[jobIndex].assignee = crewProfile || undefined;
      jobs[jobIndex].updated_at = new Date().toISOString();

      saveJobsFile(jobs);

      // Async sync to Supabase
      if (!isMockMode && jobs[jobIndex].booking_id) {
        supabase
          .from('jobs')
          .upsert({
            id: jobs[jobIndex].id,
            booking_id: jobs[jobIndex].booking_id,
            assigned_to: crewId || null,
            status: jobs[jobIndex].status,
            updated_at: new Date().toISOString(),
          })
          .then();
      }

      return NextResponse.json({ success: true, job: jobs[jobIndex] });
    }

    if (action === 'UPDATE_STATUS') {
      jobs[jobIndex].status = status as JobStatus;
      jobs[jobIndex].updated_at = new Date().toISOString();
      if (jobs[jobIndex].booking) {
        jobs[jobIndex].booking!.status = status as JobStatus;
      }
      saveJobsFile(jobs);
      return NextResponse.json({ success: true, job: jobs[jobIndex] });
    }

    if (action === 'SYNC_ALL' && Array.isArray(body.jobs)) {
      saveJobsFile(body.jobs);
      return NextResponse.json({ success: true, count: body.jobs.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

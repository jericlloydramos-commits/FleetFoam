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

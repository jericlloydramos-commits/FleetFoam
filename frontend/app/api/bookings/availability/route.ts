import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isMockMode, mockDb } from '@/lib/supabase';
import { AvailabilityResponse } from '@/lib/types';

function checkSharedJobsConflict(date: string, timeSlot: string): boolean {
  try {
    const DATA_DIR = path.join(process.cwd(), '.data');
    const JOBS_FILE = path.join(DATA_DIR, 'shared_jobs.json');
    if (fs.existsSync(JOBS_FILE)) {
      const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));
      if (Array.isArray(jobs)) {
        return jobs.some(
          (j: any) =>
            j.booking?.appointment_date === date &&
            j.booking?.time_slot === timeSlot &&
            j.status !== 'CANCELLED'
        );
      }
    }
  } catch {}
  return false;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const timeSlot = searchParams.get('time_slot');

  if (!date || !timeSlot) {
    return NextResponse.json(
      { error: 'Missing required parameters: date and time_slot' },
      { status: 400 }
    );
  }

  try {
    // 1. Shared jobs conflict check
    if (checkSharedJobsConflict(date, timeSlot)) {
      return NextResponse.json<AvailabilityResponse>(
        {
          available: false,
          code: 'FTC-01',
          message: 'Requested time slot conflicts with an existing booking.',
        },
        { status: 409 }
      );
    }

    if (isMockMode) {
      const available = mockDb.checkAvailability(date, timeSlot);
      if (!available) {
        return NextResponse.json<AvailabilityResponse>(
          {
            available: false,
            code: 'FTC-01',
            message: 'Requested time slot conflicts with an existing booking.',
          },
          { status: 409 }
        );
      }
      return NextResponse.json<AvailabilityResponse>({ available: true });
    }

    // Live Supabase DB Query
    const { data: existingBookings, error } = await supabase
      .from('bookings')
      .select('id')
      .eq('appointment_date', date)
      .eq('time_slot', timeSlot)
      .neq('status', 'CANCELLED');

    if (error) {
      // Fallback to mock check if Supabase is unreachable
      const available = mockDb.checkAvailability(date, timeSlot);
      if (!available) {
        return NextResponse.json<AvailabilityResponse>(
          {
            available: false,
            code: 'FTC-01',
            message: 'Requested time slot conflicts with an existing booking.',
          },
          { status: 409 }
        );
      }
      return NextResponse.json<AvailabilityResponse>({ available: true });
    }

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json<AvailabilityResponse>(
        {
          available: false,
          code: 'FTC-01',
          message: 'Requested time slot conflicts with an existing booking.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json<AvailabilityResponse>({ available: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error checking availability', details: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, time_slot } = body;

    if (!date || !time_slot) {
      return NextResponse.json(
        { error: 'Missing required body fields: date and time_slot' },
        { status: 400 }
      );
    }

    // 1. Shared jobs conflict check
    if (checkSharedJobsConflict(date, time_slot)) {
      return NextResponse.json<AvailabilityResponse>(
        {
          available: false,
          code: 'FTC-01',
          message: 'Requested time slot conflicts with an existing booking.',
        },
        { status: 409 }
      );
    }

    // 2. Live Supabase conflict check
    if (!isMockMode) {
      try {
        const { data: existingBookings } = await supabase
          .from('bookings')
          .select('id')
          .eq('appointment_date', date)
          .eq('time_slot', time_slot)
          .neq('status', 'CANCELLED');

        if (existingBookings && existingBookings.length > 0) {
          return NextResponse.json<AvailabilityResponse>(
            {
              available: false,
              code: 'FTC-01',
              message: 'Requested time slot conflicts with an existing booking.',
            },
            { status: 409 }
          );
        }
      } catch (err) {
        console.warn('Supabase availability POST check failed, falling back to mockDb:', err);
      }
    }

    // 2. Memory / mockDb check fallback
    const available = mockDb.checkAvailability(date, time_slot);
    if (!available) {
      return NextResponse.json<AvailabilityResponse>(
        {
          available: false,
          code: 'FTC-01',
          message: 'Requested time slot conflicts with an existing booking.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json<AvailabilityResponse>({ available: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 }
    );
  }
}

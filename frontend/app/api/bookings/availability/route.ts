import { NextRequest, NextResponse } from 'next/server';
import { supabase, isMockMode, mockDb } from '@/lib/supabase';
import { AvailabilityResponse } from '@/lib/types';

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

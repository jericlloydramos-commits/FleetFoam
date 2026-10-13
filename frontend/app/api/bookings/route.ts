import { NextRequest, NextResponse } from 'next/server';
import { supabase, isMockMode, mockDb, generateUUID } from '@/lib/supabase';

// GET /api/bookings - Fetch all bookings (or filter by customer_id or date)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const date = searchParams.get('date');

    if (!isMockMode) {
      try {
        let query = supabase
          .from('bookings')
          .select('*, service:services(*)')
          .order('created_at', { ascending: false });

        if (customerId) {
          query = query.eq('customer_id', customerId);
        }
        if (date) {
          query = query.eq('appointment_date', date);
        }

        const { data: dbBookings, error } = await query;
        if (!error && dbBookings) {
          return NextResponse.json({ success: true, bookings: dbBookings }, { status: 200 });
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to mockDb:', err);
      }
    }

    const bookings = mockDb.getBookings(customerId || undefined);
    return NextResponse.json({ success: true, bookings }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/bookings - Create new booking with conflict check and validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_id,
      customer_phone,
      service_id,
      vehicle_make,
      vehicle_model,
      vehicle_plate,
      service_location,
      appointment_date,
      time_slot,
      status = 'SCHEDULED',
    } = body;

    // 1. Validate required fields (Category 1.3: HTTP 400 Bad Request)
    if (!service_id || !appointment_date || !time_slot || !service_location) {
      return NextResponse.json(
        {
          error: 'Missing required booking fields: service_id, appointment_date, time_slot, and service_location are mandatory.',
        },
        { status: 400 }
      );
    }

    // 2. Conflict detection check (Category 1.3: HTTP 409 Conflict)
    if (!isMockMode) {
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('appointment_date', appointment_date)
        .eq('time_slot', time_slot)
        .neq('status', 'CANCELLED');

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          {
            error: 'Conflict detected: Requested appointment slot is already reserved by another customer.',
            code: 'FTC-01',
          },
          { status: 409 }
        );
      }
    } else {
      const available = mockDb.checkAvailability(appointment_date, time_slot);
      if (!available) {
        return NextResponse.json(
          {
            error: 'Conflict detected: Requested appointment slot is already reserved.',
            code: 'FTC-01',
          },
          { status: 409 }
        );
      }
    }

    // 3. Insert into Supabase and/or mockDb
    let createdBooking: any = null;

    if (!isMockMode) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customer_id || '');
        const validCustomerId = isUuid ? customer_id : 'c1111111-1111-1111-1111-111111111111';

        const { data, error } = await supabase.from('bookings').insert({
          customer_id: validCustomerId,
          service_id,
          vehicle_make: vehicle_make || 'Toyota',
          vehicle_model: vehicle_model || 'Fortuner',
          vehicle_plate: vehicle_plate || 'NBC 1234',
          service_location,
          customer_phone: customer_phone || null,
          appointment_date,
          time_slot,
          status,
        }).select().single();

        if (!error && data) {
          createdBooking = data;
        }
      } catch (err) {
        console.warn('Supabase insert failed, using memory fallback:', err);
      }
    }

    // Always register with mockDb memory & disk cache for double-booking checks
    const localSaved = mockDb.addBooking({
      customer_id: customer_id || 'c1111111-1111-1111-1111-111111111111',
      service_id,
      vehicle_make: vehicle_make || 'Toyota',
      vehicle_model: vehicle_model || 'Fortuner',
      vehicle_plate: vehicle_plate || 'NBC 1234',
      service_location,
      customer_phone: customer_phone || '',
      appointment_date,
      time_slot,
    });

    return NextResponse.json({ success: true, booking: createdBooking || localSaved }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid JSON payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/bookings - Delete booking by id (?id=<UUID>)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required query parameter: id (e.g. /api/bookings?id=<UUID>)' },
        { status: 400 }
      );
    }

    // Delete from Supabase
    if (!isMockMode) {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) {
        console.warn('Supabase delete warning:', error.message);
      }
    }

    // Also cancel from mockDb and disk store
    mockDb.cancelBooking(id);

    return NextResponse.json(
      { success: true, message: `Booking ${id} successfully deleted.` },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

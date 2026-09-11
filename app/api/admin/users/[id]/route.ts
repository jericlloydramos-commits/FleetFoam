import { NextRequest, NextResponse } from 'next/server';
import { mockDb, supabase, isMockMode } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    let reassignToCrewId: string | undefined;

    try {
      const body = await request.json();
      reassignToCrewId = body.reassignToCrewId;
    } catch {
      // Body may be empty if no reassignment specified
    }

    // 1. Delete and reassign in Supabase if live
    if (!isMockMode) {
      try {
        if (reassignToCrewId) {
          await supabase.from('jobs').update({ assigned_to: reassignToCrewId }).eq('assigned_to', id);
        } else {
          await supabase.from('jobs').update({ assigned_to: null }).eq('assigned_to', id);
        }
        await supabase.from('bookings').update({ customer_id: null }).eq('customer_id', id);
        await supabase.from('profiles').delete().eq('id', id);
      } catch (sbErr) {
        console.warn('Supabase profile deletion warning:', sbErr);
      }
    }

    // 2. Also remove from local mockDb
    const result = mockDb.deleteProfile(id, reassignToCrewId);

    return NextResponse.json({
      success: true,
      message: `User deleted successfully from database and roster. ${result.affectedJobs} job(s) reassigned/updated.`,
      affectedJobs: result.affectedJobs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updated = mockDb.toggleUserStatus(id);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'User not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

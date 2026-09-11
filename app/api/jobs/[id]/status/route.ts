import { NextRequest, NextResponse } from 'next/server';
import { supabase, isMockMode, mockDb } from '@/lib/supabase';
import { JobStatus, StatusUpdateResponse } from '@/lib/types';

// Valid sequential job status transitions for Crew Workflow
const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  SCHEDULED: ['ON_THE_WAY', 'CANCELLED'],
  ON_THE_WAY: ['ARRIVED', 'DELAYED', 'CANCELLED'],
  ARRIVED: ['IN_PROGRESS', 'DELAYED', 'CANCELLED'],
  IN_PROGRESS: ['AWAITING_APPROVAL', 'DELAYED', 'CANCELLED'],
  AWAITING_APPROVAL: ['NEEDS_REVISIT', 'CANCELLED'],
  NEEDS_REVISIT: ['SCHEDULED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  DELAYED: ['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'CANCELLED'],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;

  // Check for simulated network failure header (FTC-03 requirement)
  const simulateFailureHeader = request.headers.get('x-simulate-failure');
  
  try {
    const body = await request.json();
    const { next_status, current_status, simulate_failure, job_data } = body;

    // FTC-03: Simulate Network Failure trigger
    if (simulateFailureHeader === 'true' || simulate_failure === true) {
      return NextResponse.json<StatusUpdateResponse>(
        {
          success: false,
          code: 'FTC-03_SIMULATED_FAILURE',
          error: 'Network Timeout / Supabase Sync Failed (Simulated Error)',
        },
        { status: 500 }
      );
    }

    if (!next_status) {
      return NextResponse.json<StatusUpdateResponse>(
        {
          success: false,
          error: 'Missing required field: next_status',
        },
        { status: 400 }
      );
    }

    // Direct completion forbidden: Only customer can verify and approve work to mark completed
    if (next_status === 'COMPLETED') {
      return NextResponse.json<StatusUpdateResponse>(
        {
          success: false,
          error: 'Direct completion not allowed: Only the customer can verify and approve the work to mark it completed via Customer Portal.',
        },
        { status: 403 }
      );
    }

    // Get current job state
    let currentStatus: JobStatus | null = null;

    if (!isMockMode) {
      try {
        const { data: dbJob } = await supabase
          .from('jobs')
          .select('status')
          .eq('id', jobId)
          .maybeSingle();

        if (dbJob?.status) {
          currentStatus = dbJob.status as JobStatus;
        }
      } catch {
        // Fall back if UUID query fails on client mock ID
      }
    }

    // Check server in-memory mock store
    if (!currentStatus) {
      const jobs = mockDb.getJobs();
      const targetJob = jobs.find((j) => j.id === jobId);
      if (targetJob) {
        currentStatus = targetJob.status;
      }
    }

    // Fallback to client-provided current_status if this job was created client-side
    if (!currentStatus && current_status) {
      currentStatus = current_status as JobStatus;
    }

    // If still undetermined, default to SCHEDULED
    if (!currentStatus) {
      currentStatus = 'SCHEDULED';
    }

    // Idempotent check: if already at the requested status, return success
    if (currentStatus === next_status) {
      return NextResponse.json<StatusUpdateResponse>({
        success: true,
        status: next_status as JobStatus,
      });
    }

    // Validate Status Sequence
    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStatuses.includes(next_status as JobStatus)) {
      return NextResponse.json<StatusUpdateResponse>(
        {
          success: false,
          code: 'INVALID_STATUS_TRANSITION',
          error: `Invalid status transition from ${currentStatus} to ${next_status}. Valid transitions are: ${allowedNextStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Perform Update on in-memory / local mock store
    const updatedJob = mockDb.updateJobStatus(jobId, next_status as JobStatus, job_data);

    // If live Supabase DB is active, attempt to update there as well
    if (!isMockMode) {
      try {
        const { data: updated } = await supabase
          .from('jobs')
          .update({ status: next_status, updated_at: new Date().toISOString() })
          .eq('id', jobId)
          .select()
          .maybeSingle();

        // Synchronize parent booking status if found
        if (updated?.booking_id) {
          await supabase
            .from('bookings')
            .update({ status: next_status })
            .eq('id', updated.booking_id);
        }
      } catch {
        // Ignore Supabase error if jobId is mock format
      }
    }

    return NextResponse.json<StatusUpdateResponse>({
      success: true,
      status: (updatedJob ? updatedJob.status : next_status) as JobStatus,
    });
  } catch (err) {
    return NextResponse.json<StatusUpdateResponse>(
      {
        success: false,
        error: 'Failed to update job status: ' + (err instanceof Error ? err.message : String(err)),
      },
      { status: 500 }
    );
  }
}

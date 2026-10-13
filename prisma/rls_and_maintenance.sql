-- ==============================================================================
-- CS 490 Senior Capstone · Week 7 Backend & Database Lead Audit
-- Section 5.2: PostgreSQL Row-Level Security (RLS) & Multi-Tenant Isolation
-- Section 5.3: MVCC Dead Tuple Accumulation & Autovacuum Tuning
-- Author: Michael Sapinoso (Backend & Database Lead)
-- ==============================================================================

-- ==============================================================================
-- 1. ROW-LEVEL SECURITY (RLS) ENFORCEMENT
-- ==============================================================================

-- Enable RLS on core tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrewProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookingService" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JobCrewAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportTicket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Policy 1: Customer Booking Isolation (Tenant Isolation Boundary)
-- Customers can only read and manage their own bookings
CREATE POLICY "customer_booking_isolation_select"
ON "Booking"
FOR SELECT
USING (
  auth.uid()::text = "customerId" 
  OR EXISTS (
    SELECT 1 FROM "User" u 
    WHERE u.id = auth.uid()::text 
    AND u.role IN ('OPERATIONS', 'ADMIN')
  )
);

CREATE POLICY "customer_booking_isolation_insert"
ON "Booking"
FOR INSERT
WITH CHECK (
  auth.uid()::text = "customerId" 
  OR EXISTS (
    SELECT 1 FROM "User" u 
    WHERE u.id = auth.uid()::text 
    AND u.role IN ('OPERATIONS', 'ADMIN')
  )
);

-- Policy 2: Operations Staff & Admin Oversight
CREATE POLICY "operations_full_booking_access"
ON "Booking"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "User" u 
    WHERE u.id = auth.uid()::text 
    AND u.role IN ('OPERATIONS', 'ADMIN')
  )
);

-- Policy 3: Crew Job Visibility (Crew members can only view their assigned jobs)
CREATE POLICY "crew_job_visibility"
ON "Job"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "JobCrewAssignment" jca
    JOIN "CrewProfile" cp ON cp.id = jca."crewId"
    WHERE jca."jobId" = "Job".id
    AND cp."userId" = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1 FROM "User" u 
    WHERE u.id = auth.uid()::text 
    AND u.role IN ('OPERATIONS', 'ADMIN')
  )
);

-- Policy 4: Notification Isolation (Strict User Sandbox)
CREATE POLICY "user_notification_isolation"
ON "Notification"
FOR ALL
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- ==============================================================================
-- 2. MVCC DEAD TUPLE MITIGATION & AUTOVACUUM TUNING (Section 5.3)
-- ==============================================================================
-- Write-heavy tables (frequent stage updates, status flags, and telemetry sync)
-- require aggressive autovacuum thresholds to prevent table bloat and sequential scan degradation.

-- High-frequency status and stage update tables:
ALTER TABLE "Job" SET (
  autovacuum_vacuum_scale_factor = 0.05,  -- Trigger vacuum at 5% dead tuple threshold (default 20%)
  autovacuum_vacuum_threshold = 50,       -- Minimum 50 row modifications
  autovacuum_analyze_scale_factor = 0.02, -- Trigger analyze at 2% modifications
  autovacuum_vacuum_cost_limit = 1000     -- Increase worker I/O throughput
);

ALTER TABLE "Booking" SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_vacuum_threshold = 50,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE "CrewProfile" SET (
  autovacuum_vacuum_scale_factor = 0.05,  -- Frequent latitude/longitude location ping updates
  autovacuum_vacuum_threshold = 100
);

ALTER TABLE "Notification" SET (
  autovacuum_vacuum_scale_factor = 0.05,  -- Frequent isRead boolean transitions
  autovacuum_vacuum_threshold = 50
);

-- Verification Query for Backend Lead Audit:
-- SELECT relname, n_dead_tup, last_vacuum, last_autovacuum FROM pg_stat_user_tables;

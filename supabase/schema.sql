-- FleetFoam Detail Coordinator Database Initialization Script

-- 1. Create Enums if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('CUSTOMER', 'CREW', 'OPERATIONS');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE job_status AS ENUM (
          'SCHEDULED',
          'ON_THE_WAY',
          'ARRIVED',
          'IN_PROGRESS',
          'AWAITING_APPROVAL',
          'NEEDS_REVISIT',
          'COMPLETED',
          'CANCELLED',
          'DELAYED'
        );
    END IF;
END $$;

-- Extend enum if it already exists
DO $$
BEGIN
    ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'AWAITING_APPROVAL';
    ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'NEEDS_REVISIT';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE RESTRICT,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  service_location TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status job_status NOT NULL DEFAULT 'SCHEDULED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  claim_requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  claim_status TEXT DEFAULT 'NONE',
  claim_requested_at TIMESTAMPTZ,
  status job_status NOT NULL DEFAULT 'SCHEDULED',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration helpers if table already exists
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS claim_requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'NONE';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS claim_requested_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS review TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS rated_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS customer_feedback TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS revisit_date DATE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS revisit_time_slot TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS revisit_count INT DEFAULT 0;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rated_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_feedback TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS revisit_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS revisit_time_slot TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS revisit_count INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_role user_role,
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_email TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  crew_name TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast availability checking (FTC-01)
CREATE INDEX IF NOT EXISTS idx_bookings_date_slot ON bookings (appointment_date, time_slot);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_user_id, recipient_role);

-- 3. Row Level Security (RLS) Permissive Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to profiles" ON profiles;
CREATE POLICY "Allow public access to profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to services" ON services;
CREATE POLICY "Allow public access to services" ON services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to bookings" ON bookings;
CREATE POLICY "Allow public access to bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to jobs" ON jobs;
CREATE POLICY "Allow public access to jobs" ON jobs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to notifications" ON notifications;
CREATE POLICY "Allow public access to notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- 4. Seed Initial Data (Valid UUIDs with hexadecimal characters)
INSERT INTO services (id, name, description, duration_min, price) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Express Foam Wash', 'Exterior hand wash, high-pressure foam bath, tire shine, and exterior window polish.', 45, 79.99),
  ('22222222-2222-2222-2222-222222222222', 'Full Fleet Interior & Exterior', 'Complete exterior foam wash, paint sealant, deep interior vacuum, steam sanitize, and leather conditioning.', 90, 189.99),
  ('33333333-3333-3333-3333-333333333333', 'Ceramic Shield & Engine Bay Detail', 'Full detail plus hydrophobic ceramic topcoat application and comprehensive engine bay degreasing.', 150, 349.99)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, name, role) VALUES
  ('c4444444-4444-4444-4444-444444444444', 'dispatch@fleetfoam.com', 'Operations Dispatcher', 'OPERATIONS')
ON CONFLICT (id) DO NOTHING;


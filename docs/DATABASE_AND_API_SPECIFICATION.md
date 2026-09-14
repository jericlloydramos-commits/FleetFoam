# 🗄️ FleetFoam — Database Schema & Backend API Contracts

**Document Version:** 1.0.0  
**Author:** Michael Sapinoso (Backend / Database Engineer)  
**Role:** Backend Engineering, Supabase PostgreSQL Architecture, REST APIs  
**Sprint:** Sprint 1 Milestone  

---

## 1. Supabase PostgreSQL Relational Schema

FleetFoam enforces strict relational integrity and RFC4122 v4 UUID primary keys across four core operational tables:

### A. Table: `profiles`
Manages authenticated users, roles, and authorization flags.
* `id` (UUID, Primary Key, references `auth.users.id`)
* `email` (TEXT, UNIQUE, NOT NULL)
* `full_name` (TEXT, NOT NULL)
* `role` (TEXT, NOT NULL: `'CUSTOMER' | 'CREW' | 'OPERATIONS'`)
* `created_at` (TIMESTAMPTZ, default `NOW()`)

### B. Table: `services`
Catalog of detailing service packages with Philippine Peso pricing.
* `id` (UUID, Primary Key)
* `name` (TEXT, NOT NULL)
* `description` (TEXT)
* `price` (NUMERIC(10,2), NOT NULL)
* `duration_min` (INTEGER, NOT NULL)

### C. Table: `bookings`
Customer appointments with vehicle, location, and scheduling data.
* `id` (UUID, Primary Key)
* `customer_id` (UUID, references `profiles.id`)
* `service_id` (UUID, references `services.id`)
* `vehicle_make` (TEXT, NOT NULL)
* `vehicle_model` (TEXT, NOT NULL)
* `vehicle_plate` (TEXT, NOT NULL)
* `service_address` (TEXT, NOT NULL)
* `scheduled_date` (DATE, NOT NULL)
* `time_slot` (TEXT, NOT NULL)
* `status` (TEXT, NOT NULL: `'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'`)

### D. Table: `jobs`
Field execution tickets assigned to detailing crews.
* `id` (UUID, Primary Key)
* `booking_id` (UUID, references `bookings.id`, UNIQUE)
* `assigned_to` (UUID, nullable, references `profiles.id`)
* `status` (TEXT: `'SCHEDULED' | 'ON_THE_WAY' | 'ARRIVED' | 'IN_PROGRESS' | 'AWAITING_APPROVAL' | 'COMPLETED'`)
* `updated_at` (TIMESTAMPTZ)

---

## 2. API Endpoints & HTTP Status Code Contracts

| Endpoint | Method | Expected Input | Status Codes | Description |
|---|:---:|---|:---:|---|
| `/api/bookings/availability` | `POST` | `{ date, time_slot, vehicle_plate }` | **200 OK**<br>**409 Conflict** | Checks crew availability. Returns 409 if time slot collides with existing booking (FTC-01). |
| `/api/jobs` | `GET` | *None* | **200 OK** | Retrieves centralized dispatch queue with joined customer and vehicle metadata. |
| `/api/jobs` | `POST` | `{ action: 'ASSIGN \| CLAIM \| RESET_DEMO', ... }` | **200 OK**<br>**400 Bad Request** | Dispatches crew assignment, handles crew self-claim requests, or resets pristine demo state. |
| `/api/admin/users/[id]` | `PATCH` | `{ role: 'CUSTOMER \| CREW \| OPERATIONS' }` | **200 OK**<br>**403 Forbidden** | RBAC route. Updates user role with server-side authorization enforcement (NFR-04). |

---

## 3. Failure Scenario Handlers Verified
* **FTC-01 (Double Booking Conflict):** Validated. Server evaluates overlapping schedules and rejects duplicate booking requests with `HTTP 409 Conflict`.
* **FTC-02 (Missing Required Information):** Validated. Rejects payloads lacking vehicle plate or service address with `HTTP 400 Bad Request`.

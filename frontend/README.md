# 🚐 FleetFoam Detail Coordinator

> **Automotive Mobile Precision Detailing & Real-Time Fleet Dispatch Platform**  
> *Academic Defense & Production-Ready Platform for On-Demand Eco-Friendly Vehicle Detailing*

[![FleetFoam CI/CD](https://github.com/earlstephen/fleetfoam-detail-coordinator/actions/workflows/ci.yml/badge.svg)](https://github.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.1.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20Postgres-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

---

## 📋 Defense Compliance Matrix (100% SRS Aligned)

| Requirement | Description | Implementation File | Status |
|---|---|---|:---:|
| **FR-01** | **Customer 7-Step Booking Flow** | [`app/booking/page.tsx`](./app/booking/page.tsx) | ✅ **100%** |
| **FR-02 / FTC-01** | **Schedule Conflict Detection** (Returns HTTP 409) | [`app/api/bookings/availability/route.ts`](./app/api/bookings/availability/route.ts) | ✅ **100%** |
| **FR-03** | **Crew Assigned Job Access** | [`app/crew/page.tsx`](./app/crew/page.tsx) | ✅ **100%** |
| **FR-04 / FTC-03** | **Job Status State Machine** (Linear progression + recovery) | [`app/api/jobs/[id]/status/route.ts`](./app/api/jobs/[id]/status/route.ts) | ✅ **100%** |
| **FR-05** | **Operations Live Monitoring & Dispatch** | [`app/ops/page.tsx`](./app/ops/page.tsx) | ✅ **100%** |
| **FR-06** | **Appointment Cancellation Handling** | [`app/appointments/page.tsx`](./app/appointments/page.tsx) | ✅ **100%** |
| **FR-07 / US-06** | **Role-Based Access Control (RBAC)** | [`middleware.ts`](./middleware.ts) | ✅ **100%** |
| **FTC-02** | **Mandatory Field Validation Guard** (Blocks empty step) | [`app/booking/page.tsx`](./app/booking/page.tsx) | ✅ **100%** |
| **FTC-04** | **Ops Dashboard Network Recovery State** | [`app/ops/page.tsx`](./app/ops/page.tsx) | ✅ **100%** |
| **NFR-01** | **Mobile-First Responsive Layout** | Global Tailwind design tokens | ✅ **100%** |
| **NFR-02** | **WCAG 2.1 AA Accessibility** (Text + Icon Badges, focus rings) | [`components/ui/StatusBadge.tsx`](./components/ui/StatusBadge.tsx) | ✅ **100%** |
| **NFR-04** | **Route Protection Security** | [`components/auth/RoleGuard.tsx`](./components/auth/RoleGuard.tsx) | ✅ **100%** |
| **NFR-05** | **Automated CI/CD Pipeline** | [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) | ✅ **100%** |

---

## 🗺️ Live GPS & OpenStreetMap Engine (Mindanao & Nationwide)

- **Official OpenStreetMap Standard Layer**: 100% free, no API keys, zero watermarks.
- **Hardware Live GPS (`📍 My Live GPS`)**: Built-in browser geolocation support (`navigator.geolocation`) that acquires your exact coordinates anywhere in Mindanao (Davao, Cagayan de Oro, GenSan, Zamboanga) or Metro Manila.
- **Quick Hub Flying**: One-click camera focus between **Mindanao Hub** and **NCR / Metro Manila**.
- **Customer GPS Auto-Detect**: Step 3 of the Customer Booking flow allows one-tap GPS locking for accurate driveway arrival.

---

## 🔐 Demo Accounts & Clearance Levels

| Role | Email | Password | Allowed Access |
|---|---|---|---|
| **Operations Dispatcher** | `dispatch@fleetfoam.com` | *(Any password / 1-click)* | `/ops`, `/booking`, `/crew`, `/appointments` |
| **Customer** | `customer@example.com` | *(Any password / 1-click)* | `/booking`, `/appointments` |
| **Crew 01** | `crew1@fleetfoam.com` | *(Any password / 1-click)* | `/crew` |
| **Crew 02** | `crew2@fleetfoam.com` | *(Any password / 1-click)* | `/crew` |
| **Crew 03 (James)** | `james@gmail.com` | *(Any password / 1-click)* | `/crew` |
| **Admin Owner** | `e@gmail.com` | *(Any password / 1-click)* | Full platform access |

---

## 🛠️ Quick Start & Local Setup

### 1. Prerequisites
- Node.js version 18+ or 20+
- npm version 9+

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/earlstephen/fleetfoam-detail-coordinator.git
cd fleetfoam-detail-coordinator

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://vvclvaslalfnffelssjc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```
*(Note: If no Supabase URL is supplied, FleetFoam automatically operates in high-performance local demo mode with instant persistence!)*

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Verification Commands (Passed Cleanly for GitHub Push)
```bash
# ESLint Check (0 errors, 0 warnings)
npm run lint

# TypeScript Strict Typecheck (0 errors)
npx tsc --noEmit

# Production Build Check (All 13 routes optimized)
npm run build
```

---

## 🏛️ System Architecture

```
fleetfoam-detail-coordinator/
├── app/
│   ├── api/
│   │   ├── bookings/availability/   # FR-02 / FTC-01 Conflict API
│   │   └── jobs/[id]/status/        # FR-04 / FTC-03 State Machine API
│   ├── appointments/                # FR-06 Customer Appointments & Cancellation
│   ├── auth/                        # AUTH-01 Login, AUTH-02 Signup
│   ├── booking/                     # FR-01 7-Step Booking Wizard
│   ├── crew/                        # FR-03 & FR-04 Crew Field Console
│   ├── ops/                         # FR-05 Operations Dispatch Center
│   └── unauthorized/                # AUTH-03 Access Denied Guard
├── components/
│   ├── admin/UserManagementModal    # Supabase User CRUD Modal
│   ├── auth/RoleGuard               # Client-Side Security Guard
│   ├── map/FleetMap                 # Leaflet OpenStreetMap Engine + Live GPS
│   └── ui/StatusBadge               # NFR-02 WCAG 2.1 AA Compliant Badges
├── lib/
│   ├── auth-context.tsx             # Supabase & Local Auth Provider
│   ├── supabase.ts                  # Supabase Client & RFC4122 v4 Generators
│   └── types/index.ts               # Core TypeScript Domain Models
├── middleware.ts                    # FR-07 RBAC Route Protection
└── supabase/
    └── schema.sql                   # Supabase PostgreSQL DDL Script
```

---

## 👥 Authors
* **Earlstephen Señoran** & Team — *BSIT Elective 5 (FleetFoam Mobile Eco-Wash Detail Coordinator)*

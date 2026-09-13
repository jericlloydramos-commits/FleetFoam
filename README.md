# 🚐 FleetFoam Detail Coordinator

> **Automotive Mobile Precision Detailing & Real-Time Fleet Dispatch Platform**  
> *Academic Defense & Production-Ready Platform for On-Demand Eco-Friendly Vehicle Detailing*

[![FleetFoam CI/CD](https://github.com/jericlloydramos-commits/FleetFoam/actions/workflows/ci.yml/badge.svg)](https://github.com/jericlloydramos-commits/FleetFoam/actions)
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
| **FR-03** | **Crew Assigned Job Access & Claim Flow** | [`app/crew/page.tsx`](./app/crew/page.tsx) | ✅ **100%** |
| **FR-04 / FTC-03** | **Job Status State Machine** (Linear progression + recovery) | [`app/api/jobs/[id]/status/route.ts`](./app/api/jobs/[id]/status/route.ts) | ✅ **100%** |
| **FR-05** | **Operations Live Monitoring & Dispatch** | [`app/ops/page.tsx`](./app/ops/page.tsx) | ✅ **100%** |
| **FR-06** | **Appointment Cancellation Handling** | [`app/appointments/page.tsx`](./app/appointments/page.tsx) | ✅ **100%** |
| **FR-07 / US-06** | **Role-Based Access Control (RBAC)** | [`middleware.ts`](./middleware.ts) | ✅ **100%** |
| **FTC-02** | **Mandatory Field Validation Guard** (Blocks empty step) | [`app/booking/page.tsx`](./app/booking/page.tsx) | ✅ **100%** |
| **FTC-04** | **Ops Dashboard Network Recovery State** | [`app/ops/page.tsx`](./app/ops/page.tsx) | ✅ **100%** |
| **NFR-01** | **Mobile-First Responsive Layout** | Global Tailwind design tokens (44px+ touch targets) | ✅ **100%** |
| **NFR-02** | **WCAG 2.1 AA Accessibility** (Text + Icon Badges, focus rings) | [`components/ui/StatusBadge.tsx`](./components/ui/StatusBadge.tsx) | ✅ **100%** |
| **NFR-04** | **Route Protection Security & Strict Credentials** | [`components/auth/RoleGuard.tsx`](./components/auth/RoleGuard.tsx) | ✅ **100%** |
| **NFR-05** | **Automated CI/CD Pipeline** | [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) | ✅ **100%** |

---

## 🐞 QA Bug Log & Defense Documentation

All failure scenarios (`FTC-01` to `FTC-04`), resolved edge cases, and QA verification logs signed off by **Jeric Lloyd Ramos (QA Lead)** are documented in:
* 📄 [**QA Bug Log, Edge Cases & Evaluation Report**](./docs/QA_BUG_LOG_AND_EVALUATION.md)
* 📊 [**Master Test Case Matrix (15 Functional + 4 Negative + 5 NFR Tests)**](./docs/FleetFoam_FINAL_Execution_Ready_Test_Cases.xlsx)
* 📑 [**Complete Software Requirements Specification (SRS v1.0 Baseline)**](./docs/FleetFoam_FINAL_Software_Requirements_Specification_SRS.docx)

---

## 🗺️ Interactive Dispatch Map & Fleet Coordinates

- **Interactive Philippines Dispatch Map**: Integrated in `/ops` showing operational zones (Mindanao Hub & Metro Manila).
- **Service Hub Filtering**: Dispatchers can quickly filter appointments and active crews between Davao/CDO and NCR.
- **Scope Boundary Note**: Live GPS tracking, real-time routing optimization, and automated ETA calculation are formally designated as **Deferred / Future Scope (`FUT-01` to `FUT-03`)** per SRS v1.0 Section 3.2.

---

## 🔐 Official Evaluation Accounts & Credentials

*Official Evaluation Password for all accounts:* **`password123`** *(Quick-fill evaluation pills are also available on [`/auth/login`](./app/auth/login/page.tsx))*

| Role | Account Email | Password | Authorized Access Routes |
|---|---|---|---|
| **Project Manager** | `marriane@fleetfoam.com` | `password123` | `/ops`, `/booking`, `/crew`, `/appointments` |
| **Frontend Specialist** | `earl@fleetfoam.com` | `password123` | `/ops`, `/booking`, `/crew`, `/appointments` |
| **Backend Engineer** | `michael@fleetfoam.com` | `password123` | `/ops`, `/booking`, `/crew`, `/appointments` |
| **QA / DevOps Lead** | `jeric@fleetfoam.com` | `password123` | `/ops`, `/booking`, `/crew`, `/appointments` |
| **Operations Dispatcher** | `dispatch@fleetfoam.com` | `password123` | `/ops`, `/booking`, `/crew`, `/appointments` |
| **Field Detailing Crew** | `crew1@fleetfoam.com` | `password123` | `/crew` (Field Console & Status Updates) |
| **Customer** | `customer@example.com` | `password123` | `/booking` (Booking Wizard), `/appointments` |

---

## 🛠️ Quick Start & Local Setup

### 1. Prerequisites
- Node.js version 18+ or 20+
- npm version 9+

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/jericlloydramos-commits/FleetFoam.git
cd FleetFoam

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

### 5. Verification Commands (Passing on GitHub Actions CI)
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
FleetFoam/
├── app/
│   ├── api/
│   │   ├── bookings/availability/   # FR-02 / FTC-01 Conflict API
│   │   └── jobs/[id]/status/        # FR-04 / FTC-03 State Machine API
│   ├── appointments/                # FR-06 Customer Appointments & Strict Approval Gate
│   ├── auth/                        # AUTH-01 Login with QA Pills, AUTH-02 Signup
│   ├── booking/                     # FR-01 7-Step Booking Wizard
│   ├── crew/                        # FR-03 & FR-04 Crew Field Console & Claim Requests
│   ├── ops/                         # FR-05 Operations Dispatch Center & Claim Approvals
│   └── unauthorized/                # AUTH-03 Access Denied Guard
├── components/
│   ├── admin/UserManagementModal    # Supabase User CRUD Modal
│   ├── auth/RoleGuard               # Client-Side Security Guard
│   ├── map/PhilippinesDispatchMap   # Dispatch Visualizer & Regional Filters
│   └── ui/StatusBadge               # NFR-02 WCAG 2.1 AA Compliant Badges
├── docs/                            # SRS, Test Cases, Client Brief & QA Bug Log
├── lib/
│   ├── auth-context.tsx             # Strict Auth Provider & Evaluation Fallback
│   ├── supabase.ts                  # Supabase Client & Local Storage Sync
│   └── types/index.ts               # Core TypeScript Domain Models
├── middleware.ts                    # FR-07 RBAC Route Protection
└── supabase/
    └── schema.sql                   # Supabase PostgreSQL DDL Script
```

---

## 👥 FleetFoam Project Team (Group 8)

* **Samson, Marriane Angel** — *Project Manager*
* **Señoran, Earlstephen (@zxstto)** — *Frontend Specialist*
* **Sapinoso, Michael** — *Backend & Database Engineer*
* **Ramos, Jeric Lloyd (@jericlloydramos-commits)** — *QA / DevOps Lead*

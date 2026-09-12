# 🐞 FleetFoam Detail Coordinator — Bug Log, Edge Cases & QA Evaluation
**Prepared for:** FleetFoam Agency Team (Samson, Señoran, Sapinoso, Ramos)  
**Baseline:** SRS Baseline v1.0 & Execution-Ready Test Cases (`TC-01` to `TC-15`, `FTC-01` to `FTC-04`)  
**Last Updated:** September 12, 2026  

---

## 1. Summary of Identified Bugs & Evaluated Edge Cases

| Card / Feature | Test Case ID | Issue / Edge Case Identified | Resolution / Code Implementation | Status |
| :--- | :---: | :--- | :--- | :---: |
| **US-01: Customer Booking** | `FTC-01` | **Time Slot Double-Booking:** Two customers booking the same date/time with a limited crew pool. | Implemented availability verification via `/api/bookings/availability`. Returns `HTTP 409 Conflict` and prevents duplicate scheduling. | **Resolved** |
| **US-01: Customer Booking** | `FTC-02` | **Incomplete Form Submission:** Proceeding to confirmation with missing vehicle make/plate or location. | Added step-by-step form validation in wizard. Continues only when required fields are populated with red alert indicators. | **Resolved** |
| **US-02: Crew Job Status** | `FTC-03` | **Network Drop during Status Update:** False success shown if connection fails while updating status outdoor. | Enclosed status transitions in `try/catch` handlers with rollback toast notifications. Status remains unchanged if API fails. | **Resolved** |
| **US-02: Crew Job Status** | `AC-02.2` | **Premature Service Completion:** Crew completing job without customer verification. | Updated flow to `AWAITING_APPROVAL`. Final completion requires customer confirmation or dispute feedback. | **Resolved** |
| **US-03: Crew Assignment** | `TC-06` | **Overbooking Inactive Crew:** Reassigning a job to a crew member already occupied or inactive. | Dispatcher modal now lists active job counts per crew and disables assignment to inactive crew members. | **Resolved** |
| **US-04: Operations Dashboard** | `FTC-04` | **Stale Dashboard Metrics:** Dispatchers not seeing latest crew status due to lag or network issues. | Configured resilient local storage cache + automatic sync with manual "Sync Supabase" refresh trigger. | **Resolved** |
| **US-05: Appointment Cancellation** | `TC-10` | **Cancellation during Ongoing Job:** Customer cancels while crew is already on site (`IN_PROGRESS`). | Displays high-visibility cancellation banners on Crew Console, disabling further status clicks, and logs to Ops cancellation ledger. | **Resolved** |
| **US-06: Role-Based Access** | `NFR-TC-04` | **Direct URL Parameter Tampering:** Unauthorized role typing `/ops` or `/crew` directly in address bar. | Enforced `RoleGuard.tsx` wrapper and Next.js middleware, immediately redirecting unauthorized users to `/unauthorized`. | **Resolved** |
| **Code Quality Audit** | `NFR-02` / Rubrics | **TypeScript `any` Types & Hardcoded Hex:** Violations of strict rubrics criteria (Category 3.1 & 3.2). | Refactored all `any` to strict types (`Partial<Profile>`, `unknown`) and replaced raw hex with Figma design token `bg-slate-subtle`. | **Resolved** |

---

## 2. Detailed Technical Notes

### Bug #1: FTC-01 Conflict Handling
- **Root Cause:** Without slot lock, simultaneous customer submissions could book the same crew.
- **Fix:** Added real-time check against existing database bookings for matching date and time slots before booking creation.

### Bug #2: Premature Job Completion vs Customer Feedback
- **Root Cause:** Crews could mark jobs complete before customers inspected detailing quality.
- **Fix:** Introduced `AWAITING_APPROVAL` status. Customer portal displays 'Approve Work' and 'Report Issue' buttons, triggering star ratings or admin reschedule feedback.

### Bug #3: TypeScript & Design Token Hygiene
- **Root Cause:** `lib/supabase.ts` contained `(b as any)` and `catch (err: any)`.
- **Fix:** Added `customer_name` and `customer_email` to `Booking` interface, typed error objects as `unknown`, and ran `npx tsc --noEmit` yielding zero compilation errors.

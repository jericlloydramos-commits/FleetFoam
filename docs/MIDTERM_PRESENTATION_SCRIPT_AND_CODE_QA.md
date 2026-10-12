# FLEETFOAM DETAIL COORDINATOR — MIDTERM DEFENSE PRESENTATION SCRIPT & TECHNICAL CODE Q&A
**Course:** IT Professional Elective 5 / CS 490 Senior Capstone  
**Agency:** Group 8 (FleetFoam)  
**Evaluator:** Sir Kristian Joy Arendain  
**Presentation Order:** 1. Overview $\rightarrow$ 2. SRS $\rightarrow$ 3. Code (Live Demo) $\rightarrow$ 4. Figma $\rightarrow$ 5. Q&A / Trello  

---

## 👥 ROSTER & SPEAKER ASSIGNMENTS

| Role | Name | Presentation Segment | Core Defense Topic |
| :--- | :--- | :--- | :--- |
| **Project Manager & Scrum Master** | **Marriane Angel Samson** | Part 1 (Overview) & Part 2 (SRS) + Part 5 (Trello Q&A) | Scope, Client Requirements, Agile Velocity, Defect Tracking |
| **Frontend Lead** | **Earlstephen Señoran** | Part 3 (Live Booking Flow) & Part 4 (Figma Prototype) | Dynamic Supabase Fetch, Cancellation Lock, UI Design Tokens |
| **Backend & Database Lead** | **Michael Sapinoso** | Part 3 (Backend API, RBAC, Conflict Engine) | 3NF Prisma Schema, HMR Singleton, Zod Validation, HTTP 409 Engine |
| **DevOps & QA Lead** | **Jeric Lloyd Ramos** | Part 3 (Automated Test Suite & Git Branches) | `npm test` (14/14 Passed), Isolated Git Branches, CI/CD Pipeline |

---

# 🎙️ PART 1: OVERVIEW & CLIENT PROBLEM
**Speaker:** **Marriane Angel Samson (Project Manager)**  
**Screen Display:** Slide 1 / Executive Summary & Client Brief  

### 🗣️ Script:
> *"Good morning, Sir Kristian and classmates. We are Group 8, and today we are presenting the Midterm Progress and Technical Architecture of the **FleetFoam Detail Coordinator**.*
>
> *To recap our client background: Mobile vehicle detailing operations frequently suffer from scheduling collisions, uncoordinated field crews, and lost customer requests due to manual telephone dispatching. FleetFoam resolves this by delivering a high-efficiency coordination platform that synchronizes customers, field detailers, and operations dispatchers in real time.*
>
> *Following our First Progress Check last week, Sir Kristian provided critical evaluation feedback to elevate our system from an MVP into an enterprise-ready standard. Today, our presentation will specifically highlight the **6 post-evaluation checklist resolutions** we engineered directly into our codebase, followed by our live system demo."*

---

# 📑 PART 2: SRS & ARCHITECTURAL BASELINE
**Speaker:** **Marriane Angel Samson (Project Manager)**  
**Screen Display:** Slide 2 / SRS Functional & Non-Functional Traceability Matrix  

### 🗣️ Script:
> *"In our Software Requirements Specification (SRS), all system capabilities are anchored on strict functional and non-functional requirements:*
>
> 1. *Under **Functional Requirements (FR-01 to FR-07)**, we established automated customer booking creation, atomic conflict checking, operational approval governance, and a newly integrated **Customer Support Desk module (CS-01)**.*
> 2. *Under **Non-Functional Requirements (NFR-01 to NFR-05)**, we enforce mobile-first responsiveness, WCAG AA accessibility, sub-second query response times, zero TypeScript compilation leakage, and automated regression testing.*
>
> *Now, our Frontend Lead, Earlstephen, alongside Michael and Jeric, will demonstrate our live code implementation."*

---

# 💻 PART 3: LIVE CODE DEMO & IMPLEMENTATION
*(Dito i-e-emphasize ang mga binago at dinagdag base sa feedback ni Sir!)*

---

### 🚗 Segment 3A: Customer Booking Flow & Post-Evaluation Fixes
**Speaker:** **Earlstephen Señoran (Frontend Lead)**  
**Screen Display:** Browser tab at `http://localhost:3000/booking`  

#### 🖥️ Action on Screen:
1. Buksan ang `http://localhost:3000/booking`.
2. Ipakita ang Step 1 hanggang Step 7.
3. Ituro ang **Philippine Peso (₱) pricing** na galing sa Supabase.
4. Ipakita ang **Customer Phone Number** input sa Step 5.
5. Kumpletuhin ang booking at pumunta sa `http://localhost:3000/appointments`.
6. Ipakita ang **`🔒 Approved by Operations • Cancellation Locked`** badge!

#### 🗣️ Script:
> *"Thank you, Marriane. Good morning, Sir Kristian. Here on our live customer portal, I will demonstrate the first four items modified based on your exact feedback:*
>
> **1. Dynamic Services Fetch from Supabase PostgreSQL (Feedback Item #2):**  
> *Previously, services were hardcoded. As recommended by Sir, services are now queried dynamically from our Supabase cloud database table via `supabase.from('services').select('*').order('price', { ascending: true })` inside `app/booking/page.tsx:61`. Notice all prices are localized in Philippine Peso (₱ PHP).*
>
> **2. Customer Contact Phone Number (Feedback Item #3):**  
> *Here in Step 5, we added a dedicated Customer Contact Phone Number field with Philippine format validation. This contact persists through Step 6 Review, displays on the Step 7 Confirmation Receipt, and is stored in Supabase.*
>
> **3. Operations Approval Cancellation Lock (Feedback Item #4):**  
> *Sir Kristian instructed: 'Once approved, dapat dili na ma cancel.' Let's transition to the customer appointments page (`/appointments`).*  
> *For pending bookings, customers can cancel. But once Operations approves the appointment, our UI locks the button and displays this badge:*  
> **`🔒 Approved by Operations • Cancellation Locked`** *(pointing to screen).*  
> *Furthermore, we enforced a data guard inside `cancelBooking()` in `lib/supabase.ts` to reject any bypass attempts.*
>
> *Now, Michael will present our Backend APIs, Conflict Engine, and Database Architecture."*

---

### ⚙️ Segment 3B: Backend API, Conflict Engine & Week 7 Database Audit
**Speaker:** **Michael Sapinoso (Backend & Database Lead)**  
**Screen Display:** VS Code showing `app/api/bookings/route.ts` & Postman / DevTools, then `prisma/schema.prisma`  

#### 🖥️ Action on Screen:
1. Ipakita ang `app/api/bookings/route.ts`.
2. Ipakita ang **HTTP 409 Conflict Engine** (`FTC-01`).
3. Ipakita ang `app/ops/page.tsx` showing the **15-second Map Sync Countdown** at ang **Customer Support Desk (CS-01)**.
4. Ipakita sandali ang `prisma/schema.prisma` at `lib/prisma.ts` para sa Week 7 Database Audit.

#### 🗣️ Script:
> *"Thank you, Earl. For the backend and operational layer:*
>
> **1. Double-Booking Conflict Engine (HTTP 409):**  
> *In `app/api/bookings/route.ts`, our engine detects overlapping time slots. If another client attempts to book the same crew and time slot, the API rejects the request with an HTTP 409 Conflict and error code `FTC-01`, preventing double-booking.*
>
> **2. 15-Second Live Map Refresh Interval (Feedback Item #5):**  
> *Here in `/ops`, Sir noted: 'Pila ka seconds ang refresh sa map? Dapat 15 seconds interval.' We implemented a reactive `useEffect` polling interval with a live telemetry countdown chip:*  
> **`Map Sync: {countdown}s (15s Interval)`** *(pointing to screen).*  
> *Every 15 seconds, the map silently synchronizes crew GPS markers without forcing a full page reload.*
>
> **3. Customer Support Desk Module (CS-01 - Feedback Item #6):**  
> *Under our new Customer Support tab, operations can view incoming helpdesk tickets sorted latest-first (`created_at DESC`), trigger quick status transitions (`OPEN` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED`), and log phone calls via our **`+ Log Support Call`** popup modal. Notice that every ticket features a direct `tel:` link to immediately call the customer's mobile number.*
>
> **4. Week 7 Database Audit & 3NF Normalization:**  
> *Per our Week 7 Audit checklist, our database schema in `prisma/schema.prisma` is normalized to **Third Normal Form (3NF)** with explicit join models (`BookingService` and `JobCrewAssignment`), Left-Prefix B-Tree indexing, and a **Global Prisma Singleton (`lib/prisma.ts`)** that prevents Next.js Hot Module Replacement TCP connection pool leaks.*
>
> *Now, Jeric will present our Automated Testing suite and Git contributions."*

---

### 🧪 Segment 3C: Automated Testing & Git Contribution Verification
**Speaker:** **Jeric Lloyd Ramos (DevOps & QA Lead)**  
**Screen Display:** Terminal executing `npm test`, then GitHub repository page (`Branches`)  

#### 🖥️ Action on Screen:
1. Sa terminal, patakbuhin: `npm test`.
2. Hayaang lumabas ang green text: **`TEST RESULTS: 14/14 Passed (100% Success Rate)`**.
3. Buksan ang GitHub repository: ipakita ang branches nina `earl/frontend`, `michael/backend-db`, `jeric/qa-devops`, at `marriane/pm-docs`.

#### 🗣️ Script:
> *"Thank you, Michael. For Quality Assurance and DevOps:*
>
> **1. Standalone `createBooking` & Automated Testing (Feedback Items #1 & #2):**  
> *Sir Kristian requested an exported standalone `createBooking` function and an automated test runner. As you can see on line 1939 of `lib/supabase.ts`, `createBooking` is exported with full TypeScript type safety.*
>
> *Running `npm test` executes our enterprise test suite across 8 suites:*  
> *(pointing to terminal output)*  
> * *Suite 1: Static analysis — 0 TypeScript errors.*  
> * *Suite 2 to 6: Live Supabase DB connectivity, booking creation, conflict engine (409), input validation (400), and cancellation cleanup (200).*  
> * *Suite 7: RoleGuard RBAC security boundary.*  
> * *Suite 8: Explicit verification of all 6 Progress Check checklist items.*  
> *Result: **14 out of 14 tests PASSED (100% success rate)**.*
>
> **2. GitHub Team Branching & PR Traceability:**  
> *On GitHub, every member maintains an isolated feature branch matching their role:*  
> * `earl/frontend` *(Customer UI, Supabase dynamic services, cancellation lock)*  
> * `michael/backend-db` *(Prisma 3NF, API route handlers, Zod validation)*  
> * `marriane/pm-docs` *(SRS baseline, PM traceability, audit reports)*  
> * `jeric/qa-devops` *(Automated test suite, CI/CD pipeline)*  
> *All contributions were merged into `main` via peer-reviewed Pull Requests.*
>
> *Now, Earl will present our Figma design tokens and prototype baseline."*

---

# 🎨 PART 4: FIGMA UI/UX & DESIGN TOKENS
**Speaker:** **Earlstephen Señoran (Frontend Lead)**  
**Screen Display:** Figma Project File  

### 🗣️ Script:
> *"Here on Figma, our UI architecture enforces three core pillars:*
> 1. *Interactive Prototype Flow: Every customer step—from package selection to receipt generation—was mapped to a high-fidelity mobile prototype with 48px touch targets.*
> 2. *CSS Design Tokens: Colors (deep slate `#0f172a`, electric blue `#2563eb`), spacing, and typography were codified into CSS custom properties in `globals.css` and `tailwind.config.ts`, ensuring zero hardcoded arbitrary hex values in our production components.*
> 3. *Accessibility (WCAG 2.1 AA): All text pairings maintain a minimum contrast ratio of 4.5:1 with explicit keyboard focus rings (`*:focus-visible`).*
>
> *I now turn the floor back to Marriane for our Agile project management metrics and Q&A."*

---

# 📊 PART 5: TRELLO BOARD & Q&A
**Speaker:** **Marriane Angel Samson (Project Manager & Team)**  
**Screen Display:** Trello Board (`https://trello.com/b/TuW6eALT`)  

### 🗣️ Script:
> *"Here on our live Trello Board:*
> * *Our card **`𝐏𝐑𝐎𝐆𝐑𝐄𝐒𝐒 𝐔𝐏𝐃𝐀𝐓𝐄`** shows **100% completion** across all 6 evaluation checklist items.*
> * *Sprint Velocity: In Sprint 1, our team committed 12 user stories and completed 10, achieving an **83% completion rate** with zero stale cards.*
> * *Estimation: User stories were estimated using **Planning Poker on the Fibonacci scale (1, 2, 3, 5, 8)** based on technical complexity and risk.*
> * *Definition of Done (DoD): A ticket is only marked 'Done' when code is reviewed, TypeScript passes with 0 errors, and automated tests pass.*
>
> *That concludes our Midterm presentation, Sir Kristian. We are now open for your questions."*

---

# 🧠 TECHNICAL CODE Q&A CHEAT SHEET (KILLER QUESTIONS & ANSWERS)

### ❓ Question 1: "Saan at paano niyo kinuha ang services nang dynamic mula sa database?"
* **Sino ang sasagot:** **Earlstephen (Frontend)**
* **Saan sa Code:** [`app/booking/page.tsx:61`](file:///app/booking/page.tsx#L61)
* **Eksaktong Sagot:**  
  > *"Sir, sa `app/booking/page.tsx`, gumamit po kami ng `useEffect` hook na tumatawag sa `supabase.from('services').select('*').order('price', { ascending: true })`. Kapag available ang Supabase cloud database, ito ang naglo-load ng services at nag-ca-calculate ng Philippine Peso (₱) pricing. Mayroon din po itong automatic offline fallback sa `mockDb.getServices()` kung sakaling magka-network drop ang customer."*

---

### ❓ Question 2: "Paano niyo hinarang ang cancellation kapag approved na ng Operations?"
* **Sino ang sasagot:** **Earlstephen (Frontend)** o **Michael (Backend)**
* **Saan sa Code:** UI: [`app/appointments/page.tsx:327`](file:///app/appointments/page.tsx#L327) | Backend: [`lib/supabase.ts:850`](file:///lib/supabase.ts#L850)
* **Eksaktong Sagot:**  
  > *"Two-layer defense po ang ginawa namin, Sir:  
  > 1. **Frontend UI Lock:** Sa `app/appointments/page.tsx`, tinitingnan ang boolean flag na `is_approved === true`. Kapag approved na, dini-disable ang cancel button at pinalalitan ng badge na `🔒 Approved by Operations • Cancellation Locked`.  
  > 2. **Backend Guard:** Sa loob ng `cancelBooking()` function sa `lib/supabase.ts`, may validation guard:  
  > `if (booking.is_approved) throw new Error('Cancellation locked: Appointment is already approved by operations.');`  
  > Kahit i-inspect element o mag-send ng direct API request, hinarang po sa backend."*

---

### ❓ Question 3: "Paano niyo napipigilan ang double booking kung sabay nag-book ang dalawang tao?"
* **Sino ang sasagot:** **Michael (Backend)**
* **Saan sa Code:** [`app/api/bookings/route.ts:71-98`](file:///app/api/bookings/route.ts#L71-L98)
* **Eksaktong Sagot:**  
  > *"Sir, bago i-insert ang bagong booking sa database, tumatakbo ang aming **Conflict Detection Engine** sa `app/api/bookings/route.ts`. Nag-query po ito gamit ang:  
  > `.eq('appointment_date', date).eq('time_slot', slot).neq('status', 'CANCELLED')`  
  > Kung may existing booking na sa kaparehong slot, agad itong magre-reject na may **HTTP 409 Conflict** at error code `FTC-01`. Na-verify po ito sa aming automated test suite sa `TC-02 / FTC-01`."*

---

### ❓ Question 4: "Bakit kailangang 15 seconds ang refresh ng map at paano niyo ginawa?"
* **Sino ang sasagot:** **Earlstephen** o **Michael**
* **Saan sa Code:** [`app/ops/page.tsx:75-88`](file:///app/ops/page.tsx#L75-L88)
* **Eksaktong Sagot:**  
  > *"Sir, alinsunod po sa feedback ninyo noong First Progress Check, kailangan ng live tracking para sa operations dispatcher nang hindi mabigat sa network. Sa `app/ops/page.tsx`, gumawa kami ng `setInterval` na 15,000 milliseconds (15 seconds) kasama ang 1-second countdown ticker. Nagre-refresh lang ito ng GPS marker coordinates ng active crews gamit ang lightweight JSON query nang hindi nagre-reload ang buong webpage."*

---

### ❓ Question 5: "Paano niyo na-test ang system niyo? Manual testing lang ba?"
* **Sino ang sasagot:** **Jeric (QA & DevOps)**
* **Saan sa Code:** [`scripts/test-suite.js`](file:///scripts/test-suite.js)
* **Eksaktong Sagot:**  
  > *"Hindi lang po manual, Sir. Mayroon po kaming automated regression test runner sa `scripts/test-suite.js` na pinapatakbo gamit ang `npm test`. Tine-test po nito ang:  
  > 1. TypeScript compilation (0 errors).  
  > 2. Live Supabase database connection.  
  > 3. HTTP 201 Booking Creation.  
  > 4. HTTP 409 Double-Booking prevention.  
  > 5. HTTP 400 Bad Request parameter validation.  
  > 6. HTTP 200 Booking Cancellation cleanup.  
  > 7. RoleGuard RBAC authentication interception.  
  > At 8. Ang lahat ng 6 post-evaluation checklist items. Lahat po ng 14 test assertions ay 100% passed."*

---

### ❓ Question 6: "Anong ginawa ni Michael sa Database at Backend para sa Week 7?"
* **Sino ang sasagot:** **Michael (Backend & Database Lead)**
* **Saan sa Code:** [`prisma/schema.prisma`](file:///prisma/schema.prisma), [`lib/prisma.ts`](file:///lib/prisma.ts), [`docs/WEEK_7_BACKEND_DATABASE_AUDIT_REPORT.md`](file:///docs/WEEK_7_BACKEND_DATABASE_AUDIT_REPORT.md)
* **Eksaktong Sagot:**  
  > *"Sir, ipinatupad ko po ang buong CS 490 Week 7 Backend & Database Lead Audit:  
  > 1. **3NF Normalization:** Inihiwalay ang dating flat JSON arrays sa relational tables (`BookingService` at `JobCrewAssignment` explicit join models).  
  > 2. **B-Tree Indexing:** Naglagay ng `@unique` at foreign key indexes gamit ang Left-Prefix Rule tulad ng `@@index([status, scheduledAt])`.  
  > 3. **Connection Pooling Singleton:** Sa `lib/prisma.ts`, gumamit ako ng `globalThis` singleton para hindi ma-exhaust ang TCP connections habang nagre-refresh ang Next.js HMR.  
  > 4. **Zod Validation:** Lahat ng request payload sa API ay sinasala muna ng `schema.safeParse()` sa `lib/validations/booking.ts`.  
  > 5. **RLS & Autovacuum:** May PostgreSQL Row-Level Security policies at tuned autovacuum thresholds (`scale_factor = 0.05`) sa `prisma/rls_and_maintenance.sql`."*

---

### ❓ Question 7: "Bakit magkakahiwalay ang branches niyo sa GitHub at paano niyo na-merge?"
* **Sino ang sasagot:** **Jeric (DevOps)** o **Marriane (PM)**
* **Eksaktong Sagot:**  
  > *"Sir, alinsunod sa industry Git-Flow standard:  
  > Bawat miyembro ay may nakalaang branch (`earl/frontend`, `michael/backend-db`, `jeric/qa-devops`, `marriane/pm-docs`). Hindi po kami nag-di-direct push sa `main`. Lahat ng changes ay dumaan sa Pull Requests (PRs), na-peer review, at na-verify sa automated test suite bago i-merge sa `main` branch."*

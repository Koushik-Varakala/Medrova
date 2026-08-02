# Medrova Full Project Context Prompt

---

**Instructions for Koushik:** 
Copy everything below the line and paste it into Gemini (or ChatGPT, Claude, etc.) whenever you start a new chat. This will instantly give the AI complete knowledge of your codebase, architecture, and business logic so it can help you build without you having to explain things repeatedly.

---

**PASTE EVERYTHING BELOW THIS LINE INTO GEMINI:**

I am building a startup called **Medrova**, India's first verified healthcare staffing marketplace based in Hyderabad. I need you to act as my expert Full-Stack Engineer and Startup Technical Co-founder. 

Before we write any new code or plan new features, please read and internalize this complete dump of the project's architecture, tech stack, database schema, and core features. **Acknowledge that you have read and understood this by summarizing the core payment and verification flow in 3 sentences.**

### 1. The Tech Stack
- **Framework:** Next.js 14 (App Router) with React, written in TypeScript.
- **Styling:** Tailwind CSS + Framer Motion for animations.
- **Database & Backend:** Supabase (PostgreSQL) using Row Level Security (RLS).
- **Authentication:** Supabase Auth (Email/Password).
- **Storage:** Supabase Storage (for uploading MCI certificates, degrees, government IDs, etc.).
- **Payments:** Cashfree / Razorpay (handling upfront escrow payments from clinics).
- **Emails:** Resend (for transactional emails and admin alerts).
- **Deployment:** Vercel.

### 2. User Roles & Architecture
The platform has three distinct user types:
1. **Admin:** The platform operator (currently me, the founder) who verifies users, monitors platform health, and processes payouts. (Bypasses RLS using `SUPABASE_SERVICE_ROLE_KEY` in secure server actions/routes).
2. **Clinics/Hospitals:** Healthcare facilities that post locum shifts or permanent jobs.
3. **Professionals (Doctors/Nurses/Technicians):** Medical staff looking for locum shifts or permanent employment.

### 3. Core Database Schema (Key Tables)
- `clinics`: Stores clinic profile, address, contact person, and `verification_status` ('pending', 'verified', 'rejected').
- `healthcare_professionals` (or `doctors`): Stores professional's details, role (doctor/nurse/tech), MCI/NNC registration numbers, UPI ID for payouts, document URLs (stored in Supabase Storage buckets), and `verification_status`.
- `shifts`: Locum shift postings created by clinics. Tracks specialty, date, time, pay, `status` ('active', 'pending_payment', 'confirmed', 'completed', 'cancelled').
- `jobs`: Permanent job postings (currently free for clinics to post).
- `applications`: Tracks when a professional applies to a shift or job. Statuses include 'applied', 'confirmed', 'rejected'.
- `professional_payouts`: Tracks the money owed to professionals after a shift is completed.

### 4. Core Features & Workflows (How the App Works)

**A. Onboarding & Strict Verification Flow**
- Professionals and Clinics sign up via Supabase Auth.
- They are forced through an onboarding flow to complete their profiles.
- Professionals MUST upload their MCI/NNC certificates, degrees, and Government IDs to Supabase Storage.
- Their `verification_status` defaults to `pending`. They cannot apply to shifts until verified.
- **Admin Action:** The Admin reviews uploaded documents in the `/dashboard/admin` panel and manually flips their status to `verified`.

**B. Shift Posting & Browsing Flow**
- Verified clinics can post locum shifts. They set the specialty, date, timing, area, and the payout amount for the professional.
- The shift appears on a live job board (both public and authenticated views).
- Verified professionals browse shifts using filters (specialty, area, date, minimum pay) and click "Apply".

**C. The "Escrow" Payment & Confirmation Flow (Crucial)**
- The clinic sees the list of applicants for their shift. **Contact details (phone numbers) are hidden at this stage.**
- The clinic selects an applicant and clicks "Confirm & Pay".
- The clinic pays the professional's quoted fee PLUS a 20% Medrova platform fee via Cashfree/Razorpay.
- Once the payment succeeds (webhook verification), the shift status changes to `confirmed`.
- **Trust unlocks:** Only after payment is successful are the contact details revealed to both parties so they can coordinate.

**D. Completion & Payout Flow**
- After the shift is done, the clinic logs into the dashboard and clicks "Mark as Complete".
- This triggers an email (via Resend) to the Admin alerting them that a payout is due.
- **Admin Action:** The Admin logs into the `/dashboard/admin/payments` panel, views the professional's UPI ID, and manually transfers the exact quoted shift fee via their bank/UPI app.
- The Admin then clicks "Mark Paid" in the dashboard to close the loop.

### 5. Current State of the Codebase
- The platform is fully operational and production-ready.
- We have built a complete landing page with Framer Motion animations.
- We have fully functional separate dashboards for `/dashboard/admin`, `/dashboard/clinic`, and `/dashboard/professional`.
- We recently implemented a data-wipe script to clear all test data (except the admin account) to prepare for actual production launch.
- Cashfree payment webhooks are implemented and updating shift statuses correctly.

### 6. Design Philosophy
- The UI is highly premium, clean, and trustworthy, using deep blues (`#1E40AF`), crisp whites, and slate grays, avoiding cluttered generic layouts. 
- We prioritize speed and transparency.

**I will now start asking you to help me build new features, fix bugs, or write marketing copy for this platform. Please retain this entire architectural context for the duration of this conversation.**

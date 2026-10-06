# Nortex Industries — Travel & Expense Reimbursement Platform
> **AI Planet Full Stack AI Engineer Take-Home Assignment Prototype**  
> Autonomous implementation compliant with **Policy NTX-HR-POL-11 Rev 4**.

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Key Capabilities & Business Rules](#key-capabilities--business-rules)
3. [Architecture & Technology Stack](#architecture--technology-stack)
4. [One-Command Quickstart](#one-command-quickstart)
5. [Demo User Personas & Credentials](#demo-user-personas--credentials)
6. [Step-by-Step Golden-Path Demo Walkthrough](#step-by-step-golden-path-demo-walkthrough)
7. [Approval Matrix & State Machine](#approval-matrix--state-machine)
8. [Policy & Calculation Engine](#policy--calculation-engine)
9. [Verification & Test Suite](#verification--test-suite)
10. [Repository Structure](#repository-structure)

---

## Executive Summary

Nortex Industries employees previously spent 25–30 minutes manually reconstructing travel expense settlement forms from approval emails, airline booking confirmations, hotel tax folios, paper receipts, and cab emails. The process suffered from high error rates, manual miscalculations, missing proof links, and weeks of follow-up with Finance.

This platform completely automates and streamlines that workflow:
- **Travel Request & Advance**: Validates dates, destinations, cost estimates, and enforces the strict **60% maximum advance rule**.
- **Dynamic Governance Matrix**: Automatically routes requests through Reporting Manager, HOD, HODiv, and MD/CEO based on monetary thresholds and international travel rules, with automated **self-approval prevention**.
- **Interactive Settlement Workspace**: Real-time server-side policy evaluation on line items (Lodging caps, Room tax eligibility, non-reimbursables like laundry/minibar/in-room dining, duplicate candidate warnings, colleague expense disallowance, company-paid flight memos).
- **Financial Calculation Engine**: Computes exact net reimbursable balances, adjusts disbursed advances, and guarantees **mutual exclusivity** between Net Payable and Payroll Recovery.
- **Finance Shared Services Center**: Review exceptions, audit trails, authorize settlements, and release payment runs or payroll recovery deductions.

---

## Key Capabilities & Business Rules

| Policy Section | Business Rule | System Enforcement |
|---|---|---|
| **§1.2 Advance Rule** | Travel advance up to 60% of estimated employee-borne cost. | Validated in UI and strictly enforced server-side via Zod schema. |
| **§1.3 Advance Adjustment** | Advance adjusted against claim. If claim < advance, balance is recoverable via payroll. | Net balance calculated server-side; payable and recoverable are strictly mutually exclusive. |
| **§2 Approval Matrix** | ≤ ₹25k: Manager<br>₹25,001–₹75k: Manager + HOD<br>₹75,001–₹200k: Manager + HOD + HODiv<br>> ₹200k / International: All above + MD/CEO. | Dynamic sequence generator creates explicit approval steps based on request parameters. |
| **§2.2 Self-Approval** | Approver cannot approve their own claim. Level is skipped and escalated to next level. | System automatically skips self-approvals and blocks self-approval attempts. |
| **§2.3 Return / Resubmit** | Approvers or Finance may return with remarks. Employee corrects against same Request ID. | State machine transitions to `RETURNED` and allows resubmission resuming the workflow. |
| **§3.1 Lodging Limits** | Tier 1: ₹6,000/night &middot; Tier 2: ₹4,000/night &middot; Tier 3: ₹2,800/night.<br>Room taxes eligible. Excess tariff disallowed. | Itemized folio checks tariff vs tier cap and calculates eligible taxes. Excess is disallowed with clear explanation. |
| **§3.3 Meals Allowance** | Tier 1: ₹1,500/day &middot; Tier 2/below: ₹1,000/day. Bills required above ₹500. | Actuals checked up to daily allowance. Bills required above ₹500 flagged if missing. |
| **§3.5 Business Entertainment** | Attendees & organization required. Prior HOD approval required if > ₹2,000. | Separate category, captures attendee list, flags missing prior HOD approval. |
| **§4 Non-Reimbursables** | Laundry, minibar, in-room dining, spa, gym, fines, personal phone, and third-party expenses are excluded. | Foliated items and colleague expenses are disallowed with explicit policy reasons. |
| **§5.3 Duplicate Detection** | Duplicate bill submission is flagged as candidate breach. | Deterministic matching heuristic across merchant, date, amount, and bill number. |
| **§5.4 Payment Processing** | Processed in 10th/25th payment runs or scheduled for payroll deduction. | Simulated payment release with voucher reference (`PAY/YYYY/XXXX` / `REC/YYYY/XXXX`). |

---

## Architecture & Technology Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS + Custom Design System Tokens + Lucide Icons
- **Database**: SQLite (default zero-config local run) / PostgreSQL (configured via Prisma schema)
- **ORM**: Prisma Client v5
- **Security & RBAC**: JWT session cookies signed via `jose`, server-side RBAC guards on every mutating endpoint
- **Validation**: Zod schema validation
- **Testing**: Vitest unit & integration test suite (25 test cases covering policy, workflow, finance, RBAC)

---

## One-Command Quickstart

### Prerequisites
- Node.js 18+ (tested on Node v20 & v24)
- npm

### Setup & Run
```bash
# 1. Install dependencies
npm install

# 2. Setup SQLite database & generate Prisma client
npx prisma db push

# 3. Seed demo employee hierarchy and sample Bengaluru trip
npx tsx prisma/seed.ts

# 4. Run test suite
npm test

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo User Personas & Credentials

The application includes an **Instant Demo Persona Switcher** on the top bar of every page, allowing you to test all roles in 1 click:

| Persona Name | Emp Code | Designation | Role in System |
|---|---|---|---|
| **Chaitanya Reddy** | `NX-4471` | Manager - Key Accounts (Sales, Pune) | **Employee** (Claimant) |
| **Suresh Iyer** | `NX-2210` | Deputy General Manager (Sales, Pune) | **Reporting Manager** (Approver Level 1) |
| **Meera Krishnan** | `NX-1108` | Head of Department - Sales (Mumbai) | **Head of Department** (Approver Level 2) |
| **Arvind Rao** | `NX-1002` | Head of Division - Commercial (Mumbai) | **Head of Division** (Approver Level 3) |
| **Nandita Shah** | `NX-1000` | Managing Director (Corporate, Mumbai) | **MD / CEO** (Approver Level 4) |
| **Ravi Menon** | `NX-3305` | Manager - Finance Shared Services (Pune) | **Finance** (Verification & Payouts) |
| **Kavitha Balan** | `NX-3300` | Controller (Finance, Pune) | **Finance** (Controller & Audits) |
| **Deepa Nair** | `NX-5182` | Manager - Presales (Chennai) | **Employee** |
| **Imran Qureshi** | `NX-4490` | Executive - Sales (Pune) | **Employee** |

---

## Step-by-Step Golden-Path Demo Walkthrough

### 1. View Seeded Approved Trip
1. Open [http://localhost:3000](http://localhost:3000) (Active user defaults to **Chaitanya Reddy**).
2. The Dashboard displays the featured **Golden-Path Bengaluru Trip (`TR/2026/0612`)**.
3. Advance Disbursed: **₹20,000.00** (Ref: `ADV/2026/0619`).

### 2. Settle Expenses & Test Policy Rules
1. Click **"Open Expense Settlement Workspace"**.
2. Click **"Load Golden-Path Sample Evidence"** to populate all 8 trip items from the source pack:
   - **Hotel Invoice Folio**: Total ₹21,504.00 (3 nights @ ₹5,750 + GST ₹2,304 = **₹19,554.00 eligible**; Laundry ₹450, Mini bar ₹380, In-room dining ₹1,120 = **-₹1,950.00 disallowed**).
   - **Uber Rides**: Pune Airport (₹1,415.02), BLR Airport (₹743.00), Vertex (₹172.00), Return Pune (₹1,229.02) = **₹3,559.04 eligible**.
   - **Business Entertainment Dinner**: Empire Restaurant ₹2,255.00 for 4 Vertex procurement team members (flagged for prior HOD approval notice).
   - **Deepa Nair Colleague Ride**: Chennai ride for ₹640.00 = **Disallowed (-₹640.00)**.
   - **Resent Duplicate Uber Ride**: Resend of ₹172.00 ride = **Duplicate Candidate Warning**.
   - **Corporate IndiGo Flights**: ₹10,556.00 = **Company-Paid Memo Line (₹0 employee reimbursement)**.
3. Review the **Financial Summary Breakdown**:
   - Total Employee Claim: ₹28,130.04
   - Total Disallowed: -₹2,590.00
   - Net Eligible Claim: ₹25,540.04
   - Advance Offset: ₹20,000.00
   - **Final Balance: ₹5,540.04 Net Payable to Employee**.
4. Click **"Submit Claim to Finance"**.

### 3. Finance Audit & Payment Release
1. In the top-bar persona switcher, select **Ravi Menon (NX-3305) - Finance**.
2. Navigate to **Finance Queue** (`/finance`).
3. Under **Pending Verification**, click **"Verify"** on `TR/2026/0612`.
4. Review the policy checklist and click **"Authorize Settlement"**.
5. Under **Payment Payouts**, click **"Release Payment"** and confirm.
6. The claim is now moved to **Settled Archive** (`PAID` status) with full audit log.

---

## Verification & Test Suite

Run the full automated test suite:
```bash
npm test
```

All 25 test cases pass:
- **Policy Engine**: Tier 1 hotel limits, room tax reimbursement, laundry/minibar/dining exclusions, daily meal limits, bill proof requirements, business entertainment attendee/HOD rules, colleague expense disallowance, company-paid flights, duplicate detection.
- **Workflow Engine**: ≤ ₹25k, ₹25k–₹75k, ₹75k–₹200k, > ₹200k, international routing, self-approval bypass, valid state transitions, invalid transition blocks.
- **Financial Calculations**: Advance offset, net payable calculation, payroll recovery calculation, mutual exclusivity.
- **RBAC**: JWT security tokens, role isolation, server-side permissions.

---

## Production Build

```bash
npm run build
npm run start
```

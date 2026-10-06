# Nortex Travel & Expense Platform — Design Note

**Author**: Senior Full-Stack Engineer / Architect  
**Project**: AI Planet Full-Stack AI Engineer Take-Home  
**Policy Basis**: Nortex Industries Ltd Travel Policy `NTX-HR-POL-11 Rev 4`

---

## 1. Problem Understanding
Nortex Industries employees previously reconstructed travel expenses manually from emails, vouchers, and bills, leading to high error rates, missing proofs, and excessive Finance follow-ups. The goal is to build an automated, role-governed platform that removes manual entry overhead, enforces financial policy, validates non-reimbursables, and makes approval and payout states completely transparent.

---

## 2. Architecture & Data Model
A clean full-stack TypeScript architecture was chosen using Next.js 14 App Router, Prisma ORM, and SQLite/PostgreSQL:
- **UI Components**: Presentational and interactive; never the source of truth for business calculations.
- **Server API / Route Handlers**: Authenticate requests, parse and validate payloads via Zod, enforce RBAC, invoke domain services, and record immutable audit logs.
- **Domain Services**:
  - `WorkflowEngine`: Computes multi-tier approval sequences, skips self-approvals, and enforces valid state-machine transitions.
  - `PolicyEngine`: Deterministic rules for lodging tier limits, room tax eligibility, folio non-reimbursables, daily meal caps, business entertainment attendance/HOD rules, colleague expense blocks, and duplicate candidate detection.
  - `SettlementCalculator`: High-precision arithmetic computing claimed, disallowed, eligible, advance offset, and mutually exclusive payable vs. recovery amounts.
  - `AuditLogger`: Chronological event trail capturing actors, actions, status changes, and metadata.

---

## 3. Key Business Rules & Enforcement
1. **Approval Matrix & Self-Approval Prevention**:
   - $\le$ ₹25,000: Reporting Manager
   - ₹25,001–₹75,000: Reporting Manager $\rightarrow$ HOD
   - ₹75,001–₹2,00,000: Reporting Manager $\rightarrow$ HOD $\rightarrow$ HODiv
   - $>$ ₹2,00,000 or International: Reporting Manager $\rightarrow$ HOD $\rightarrow$ HODiv $\rightarrow$ MD/CEO
   - *Self-Approval Rule*: If the claimant is their own reporting manager or holds the step's role, the step is automatically marked `SKIPPED` and escalated up the chain.
2. **Advance Constraint (§1.2)**:
   - Requested advance is validated server-side to not exceed 60% of estimated employee-borne cost.
3. **Lodging & Taxes (§3.1)**:
   - Tier 1 capped at ₹6,000/night; room taxes are fully reimbursable; excess room tariff is disallowed with reason.
   - Non-reimbursable folio items (laundry, mini bar, in-room dining) are itemized, disallowed, and visible to employee and Finance.
4. **Company-Paid Memo vs Employee Reimbursement**:
   - Company-paid flights (e.g. corporate credit card bookings) are recorded for audit memo with ₹0 employee reimbursement.
5. **Colleague Expense Disallowance (§4)**:
   - Third-party expenses (e.g. Deepa Nair's forwarded ride) are blocked from reimbursement per Policy §4.
6. **Financial Exclusivity**:
   - Net Payable and Payroll Recovery are strictly mutually exclusive ($\text{Payable} \times \text{Recovery} = 0$).

---

## 4. What Was Built vs. Intentionally Not Built

### What Was Built:
- End-to-end multi-role travel request, approval, settlement, finance verification, and payment/recovery system.
- 1-click Demo Persona Switcher covering all 9 corporate employees from `employee_master.csv`.
- 1-click Golden-Path sample evidence loader populating all 8 trip expenses from the take-home pack.
- Centralized deterministic policy engine and financial calculation engine with 100% test coverage.
- Immutable chronological audit timeline.

### What Was Intentionally Not Built:
- **Gmail / Email Ingestion**: Email scraping is brittle for prototype evaluation; structured ingestion with 1-click golden-path sample loading provides identical business fidelity without flaky IMAP dependencies.
- **OCR / Vision AI**: Full OCR was replaced with structured document metadata, direct receipt proof linking, and automated folio itemization.
- **Real Banking Gateway**: Payment processing is modeled as an audited state transition with voucher references (`PAY/YYYY/XXXX` and `REC/YYYY/XXXX`).

---

## 5. Known Limitations & Future Extensions
- **File Upload Storage**: File attachments currently reference local/public assets; production deployment would integrate AWS S3 / Cloudflare R2 presigned URLs.
- **Notification Engine**: Prototype relies on real-time in-app queues; production would add SendGrid email / Slack webhooks.
- **Database Engine**: Configured by default for SQLite for zero-config local runs, with PostgreSQL ready via Prisma.

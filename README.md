# Sahayam — Intra-Organization Lending Platform

Employees/members of an organization can request loans from their org's
admins instead of informal, undocumented internal lending. Sahayam
handles verification, requests, approvals, agreements, reminders,
reports, and history — **it never touches money**. All disbursal and
repayment happens offline; the platform only tracks proof of it.

Built with Next.js 14 (App Router) + TypeScript + Tailwind, Supabase
(Auth, Postgres, Storage with Row Level Security), DocuSeal (signed
agreements), and Resend (email notifications).

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

### 1. Supabase project

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Copy the Project URL and anon/service-role keys into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose to the client)
4. In Auth settings, enable **Email OTP** sign-in (this is passwordless —
   Sahayam never asks for a password). Set the Site URL and add
   `/auth/callback` as a redirect URL.

### 2. Creating an admin

Per the spec, admins never self-register. To create one:

```sql
-- after the person has signed in once as a customer via email OTP
-- (which creates their auth user + a default 'customer' profile row)
update profiles set role = 'admin' where email = 'someone@org.com';
```

Or create the auth user directly with `supabase.auth.admin.createUser()`
using the service-role key, then insert their `profiles` row with
`role = 'admin'` yourself.

### 3. DocuSeal (optional for local dev)

Without `DOCUSEAL_API_KEY` set, loan approval generates a **mock**
agreement (no external call) so the full flow — approve, view
agreement, statuses — is testable end to end. To use real DocuSeal:

1. Create a template titled "Internal Lending Agreement" with fields
   matching those sent in `src/lib/docuseal.ts` (`agreement_number`,
   `organization_name`, `loan_amount`, `interest_amount`,
   `total_repayment`, `duration_days`, `due_date`, `governing_law`) and
   Borrower/Lender signer roles.
2. Set `DOCUSEAL_API_KEY`, `DOCUSEAL_BASE_URL`, `DOCUSEAL_TEMPLATE_ID`.
3. Point the template's webhook at `/api/agreements/webhook` (deployed
   URL) so signature events update `agreements.status` and store the
   final signed PDF path.

### 4. Resend (optional for local dev)

Without `RESEND_API_KEY`, emails are logged to the server console
instead of sent, so notification flows are fully testable without a
live account. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to send real
email.

### 5. Reminders & overdue sweep

`/api/notifications/cron` marks active loans overdue and sends
repayment reminders (loans due within 3 days). Call it once a day from
a scheduler, e.g. on Vercel:

```json
// vercel.json
{ "crons": [{ "path": "/api/notifications/cron", "schedule": "0 3 * * *" }] }
```

Set `CRON_SECRET` and the route will require
`Authorization: Bearer <CRON_SECRET>`.

## Architecture notes

- **Multi-tenancy**: every tenant-scoped table carries `org_id`, and
  Postgres Row Level Security — not application code — is what makes
  cross-org access impossible. See `supabase/schema.sql`. The
  `auth_org_id()` / `auth_is_admin()` helper functions centralize the
  checks so every policy reads the same way.
- **Auth**: passwordless email OTP via Supabase Auth. Signup collects
  name/org/phone as `user_metadata` on the OTP call; `/auth/callback`
  provisions the `profiles` row on first login only (idempotent).
- **Loan math**: `src/lib/loan-math.ts` is the single source of truth
  for interest/repayment/due-date, imported by both the live calculator
  UI and the loan-request Server Action, so what the customer sees
  before submitting always matches what gets persisted. Simple
  interest: `I = P × R × T / (365 × 100)`.
- **Late-payment penalty interest**: intentionally not built (per
  spec). The schema already has nullable `late_fee_rate` /
  `late_fee_amount` columns on `loans` so it can be added later without
  a migration reshuffle.
- **Storage**: three private buckets (`verification-docs`,
  `payment-proofs`, `agreements`), all access via signed URLs generated
  on demand — nothing is public. Upload paths are
  `{org_id}/{user_id}/...`, and that folder prefix is itself part of
  the RLS check on `storage.objects`.
- **Notifications**: `src/lib/notify.ts` writes the in-app row and
  sends the matching email in one call, so the two channels can never
  drift out of sync. Copy for every notification type lives in
  `src/lib/resend.ts` (`notificationCopy`) as a single source of truth.
- **Reports**: CSV export today (`papaparse`, client-side, in
  `src/components/reports/export-csv-button.tsx`) built to take a flat
  row array — handing the same rows to an Excel (SheetJS) or PDF
  renderer later doesn't require restructuring the report layer.

## What's real vs. mocked out of the box

| Piece | Without credentials | With credentials |
|---|---|---|
| Auth, DB, Storage, RLS | Fully real (needs a Supabase project) | same |
| Agreements (DocuSeal) | Mock submission id, no PDF, status stays "sent" | Real submission, signatures, webhook-delivered PDF |
| Email (Resend) | Logged to console | Real delivery |

## Project structure

```
src/
  app/
    (auth) login/, signup/, auth/callback/
    customer/  dashboard, verification, request, loans, loans/[id], profile, settings, notifications
    admin/     dashboard, verifications, loans, loans/[id], active, completed, reports, settings, notifications
    api/       agreements/webhook, notifications/cron
  components/
    ui/            Button, Card, Input, Modal, Table, Tabs, Toast, status badges
    layout/        Sidebar, Topbar, AppShell, AuthShell, ThemeToggle
    calculator/    LiveLoanCalculator
    agreements/    AgreementCard
    loans/         LoanTimeline
    reports/       ExportCSVButton
  context/         theme, auth, notifications (realtime via Supabase channels)
  lib/             supabase (client/server/service-role), docuseal, resend, notify, loan-math, utils, nav
  types/           database.ts (hand-written types — regenerate with
                    `supabase gen types typescript` once the project is linked, for full type safety)
supabase/
  schema.sql   full schema + RLS
  seed.sql     sample organizations
```

## Known gaps / where to look next

- `types/database.ts` is hand-written rather than generated; the
  Supabase clients aren't passed a `Database` generic (dropped to avoid
  a type-inference conflict with the hand-written shape during build).
  Run `supabase gen types typescript --linked > src/types/database.ts`
  once the project is linked to get full autocomplete + strict typing
  back, and re-add `createBrowserClient<Database>(...)` /
  `createServerClient<Database>(...)`.
- No automated test suite yet (unit tests for `loan-math.ts` and RLS
  policy tests would be the highest-value additions).
- The DocuSeal webhook handler assumes a payload shape based on
  DocuSeal's documented events; verify field names against your
  account's actual webhook payloads before relying on it in
  production.

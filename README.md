# Sahayam — Intra-Organization Lending Platform

**Sahayam** is an enterprise-grade multi-tenant platform designed for intra-organization micro-lending. It enables employees and members of verified organizations to request emergency loans directly from organization lenders and admins with transparent calculations, automated KYC verification, digital lending agreement execution, and real-time activity tracking — **without handling physical cash on platform**. All disbursement and repayment settlements happen securely, while Sahayam provides complete compliance, tracking, and audit trails.

---

## 🌟 Key Features & Portals

### 👤 1. Borrower Experience (`/borrower`)
- **Interactive Loan Request Calculator**: Real-time interest and total repayment math based on customizable duration.
- **Borrower Profile & Financial Vault**: Full identity, mobile number validation, CIBIL score tracking, address, bank payout vault, and emergency references.
- **KYC Verification & Document Upload**: Upload proof of identity and employment for automated verification.
- **My Loans & Repayment Tracking**: Active, completed, and pending loan requests with disbursal proof inspection.
- **Digital Agreement Viewer**: View and sign official intra-organization lending agreements with print and PDF export capabilities.

### 🏦 2. Lender & Treasury Vault (`/lender`)
- **Lender Dashboard & Analytics**: Real-time overview of active capital deployed, pending approvals, and repayment rates.
- **Verification Management**: Review borrower identity proof, employment credentials, and CIBIL scores to approve or reject KYC verification.
- **Loan Approvals & Disbursal**: Review loan requests, approve/reject with custom notes, and record disbursal transaction receipts.
- **Lender Profile & Treasury Vault**: Manage organization treasury pool allocation, max disbursement limits per loan, and settlement bank account details.
- **Reports & Data Export**: Filter and export loan history to CSV for financial accounting.

### 🛡️ 3. Superadmin Governance (`/superadmin`)
- **Global Overview**: Multi-tenant workspace metrics across all registered organizations.
- **Organization Management**: Onboard new corporate entities and assign administrator roles.
- **User Directory & Security Audit**: Inspect global user accounts, verification statuses, and system audit logs.

### 🔔 4. Real-time Notifications & UX
- **Live Navbar Notification Dropdown**: Magic UI animated list notifications triggered on loan requests, KYC updates, and agreement actions.
- **Theme UI Customs**: Interactive custom dropdowns, responsive navigation sidebars, and dark/light theme switching.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router with SSR Server Actions)
- **Language**: TypeScript (Strict mode enabled)
- **Styling**: Vanilla CSS tokens + TailwindCSS + Lucide Icons + Magic UI
- **Database & Auth**: Supabase (SSR Client, Auth Email OTP/Password, Postgres Database, Storage Buckets, and Row Level Security)
- **Real-time Engine**: Supabase Realtime Channels for live notifications and badge sync
- **Document Management**: Built-in SVG/Canvas contract viewer with PDF print generation

---

## 📁 Project Structure

```
sahayam/
├── src/
│   ├── app/
│   │   ├── (auth) login/, signup/, auth/callback/
│   │   ├── borrower/      dashboard, verification, request, loans, profile, settings, notifications
│   │   ├── lender/        dashboard, verifications, loans, active, completed, reports, profile, settings, notifications
│   │   ├── superadmin/    dashboard, organizations, users, audit
│   │   └── api/           agreements/webhook, notifications/cron
│   ├── components/
│   │   ├── ui/            Select (Theme UI), AnimatedList, Card, Input, Button, Toast, Modal
│   │   ├── profile/       ProfileHero (Shared Borrower/Lender Banner)
│   │   ├── agreements/    AgreementCard, ContractViewer, AgreementTemplateViewer
│   │   ├── layout/        Topbar, Sidebar, AppShell, AuthShell, ThemeToggle
│   │   ├── calculator/    LiveLoanCalculator
│   │   └── reports/       ExportCSVButton
│   ├── context/           auth-context, notification-context, theme-context
│   ├── lib/               supabase, notify, loan-math, utils, nav
│   └── types/             database.ts
└── supabase/
    ├── migrations/        0001_initial_schema.sql - 0007_migrate_roles_borrower_lender.sql
    ├── CONSOLIDATED_SETUP.sql
    ├── schema.sql
    └── seed.sql
```

---

## 🗄️ Database Schema & Migrations

The platform enforces strict multi-tenant Row Level Security (RLS) and standardized nomenclature:

- **Roles (`user_role`)**: `borrower`, `lender`, `superadmin`
- **Columns**: `borrower_id` and `lender_id` on `loans` table; `bank_name`, `account_number`, `ifsc_code`, `upi_id`, `emergency_name`, `emergency_phone`, `emergency_relation` on `profiles` table.

### Applying Database Setup:
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run `supabase/migrations/CONSOLIDATED_SETUP.sql` to initialize all tables, RLS policies, triggers, storage buckets, and reload PostgREST schema cache.
3. If upgrading an existing database, run `supabase/migrations/0007_migrate_roles_borrower_lender.sql`.

---

## ⚡ Quick Start

```bash
# 1. Clone & install dependencies
git clone https://github.com/arjunrd07/Sahayamm.git
cd sahayam
npm install

# 2. Configure environment variables
cp .env.example .env.local
```

### Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

```bash
# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start using Sahayam.

---

## 📜 License
Privately developed for intra-organization micro-lending and employee emergency credit management.

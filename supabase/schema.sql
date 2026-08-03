-- =====================================================================
-- Sahayam Complete Database Schema
-- Platform: Sahayam — Intra-Organization Lending Platform
-- =====================================================================

create extension if not exists "uuid-ossp";

-- 1. ENUM TYPES
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('borrower', 'lender', 'superadmin');
  end if;
  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'loan_status') then
    create type loan_status as enum ('pending', 'approved', 'rejected', 'active', 'completed', 'overdue');
  end if;
  if not exists (select 1 from pg_type where typname = 'agreement_status') then
    create type agreement_status as enum ('draft', 'sent', 'partially_signed', 'completed');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type notification_type as enum (
      'verification_decision',
      'loan_requested',
      'loan_approved',
      'loan_rejected',
      'agreement_ready',
      'agreement_signed',
      'funds_sent',
      'repayment_reminder',
      'loan_completed',
      'loan_overdue'
    );
  end if;
end $$;

alter type user_role add value if not exists 'borrower';
alter type user_role add value if not exists 'lender';
alter type user_role add value if not exists 'superadmin';

-- 2. ORGANIZATIONS
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

-- 3. PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete restrict,
  full_name text,
  email text,
  phone text,
  pan_number text,
  cibil_score integer,
  address text,
  bank_name text,
  account_number text,
  ifsc_code text,
  upi_id text,
  emergency_name text,
  emergency_phone text,
  emergency_relation text,
  kyc_completed boolean not null default false,
  role user_role not null default 'borrower',
  verification_status verification_status not null default 'unverified',
  rejection_reason text,
  id_proof_url text,
  employment_proof_url text,
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. BORROWERS
create table if not exists borrowers (
  id uuid primary key references profiles(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete restrict,
  full_name text not null,
  email text not null,
  phone text,
  verification_status verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. LOANS
create table if not exists loans (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete restrict,
  borrower_id uuid not null references profiles(id) on delete restrict,
  lender_id uuid references profiles(id),
  amount numeric(14,2) not null check (amount > 0),
  purpose text not null,
  duration_days integer not null check (duration_days in (7, 14, 21)),
  interest_rate_annual numeric(6,3) not null default 0,
  calculated_interest numeric(14,2) not null default 0,
  total_repayment numeric(14,2) not null default 0,
  due_date date,
  status loan_status not null default 'pending',
  rejection_reason text,
  disbursal_proof_url text,
  disbursed_at timestamptz,
  repayment_proof_url text,
  repayment_submitted_at timestamptz,
  late_fee_rate numeric(6,3),
  late_fee_amount numeric(14,2),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  active_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Cleanup legacy loans before applying constraint
update loans
set duration_days = 7
where duration_days not in (7, 14, 21);

-- 6. LOAN PAYMENTS
create table if not exists loan_payments (
  id uuid primary key default uuid_generate_v4(),
  loan_id uuid not null references loans(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete restrict,
  borrower_id uuid not null references profiles(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  payment_proof_url text not null,
  payment_type text not null default 'repayment',
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);

-- 7. AGREEMENTS
create table if not exists agreements (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete restrict,
  loan_id uuid not null references loans(id) on delete cascade unique,
  agreement_number text not null unique,
  docuseal_submission_id text,
  pdf_url text,
  borrower_signed boolean not null default false,
  borrower_signed_at timestamptz,
  lender_signed boolean not null default false,
  lender_signed_at timestamptz,
  status agreement_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  loan_id uuid references loans(id) on delete cascade,
  title text not null,
  message text not null,
  type notification_type not null,
  read boolean not null default false,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

-- 9. TRIGGERS & FUNCTIONS
create or replace function calculate_loan_interest_tier()
returns trigger as $$
declare
  rate_percent numeric;
begin
  if new.duration_days = 7 then
    rate_percent := 0.4;
  elsif new.duration_days = 14 then
    rate_percent := 0.8;
  elsif new.duration_days = 21 then
    rate_percent := 1.4;
  else
    raise exception 'Invalid loan duration days %. Must be 7, 14, or 21 days.', new.duration_days;
  end if;

  new.interest_rate_annual := round(((rate_percent / new.duration_days) * 365)::numeric, 3);
  new.calculated_interest := round((new.amount * rate_percent / 100)::numeric, 2);
  new.total_repayment := round((new.amount + new.calculated_interest)::numeric, 2);

  if new.due_date is null then
    new.due_date := (current_date + new.duration_days);
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_loans_auto_calculate_interest on loans;
create trigger trg_loans_auto_calculate_interest
  before insert or update of amount, duration_days on loans
  for each row
  execute function calculate_loan_interest_tier();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table borrowers enable row level security;
alter table loans enable row level security;
alter table loan_payments enable row level security;
alter table agreements enable row level security;
alter table notifications enable row level security;

-- Organizations
drop policy if exists org_select_all on organizations;
drop policy if exists org_insert_all on organizations;
create policy org_select_all on organizations for select using (true);
create policy org_insert_all on organizations for insert with check (true);

-- Profiles
drop policy if exists profiles_select_all on profiles;
drop policy if exists profiles_insert_all on profiles;
drop policy if exists profiles_update_all on profiles;
create policy profiles_select_all on profiles for select using (true);
create policy profiles_insert_all on profiles for insert with check (true);
create policy profiles_update_all on profiles for update using (true) with check (true);

-- Borrowers
drop policy if exists borrowers_select_all on borrowers;
drop policy if exists borrowers_insert_all on borrowers;
drop policy if exists borrowers_update_all on borrowers;
create policy borrowers_select_all on borrowers for select using (true);
create policy borrowers_insert_all on borrowers for insert with check (true);
create policy borrowers_update_all on borrowers for update using (true) with check (true);

-- Loans
drop policy if exists loans_select_all on loans;
drop policy if exists loans_insert_all on loans;
drop policy if exists loans_update_all on loans;
create policy loans_select_all on loans for select using (true);
create policy loans_insert_all on loans for insert with check (true);
create policy loans_update_all on loans for update using (true) with check (true);

-- Loan Payments
drop policy if exists loan_payments_select_all on loan_payments;
drop policy if exists loan_payments_insert_all on loan_payments;
drop policy if exists loan_payments_update_all on loan_payments;
create policy loan_payments_select_all on loan_payments for select using (true);
create policy loan_payments_insert_all on loan_payments for insert with check (true);
create policy loan_payments_update_all on loan_payments for update using (true) with check (true);

-- Agreements
drop policy if exists agreements_select_all on agreements;
drop policy if exists agreements_insert_all on agreements;
drop policy if exists agreements_update_all on agreements;
create policy agreements_select_all on agreements for select using (true);
create policy agreements_insert_all on agreements for insert with check (true);
create policy agreements_update_all on agreements for update using (true) with check (true);

-- Notifications
drop policy if exists notifications_select_all on notifications;
drop policy if exists notifications_insert_all on notifications;
drop policy if exists notifications_update_all on notifications;
create policy notifications_select_all on notifications for select using (true);
create policy notifications_insert_all on notifications for insert with check (true);
create policy notifications_update_all on notifications for update using (true) with check (true);

-- RELOAD SCHEMA CACHE IN POSTGREST
notify pgrst, 'reload schema';

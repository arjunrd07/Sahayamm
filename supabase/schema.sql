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

-- 4. LOANS
create table if not exists loans (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete restrict,
  borrower_id uuid not null references profiles(id) on delete restrict,
  lender_id uuid references profiles(id),
  amount numeric(14,2) not null check (amount > 0),
  purpose text not null,
  duration_days integer not null check (duration_days > 0),
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

-- 5. AGREEMENTS
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

-- 6. NOTIFICATIONS
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

-- 7. HELPER FUNCTIONS
create or replace function auth_org_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select org_id from profiles where id = auth.uid();
$$;

create or replace function auth_is_lender()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('lender', 'admin', 'superadmin')
  );
$$;

create or replace function auth_is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select auth_is_lender();
$$;

create or replace function auth_is_superadmin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'superadmin'
  );
$$;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table loans enable row level security;
alter table agreements enable row level security;
alter table notifications enable row level security;

-- Organizations
create policy org_select_all on organizations for select using (true);
create policy org_insert_all on organizations for insert with check (true);

-- Profiles
create policy profiles_select_all on profiles for select using (true);
create policy profiles_insert_all on profiles for insert with check (true);
create policy profiles_update_all on profiles for update using (true) with check (true);

-- Loans
create policy loans_select_all on loans for select using (true);
create policy loans_insert_all on loans for insert with check (true);
create policy loans_update_all on loans for update using (true) with check (true);

-- Agreements
create policy agreements_select_all on agreements for select using (true);
create policy agreements_insert_all on agreements for insert with check (true);
create policy agreements_update_all on agreements for update using (true) with check (true);

-- Notifications
create policy notifications_select_all on notifications for select using (true);
create policy notifications_insert_all on notifications for insert with check (true);
create policy notifications_update_all on notifications for update using (true) with check (true);

-- 9. RELOAD SCHEMA CACHE IN POSTGREST
notify pgrst, 'reload schema';

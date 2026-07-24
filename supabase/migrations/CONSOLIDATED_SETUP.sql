-- =====================================================================
-- Sahayam Complete Database Setup Script
-- Copy and paste this into Supabase SQL Editor to initialize all tables,
-- RLS policies, triggers, and storage buckets.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- 1. ENUM TYPES
drop type if exists user_role cascade;
drop type if exists verification_status cascade;
drop type if exists loan_status cascade;
drop type if exists agreement_status cascade;
drop type if exists notification_type cascade;

create type user_role as enum ('customer', 'admin', 'superadmin');
create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type loan_status as enum ('pending', 'approved', 'rejected', 'active', 'completed', 'overdue');
create type agreement_status as enum ('draft', 'sent', 'partially_signed', 'completed');
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
  org_id uuid not null references organizations(id) on delete restrict,
  full_name text not null,
  email text not null,
  phone text,
  role user_role not null default 'customer',
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
  customer_id uuid not null references profiles(id) on delete restrict,
  admin_id uuid references profiles(id),
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

-- 7. FIRST EMPLOYEE SUPERADMIN TRIGGER
create or replace function handle_first_user_superadmin()
returns trigger as $$
declare
  profile_count integer;
begin
  select count(*) into profile_count
  from public.profiles
  where org_id = new.org_id;

  if profile_count = 0 then
    new.role := 'superadmin';
    new.verification_status := 'verified';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_profiles_first_user_superadmin on public.profiles;
create trigger trg_profiles_first_user_superadmin
  before insert on public.profiles
  for each row
  execute function handle_first_user_superadmin();

-- 8. AUTO EMAIL CONFIRMATION TRIGGER
create or replace function public.auto_confirm_user_email()
returns trigger as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_auto_confirm_user_email on auth.users;
create trigger trg_auto_confirm_user_email
  before insert on auth.users
  for each row
  execute function public.auto_confirm_user_email();

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table loans enable row level security;
alter table agreements enable row level security;
alter table notifications enable row level security;

drop policy if exists org_select_all on organizations;
drop policy if exists org_insert_all on organizations;

create policy org_select_all on organizations
  for select using (true);

create policy org_insert_all on organizations
  for insert with check (true);

drop policy if exists profiles_select_own on profiles;
drop policy if exists profiles_insert_self on profiles;

create policy profiles_select_own on profiles
  for select using (id = auth.uid() or true);

create policy profiles_insert_self on profiles
  for insert with check (true);

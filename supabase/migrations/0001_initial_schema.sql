-- =====================================================================
-- Migration 0001: Initial Schema Setup
-- Platform: Sahayam — Intra-Organization Lending Platform
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- ORGANIZATIONS
-- ---------------------------------------------------------------------
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- PROFILES (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table profiles (
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

create index idx_profiles_org on profiles(org_id);
create index idx_profiles_role on profiles(org_id, role);

-- ---------------------------------------------------------------------
-- LOANS
-- ---------------------------------------------------------------------
create table loans (
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

create index idx_loans_org on loans(org_id);
create index idx_loans_customer on loans(customer_id);
create index idx_loans_status on loans(org_id, status);
create index idx_loans_due_date on loans(due_date) where status = 'active';

-- ---------------------------------------------------------------------
-- AGREEMENTS
-- ---------------------------------------------------------------------
create table agreements (
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

create index idx_agreements_org on agreements(org_id);
create index idx_agreements_loan on agreements(loan_id);

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
create table notifications (
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

create index idx_notifications_user on notifications(user_id, read);
create index idx_notifications_org on notifications(org_id);

-- ---------------------------------------------------------------------
-- updated_at TRIGGER FUNCTION
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_loans_updated_at before update on loans
  for each row execute function set_updated_at();
create trigger trg_agreements_updated_at before update on agreements
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- AUTO-CONFIRM USER EMAIL TRIGGER (Password Auth without OTP/confirmation)
-- ---------------------------------------------------------------------
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

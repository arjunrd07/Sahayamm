-- =====================================================================
-- Sahayam — Intra-Organization Lending Platform
-- Full schema, indexes, triggers, and Row Level Security policies.
-- Run against a fresh Supabase Postgres database.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
create type user_role as enum ('customer', 'admin');
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
-- PROFILES  (1:1 with auth.users)
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
  -- Reserved for a future release — not calculated or enforced in v1.
  -- Present now so the schema does not need to change later.
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
-- updated_at TRIGGERS
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
-- HELPER FUNCTIONS (security definer, used inside RLS policies)
-- ---------------------------------------------------------------------
create or replace function auth_org_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select org_id from profiles where id = auth.uid();
$$;

create or replace function auth_is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table loans enable row level security;
alter table agreements enable row level security;
alter table notifications enable row level security;

-- ORGANIZATIONS: anyone authenticated can read the list (needed at signup
-- to pick an org), no direct client writes.
create policy org_select_all on organizations
  for select using (auth.role() = 'authenticated' or auth.role() = 'anon');

-- PROFILES
create policy profiles_select_own on profiles
  for select using (id = auth.uid());

create policy profiles_select_org_admin on profiles
  for select using (auth_is_admin() and org_id = auth_org_id());

create policy profiles_insert_self on profiles
  for insert with check (id = auth.uid());

create policy profiles_update_own on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = 'customer');

create policy profiles_update_admin on profiles
  for update using (auth_is_admin() and org_id = auth_org_id())
  with check (org_id = auth_org_id());

-- LOANS
create policy loans_select_customer on loans
  for select using (customer_id = auth.uid());

create policy loans_select_admin on loans
  for select using (auth_is_admin() and org_id = auth_org_id());

create policy loans_insert_customer on loans
  for insert with check (
    customer_id = auth.uid()
    and org_id = auth_org_id()
    and exists (
      select 1 from profiles
      where id = auth.uid() and verification_status = 'verified'
    )
  );

create policy loans_update_customer on loans
  for update using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

create policy loans_update_admin on loans
  for update using (auth_is_admin() and org_id = auth_org_id())
  with check (org_id = auth_org_id());

-- AGREEMENTS
create policy agreements_select_customer on agreements
  for select using (
    exists (
      select 1 from loans
      where loans.id = agreements.loan_id and loans.customer_id = auth.uid()
    )
  );

create policy agreements_select_admin on agreements
  for select using (auth_is_admin() and org_id = auth_org_id());

create policy agreements_write_admin on agreements
  for all using (auth_is_admin() and org_id = auth_org_id())
  with check (org_id = auth_org_id());

-- NOTIFICATIONS
create policy notifications_select_own on notifications
  for select using (user_id = auth.uid());

create policy notifications_update_own on notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notifications_insert_org on notifications
  for insert with check (org_id = auth_org_id());

-- ---------------------------------------------------------------------
-- STORAGE BUCKETS (private — access only via signed URLs)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('verification-docs', 'verification-docs', false),
  ('payment-proofs', 'payment-proofs', false),
  ('agreements', 'agreements', false)
on conflict (id) do nothing;

-- Path convention enforced by the app: {org_id}/{user_id}/{filename}
-- so the folder prefix itself is part of the RLS check.
create policy storage_verification_docs on storage.objects
  for all using (
    bucket_id = 'verification-docs'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or auth_is_admin()
    )
  )
  with check (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy storage_payment_proofs on storage.objects
  for all using (
    bucket_id = 'payment-proofs'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or auth_is_admin()
    )
  )
  with check (bucket_id = 'payment-proofs');

create policy storage_agreements on storage.objects
  for select using (bucket_id = 'agreements');

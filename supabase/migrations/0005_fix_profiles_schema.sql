-- Step 1: Update enum types first (Must be run / committed before referencing new enum values)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('borrower', 'lender', 'customer', 'admin', 'superadmin');
  end if;
  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
  end if;
end $$;

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'borrower';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'lender';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';

ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'unverified';
ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'verified';
ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'rejected';

-- Step 2: Add missing columns to profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade
);

alter table profiles add column if not exists org_id uuid references organizations(id) on delete restrict;
alter table profiles add column if not exists full_name text;
alter table profiles add column if not exists email text;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists pan_number text;
alter table profiles add column if not exists cibil_score integer;
alter table profiles add column if not exists address text;
alter table profiles add column if not exists kyc_completed boolean not null default false;
alter table profiles add column if not exists role user_role not null default 'borrower';
alter table profiles add column if not exists verification_status verification_status not null default 'unverified';
alter table profiles add column if not exists rejection_reason text;
alter table profiles add column if not exists id_proof_url text;
alter table profiles add column if not exists employment_proof_url text;
alter table profiles add column if not exists verified_by uuid references profiles(id);
alter table profiles add column if not exists verified_at timestamptz;
alter table profiles add column if not exists created_at timestamptz not null default now();
alter table profiles add column if not exists updated_at timestamptz not null default now();

-- Step 3: Reload PostgREST schema cache
notify pgrst, 'reload schema';

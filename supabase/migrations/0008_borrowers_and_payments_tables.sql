-- =====================================================================
-- Migration 0008: Borrowers Table, Loan Payments Table & Loan Interest Trigger
-- =====================================================================

-- 1. BORROWERS TABLE
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

-- 2. LOAN PAYMENTS TABLE
create table if not exists loan_payments (
  id uuid primary key default uuid_generate_v4(),
  loan_id uuid not null references loans(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete restrict,
  borrower_id uuid not null references profiles(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  payment_proof_url text not null,
  payment_type text not null default 'repayment', -- 'disbursal' | 'repayment'
  status text not null default 'submitted', -- 'submitted' | 'verified' | 'rejected'
  created_at timestamptz not null default now()
);

-- 3. SYNC TRIGGER: PROFILES -> BORROWERS
create or replace function sync_borrower_profile()
returns trigger as $$
begin
  if new.role = 'borrower' or (new.role::text) = 'customer' then
    insert into borrowers (id, organization_id, full_name, email, phone, verification_status, created_at, updated_at)
    values (new.id, new.org_id, coalesce(new.full_name, 'Borrower'), coalesce(new.email, ''), new.phone, new.verification_status, new.created_at, new.updated_at)
    on conflict (id) do update set
      organization_id = excluded.organization_id,
      full_name = excluded.full_name,
      email = excluded.email,
      phone = excluded.phone,
      verification_status = excluded.verification_status,
      updated_at = now();
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_sync_borrower_profile on profiles;
create trigger trg_sync_borrower_profile
  after insert or update on profiles
  for each row
  execute function sync_borrower_profile();

-- Initial population of borrowers table from existing profiles
insert into borrowers (id, organization_id, full_name, email, phone, verification_status, created_at, updated_at)
select id, org_id, coalesce(full_name, 'Borrower'), coalesce(email, ''), phone, verification_status, created_at, updated_at
from profiles
where role = 'borrower' or (role::text) = 'customer'
on conflict (id) do update set
  organization_id = excluded.organization_id,
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  verification_status = excluded.verification_status,
  updated_at = now();

-- 4. CLEANUP EXISTING LEGACY LOAN DURATIONS BEFORE APPLYING CONSTRAINT
update loans
set duration_days = 7
where duration_days not in (7, 14, 21);

-- LOANS DURATION CONSTRAINT & AUTO-CALCULATE TRIGGER
alter table loans drop constraint if exists check_loans_duration_tier;
alter table loans add constraint check_loans_duration_tier check (duration_days in (7, 14, 21));

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

-- 5. ROW LEVEL SECURITY
alter table borrowers enable row level security;
alter table loan_payments enable row level security;

drop policy if exists borrowers_select_all on borrowers;
drop policy if exists borrowers_insert_all on borrowers;
drop policy if exists borrowers_update_all on borrowers;
create policy borrowers_select_all on borrowers for select using (true);
create policy borrowers_insert_all on borrowers for insert with check (true);
create policy borrowers_update_all on borrowers for update using (true) with check (true);

drop policy if exists loan_payments_select_all on loan_payments;
drop policy if exists loan_payments_insert_all on loan_payments;
drop policy if exists loan_payments_update_all on loan_payments;
create policy loan_payments_select_all on loan_payments for select using (true);
create policy loan_payments_insert_all on loan_payments for insert with check (true);
create policy loan_payments_update_all on loan_payments for update using (true) with check (true);

-- 6. RELOAD SCHEMA CACHE IN POSTGREST
notify pgrst, 'reload schema';

-- =====================================================================
-- Migration 0003: Superadmin Security & Row Level Security Policies
-- =====================================================================

-- ---------------------------------------------------------------------
-- HELPER FUNCTIONS (Security Definer)
-- ---------------------------------------------------------------------
create or replace function auth_org_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select org_id from profiles where id = auth.uid();
$$;

create or replace function auth_is_superadmin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'superadmin'
  );
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

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY ACTIVATION
-- ---------------------------------------------------------------------
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table loans enable row level security;
alter table agreements enable row level security;
alter table notifications enable row level security;

-- ---------------------------------------------------------------------
-- ORGANIZATIONS POLICIES
-- ---------------------------------------------------------------------
create policy org_select_all on organizations
  for select using (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy org_insert_all on organizations
  for insert with check (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy org_superadmin_all on organizations
  for all using (auth_is_superadmin())
  with check (auth_is_superadmin());

-- ---------------------------------------------------------------------
-- PROFILES POLICIES
-- ---------------------------------------------------------------------
create policy profiles_select_own on profiles
  for select using (id = auth.uid());

create policy profiles_select_org_lender on profiles
  for select using (auth_is_lender() and org_id = auth_org_id());

create policy profiles_select_superadmin on profiles
  for select using (auth_is_superadmin());

create policy profiles_insert_self on profiles
  for insert with check (id = auth.uid());

create policy profiles_update_own on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role in ('borrower', 'customer'));

create policy profiles_update_lender on profiles
  for update using (auth_is_lender() and org_id = auth_org_id())
  with check (org_id = auth_org_id());

create policy profiles_update_superadmin on profiles
  for update using (auth_is_superadmin())
  with check (auth_is_superadmin());

-- ---------------------------------------------------------------------
-- LOANS POLICIES
-- ---------------------------------------------------------------------
create policy loans_select_borrower on loans
  for select using (borrower_id = auth.uid());

create policy loans_select_lender on loans
  for select using (auth_is_lender() and org_id = auth_org_id());

create policy loans_select_superadmin on loans
  for select using (auth_is_superadmin());

create policy loans_insert_borrower on loans
  for insert with check (
    borrower_id = auth.uid()
    and org_id = auth_org_id()
    and exists (
      select 1 from profiles
      where id = auth.uid() and verification_status = 'verified'
    )
  );

create policy loans_update_borrower on loans
  for update using (borrower_id = auth.uid())
  with check (borrower_id = auth.uid());

create policy loans_update_lender on loans
  for update using (auth_is_lender() and org_id = auth_org_id())
  with check (org_id = auth_org_id());

create policy loans_update_superadmin on loans
  for update using (auth_is_superadmin())
  with check (auth_is_superadmin());

-- ---------------------------------------------------------------------
-- AGREEMENTS POLICIES
-- ---------------------------------------------------------------------
create policy agreements_select_borrower on agreements
  for select using (
    exists (
      select 1 from loans
      where loans.id = agreements.loan_id and loans.borrower_id = auth.uid()
    )
  );

create policy agreements_select_lender on agreements
  for select using (auth_is_lender() and org_id = auth_org_id());

create policy agreements_write_lender on agreements
  for all using (auth_is_lender() and org_id = auth_org_id())
  with check (org_id = auth_org_id());

create policy agreements_superadmin_all on agreements
  for all using (auth_is_superadmin())
  with check (auth_is_superadmin());

-- ---------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- ---------------------------------------------------------------------
create policy notifications_select_own on notifications
  for select using (user_id = auth.uid());

create policy notifications_update_own on notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notifications_insert_org on notifications
  for insert with check (org_id = auth_org_id());

create policy notifications_superadmin_all on notifications
  for all using (auth_is_superadmin())
  with check (auth_is_superadmin());

-- ---------------------------------------------------------------------
-- STORAGE BUCKETS & POLICIES
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('verification-docs', 'verification-docs', false),
  ('payment-proofs', 'payment-proofs', false),
  ('agreements', 'agreements', false)
on conflict (id) do nothing;

create policy storage_verification_docs on storage.objects
  for all using (
    bucket_id = 'verification-docs'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or auth_is_lender()
      or auth_is_superadmin()
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
      or auth_is_lender()
      or auth_is_superadmin()
    )
  )
  with check (bucket_id = 'payment-proofs');

create policy storage_agreements on storage.objects
  for select using (bucket_id = 'agreements');

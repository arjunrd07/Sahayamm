-- Migration: Strict RBAC and Organization Multi-Tenancy RLS Policies

-- Helper function to get the current authenticated user's profile role and org_id
create or replace function auth_user_profile()
returns table (user_id uuid, role user_role, org_id uuid) as $$
  select id as user_id, role, org_id from profiles where id = auth.uid();
$$ language sql security definer stable;

-- 1. LOANS TABLE RLS POLICIES
alter table loans enable row level security;

drop policy if exists loans_select_all on loans;
drop policy if exists loans_insert_all on loans;
drop policy if exists loans_update_all on loans;
drop policy if exists loans_delete_all on loans;

-- SELECT Policy for Loans
create policy loans_select_rbac on loans for select using (
  exists (
    select 1 from auth_user_profile() p
    where p.role = 'superadmin'
       or (p.role in ('lender', 'admin') and loans.org_id = p.org_id)
       or (p.role = 'borrower' and loans.customer_id = auth.uid() and loans.org_id = p.org_id)
  )
);

-- INSERT Policy for Loans (Borrowers insert for themselves in their org)
create policy loans_insert_rbac on loans for insert with check (
  exists (
    select 1 from auth_user_profile() p
    where p.role = 'superadmin'
       or (loans.customer_id = auth.uid() and loans.org_id = p.org_id)
  )
);

-- UPDATE Policy for Loans (Lenders in org or Superadmin)
create policy loans_update_rbac on loans for update using (
  exists (
    select 1 from auth_user_profile() p
    where p.role = 'superadmin'
       or (p.role in ('lender', 'admin') and loans.org_id = p.org_id)
       or (p.role = 'borrower' and loans.customer_id = auth.uid() and loans.org_id = p.org_id)
  )
);

-- 2. PROFILES TABLE RLS POLICIES
alter table profiles enable row level security;

drop policy if exists profiles_select_all on profiles;
drop policy if exists profiles_insert_all on profiles;
drop policy if exists profiles_update_all on profiles;

create policy profiles_select_rbac on profiles for select using (
  exists (
    select 1 from auth_user_profile() p
    where p.role = 'superadmin'
       or profiles.id = auth.uid()
       or (p.role in ('lender', 'admin') and profiles.org_id = p.org_id)
  )
);

create policy profiles_insert_rbac on profiles for insert with check (
  profiles.id = auth.uid() or exists (select 1 from auth_user_profile() p where p.role = 'superadmin')
);

create policy profiles_update_rbac on profiles for update using (
  profiles.id = auth.uid()
  or exists (
    select 1 from auth_user_profile() p
    where p.role = 'superadmin'
       or (p.role in ('lender', 'admin') and profiles.org_id = p.org_id)
  )
);

-- 3. NOTIFICATIONS TABLE RLS POLICIES
alter table notifications enable row level security;

drop policy if exists notifications_select_all on notifications;
drop policy if exists notifications_insert_all on notifications;
drop policy if exists notifications_update_all on notifications;

create policy notifications_select_rbac on notifications for select using (
  notifications.user_id = auth.uid() or exists (select 1 from auth_user_profile() p where p.role = 'superadmin')
);

create policy notifications_insert_rbac on notifications for insert with check (true);
create policy notifications_update_rbac on notifications for update using (
  notifications.user_id = auth.uid() or exists (select 1 from auth_user_profile() p where p.role = 'superadmin')
);

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';

-- =====================================================================
-- Migration 0002: First Employee Superadmin Trigger
-- Rule: The first employee signing up for an organization becomes the Superadmin.
-- =====================================================================

create or replace function handle_first_user_superadmin()
returns trigger as $$
declare
  profile_count integer;
begin
  -- Count existing profiles in the same organization
  select count(*) into profile_count
  from public.profiles
  where org_id = new.org_id;

  -- If this is the first profile for the organization, promote to superadmin and mark verified automatically
  if profile_count = 0 then
    new.role := 'superadmin';
    new.verification_status := 'verified';
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger before profile insertion
drop trigger if exists trg_profiles_first_user_superadmin on public.profiles;
create trigger trg_profiles_first_user_superadmin
  before insert on public.profiles
  for each row
  execute function handle_first_user_superadmin();

-- Migration: Create auth_otps table for storing email OTP verification codes
create table if not exists auth_otps (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  code text not null,
  type text not null check (type in ('signup', 'forgot_password')),
  expires_at timestamptz not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index for fast lookup by email, type, and code
create index if not exists idx_auth_otps_lookup on auth_otps (email, type, code);

-- Enable RLS
alter table auth_otps enable row level security;

-- Only service role client (server actions) needs access
drop policy if exists auth_otps_service_access on auth_otps;
create policy auth_otps_service_access on auth_otps for all using (true) with check (true);

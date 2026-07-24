-- =====================================================================
-- Migration 0004: Seed Data
-- =====================================================================

insert into public.organizations (id, name, code)
values
  ('11111111-1111-1111-1111-111111111111', 'Acme Corporation', 'ACME'),
  ('22222222-2222-2222-2222-222222222222', 'Stark Industries', 'STARK'),
  ('33333333-3333-3333-3333-333333333333', 'Sahayam Platform Demo Org', 'SAHAYAM')
on conflict (code) do nothing;

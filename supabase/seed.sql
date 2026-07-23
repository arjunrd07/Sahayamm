-- Sample organizations for local development / demo signup.
-- Admin accounts are NOT seeded here — per spec, an admin never
-- self-registers. Create an admin by:
--   1. Creating the auth user (Supabase Dashboard > Authentication, or
--      supabase.auth.admin.createUser via the service role key).
--   2. Inserting/updating their row in `profiles` with role = 'admin'
--      and the correct org_id below.

insert into organizations (name, code) values
  ('Aharyas Textiles', 'AHARYAS'),
  ('Woxsen University', 'WOXSEN'),
  ('Invezoro Technologies', 'INVEZORO')
on conflict (code) do nothing;

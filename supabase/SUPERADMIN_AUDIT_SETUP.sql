-- =====================================================================
-- Sahayam Superadmin & Audit Logs Setup Migration
-- Execute this script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- to ensure audit logging and superadmin schema columns are active.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. AUDIT LOGS TABLE FOR COMPLIANCE & PLATFORM OVERSIGHT
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT DEFAULT 'system',
  entity_id TEXT,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view audit logs
DROP POLICY IF EXISTS "Allow authenticated read audit_logs" ON public.audit_logs;
CREATE POLICY "Allow authenticated read audit_logs" ON public.audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role / full access for inserting audit events
DROP POLICY IF EXISTS "Allow full access audit_logs" ON public.audit_logs;
CREATE POLICY "Allow full access audit_logs" ON public.audit_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 2. ORGANIZATIONS SCHEMA EXTENSIONS (Soft Delete & Liquidity Limit)
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS max_loan_amount NUMERIC(14,2) NOT NULL DEFAULT 2500000.00,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- 3. PROFILES SCHEMA EXTENSIONS
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mobile_number TEXT,
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_loan_amount NUMERIC(14,2);

-- 4. SEED SUPERADMIN USER IN AUTH & PROFILES (CONFLICT SAFE)
DO $$
DECLARE
  super_uid UUID := 'a0000000-0000-0000-0000-000000000001';
BEGIN
  -- Insert or update auth user safely
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = super_uid OR email ILIKE 'Superadmin@gmail.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      super_uid,
      '00000000-0000-0000-0000-000000000000',
      'Superadmin@gmail.com',
      crypt('Superadmin@Sahayamm', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Sahayam Superadmin","role":"superadmin"}',
      now(), now(), 'authenticated', 'authenticated'
    );
  ELSE
    -- Update email & password if ID already existed
    UPDATE auth.users
    SET email = 'Superadmin@gmail.com',
        encrypted_password = crypt('Superadmin@Sahayamm', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name":"Sahayam Superadmin","role":"superadmin"}'
    WHERE id = super_uid OR email ILIKE 'Superadmin@gmail.com';
  END IF;

  -- Insert or update profile row
  INSERT INTO public.profiles (
    id, email, full_name, role, is_verified, verification_status, kyc_completed
  ) VALUES (
    (SELECT id FROM auth.users WHERE email ILIKE 'Superadmin@gmail.com' LIMIT 1),
    'Superadmin@gmail.com',
    'Sahayam Superadmin',
    'superadmin',
    true,
    'verified',
    true
  ) ON CONFLICT (id) DO UPDATE SET 
    email = 'Superadmin@gmail.com',
    role = 'superadmin', 
    is_verified = true, 
    verification_status = 'verified',
    kyc_completed = true;
END $$;

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

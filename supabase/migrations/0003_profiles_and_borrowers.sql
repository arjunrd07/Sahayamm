-- Migration 0003: User Profiles and Borrowers Tables across Master DB, Org Schema, and Public Schema

-- 1. Master DB Schema Tables
CREATE TABLE IF NOT EXISTS master_db.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES master_db.organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES master_db.campuses(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role USER_ROLE NOT NULL DEFAULT 'borrower',
  verification_status VERIFICATION_STATUS NOT NULL DEFAULT 'unverified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_db.borrowers (
  id UUID PRIMARY KEY REFERENCES master_db.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES master_db.organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES master_db.campuses(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  verification_status VERIFICATION_STATUS NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Organization-Campus Schema (org_rmse_waverock) Tables
CREATE TABLE IF NOT EXISTS org_rmse_waverock.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES org_rmse_waverock.organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES org_rmse_waverock.campuses(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role USER_ROLE NOT NULL DEFAULT 'borrower',
  verification_status VERIFICATION_STATUS NOT NULL DEFAULT 'unverified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_rmse_waverock.borrowers (
  id UUID PRIMARY KEY REFERENCES org_rmse_waverock.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES org_rmse_waverock.organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES org_rmse_waverock.campuses(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  verification_status VERIFICATION_STATUS NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Public Schema Tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  pan_number TEXT,
  cibil_score INTEGER,
  address TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  emergency_name TEXT,
  emergency_phone TEXT,
  emergency_relation TEXT,
  kyc_completed BOOLEAN NOT NULL DEFAULT FALSE,
  role USER_ROLE NOT NULL DEFAULT 'borrower',
  verification_status VERIFICATION_STATUS NOT NULL DEFAULT 'unverified',
  rejection_reason TEXT,
  id_proof_url TEXT,
  employment_proof_url TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.borrowers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  verification_status VERIFICATION_STATUS NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.borrowers ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_org_campus ON public.profiles(org_id, campus_id);

-- Trigger to auto-sync profiles -> master_db, org_rmse_waverock, and public borrowers table
CREATE OR REPLACE FUNCTION sync_borrower_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Sync to master_db.profiles
  INSERT INTO master_db.profiles (id, org_id, campus_id, full_name, email, phone, role, verification_status, created_at, updated_at)
  VALUES (new.id, new.org_id, new.campus_id, COALESCE(new.full_name, 'User'), COALESCE(new.email, ''), new.phone, new.role, new.verification_status, new.created_at, new.updated_at)
  ON CONFLICT (id) DO UPDATE SET
    org_id = EXCLUDED.org_id,
    campus_id = EXCLUDED.campus_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    verification_status = EXCLUDED.verification_status,
    updated_at = NOW();

  -- 2. Sync to org_rmse_waverock.profiles
  INSERT INTO org_rmse_waverock.profiles (id, org_id, campus_id, full_name, email, phone, role, verification_status, created_at, updated_at)
  VALUES (new.id, new.org_id, new.campus_id, COALESCE(new.full_name, 'User'), COALESCE(new.email, ''), new.phone, new.role, new.verification_status, new.created_at, new.updated_at)
  ON CONFLICT (id) DO UPDATE SET
    org_id = EXCLUDED.org_id,
    campus_id = EXCLUDED.campus_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    verification_status = EXCLUDED.verification_status,
    updated_at = NOW();

  -- 3. Sync to borrowers
  IF new.role = 'borrower' THEN
    INSERT INTO master_db.borrowers (id, organization_id, campus_id, full_name, email, phone, verification_status, created_at, updated_at)
    VALUES (new.id, new.org_id, new.campus_id, COALESCE(new.full_name, 'Borrower'), COALESCE(new.email, ''), new.phone, new.verification_status, new.created_at, new.updated_at)
    ON CONFLICT (id) DO UPDATE SET
      organization_id = EXCLUDED.organization_id,
      campus_id = EXCLUDED.campus_id,
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      verification_status = EXCLUDED.verification_status,
      updated_at = NOW();

    INSERT INTO org_rmse_waverock.borrowers (id, organization_id, campus_id, full_name, email, phone, verification_status, created_at, updated_at)
    VALUES (new.id, new.org_id, new.campus_id, COALESCE(new.full_name, 'Borrower'), COALESCE(new.email, ''), new.phone, new.verification_status, new.created_at, new.updated_at)
    ON CONFLICT (id) DO UPDATE SET
      organization_id = EXCLUDED.organization_id,
      campus_id = EXCLUDED.campus_id,
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      verification_status = EXCLUDED.verification_status,
      updated_at = NOW();

    INSERT INTO public.borrowers (id, organization_id, campus_id, full_name, email, phone, verification_status, created_at, updated_at)
    VALUES (new.id, new.org_id, new.campus_id, COALESCE(new.full_name, 'Borrower'), COALESCE(new.email, ''), new.phone, new.verification_status, new.created_at, new.updated_at)
    ON CONFLICT (id) DO UPDATE SET
      organization_id = EXCLUDED.organization_id,
      campus_id = EXCLUDED.campus_id,
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      verification_status = EXCLUDED.verification_status,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_borrower_profile ON public.profiles;
CREATE TRIGGER trg_sync_borrower_profile
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_borrower_profile();

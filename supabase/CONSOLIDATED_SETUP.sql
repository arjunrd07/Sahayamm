-- ====================================================================
-- SAHAYAM PLATFORM CONSOLIDATED DATABASE SETUP & RESET SCRIPT
-- Run this single file in Supabase SQL Editor to wipe legacy data
-- and deploy the complete Master DB & Campus Schema architecture.
-- ====================================================================

-- STEP 1: EXTENSIONS, SCHEMAS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS master_db;
CREATE SCHEMA IF NOT EXISTS org_rmse_waverock;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('borrower', 'lender', 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loan_status') THEN
    CREATE TYPE loan_status AS ENUM ('pending', 'approved', 'rejected', 'active', 'completed', 'overdue');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agreement_status') THEN
    CREATE TYPE agreement_status AS ENUM ('draft', 'sent', 'partially_signed', 'completed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'verification_decision',
      'loan_requested',
      'loan_approved',
      'loan_rejected',
      'agreement_ready',
      'agreement_signed',
      'funds_sent',
      'repayment_reminder',
      'loan_completed',
      'loan_overdue'
    );
  END IF;
END $$;

-- STEP 2: ORGANIZATIONS & CAMPUSES
CREATE TABLE IF NOT EXISTS master_db.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_db.campuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES master_db.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, code)
);

CREATE TABLE IF NOT EXISTS org_rmse_waverock.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_rmse_waverock.campuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES org_rmse_waverock.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, code)
);

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.campuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, code)
);

INSERT INTO master_db.organizations (id, name, code)
VALUES ('00000000-0000-0000-0000-000000000001', 'RMSE', 'rmse')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

INSERT INTO master_db.campuses (id, org_id, name, code)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Waverock Campus', 'waverock')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

INSERT INTO org_rmse_waverock.organizations (id, name, code)
VALUES ('00000000-0000-0000-0000-000000000001', 'RMSE', 'rmse')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

INSERT INTO org_rmse_waverock.campuses (id, org_id, name, code)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Waverock Campus', 'waverock')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

INSERT INTO public.organizations (id, name, code)
VALUES ('00000000-0000-0000-0000-000000000001', 'RMSE', 'rmse')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

INSERT INTO public.campuses (id, org_id, name, code)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Waverock Campus', 'waverock')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

-- STEP 3: PROFILES & BORROWERS
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

-- Sync Trigger
CREATE OR REPLACE FUNCTION sync_borrower_profile()
RETURNS TRIGGER AS $$
BEGIN
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

-- STEP 4: LOANS, PAYMENTS & AGREEMENTS
CREATE TABLE IF NOT EXISTS master_db.loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES master_db.organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES master_db.campuses(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES master_db.profiles(id) ON DELETE RESTRICT,
  borrower_id UUID REFERENCES master_db.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  purpose TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days IN (7, 14, 21)),
  status LOAN_STATUS NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_db.loan_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES master_db.loans(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES master_db.organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES master_db.campuses(id) ON DELETE SET NULL,
  borrower_id UUID NOT NULL REFERENCES master_db.profiles(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES master_db.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_proof_url TEXT NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'repayment',
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_db.agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES master_db.organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES master_db.campuses(id) ON DELETE SET NULL,
  loan_id UUID NOT NULL REFERENCES master_db.loans(id) ON DELETE CASCADE UNIQUE,
  agreement_number TEXT NOT NULL UNIQUE,
  docuseal_submission_id TEXT,
  pdf_url TEXT,
  borrower_signed BOOLEAN NOT NULL DEFAULT FALSE,
  lender_signed BOOLEAN NOT NULL DEFAULT FALSE,
  status AGREEMENT_STATUS NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_rmse_waverock.loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES org_rmse_waverock.organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES org_rmse_waverock.campuses(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES org_rmse_waverock.profiles(id) ON DELETE RESTRICT,
  borrower_id UUID REFERENCES org_rmse_waverock.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  purpose TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days IN (7, 14, 21)),
  status LOAN_STATUS NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_rmse_waverock.loan_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES org_rmse_waverock.loans(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES org_rmse_waverock.organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES org_rmse_waverock.campuses(id) ON DELETE SET NULL,
  borrower_id UUID REFERENCES org_rmse_waverock.profiles(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES org_rmse_waverock.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_proof_url TEXT NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'repayment',
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_rmse_waverock.agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES org_rmse_waverock.organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES org_rmse_waverock.campuses(id) ON DELETE SET NULL,
  loan_id UUID NOT NULL REFERENCES org_rmse_waverock.loans(id) ON DELETE CASCADE UNIQUE,
  agreement_number TEXT NOT NULL UNIQUE,
  docuseal_submission_id TEXT,
  pdf_url TEXT,
  borrower_signed BOOLEAN NOT NULL DEFAULT FALSE,
  lender_signed BOOLEAN NOT NULL DEFAULT FALSE,
  status AGREEMENT_STATUS NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  borrower_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  admin_id UUID REFERENCES public.profiles(id),
  lender_id UUID REFERENCES public.profiles(id),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  purpose TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days IN (7, 14, 21)),
  interest_rate_annual NUMERIC(6,3) NOT NULL DEFAULT 0,
  calculated_interest NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_repayment NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_date DATE,
  status LOAN_STATUS NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  disbursal_proof_url TEXT,
  disbursed_at TIMESTAMPTZ,
  repayment_proof_url TEXT,
  repayment_submitted_at TIMESTAMPTZ,
  late_fee_rate NUMERIC(6,3),
  late_fee_amount NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  active_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.loan_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
  borrower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_proof_url TEXT NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'repayment',
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE UNIQUE,
  agreement_number TEXT NOT NULL UNIQUE,
  docuseal_submission_id TEXT,
  pdf_url TEXT,
  borrower_signed BOOLEAN NOT NULL DEFAULT FALSE,
  borrower_signed_at TIMESTAMPTZ,
  lender_signed BOOLEAN NOT NULL DEFAULT FALSE,
  lender_signed_at TIMESTAMPTZ,
  status AGREEMENT_STATUS NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loan Calc & Mirror Trigger
CREATE OR REPLACE FUNCTION calculate_loan_interest_tier()
RETURNS TRIGGER AS $$
DECLARE
  rate_percent NUMERIC;
BEGIN
  IF new.customer_id IS NOT NULL AND new.borrower_id IS NULL THEN
    new.borrower_id := new.customer_id;
  ELSIF new.borrower_id IS NOT NULL AND new.customer_id IS NULL THEN
    new.customer_id := new.borrower_id;
  END IF;

  IF new.duration_days = 7 THEN
    rate_percent := 0.4;
  ELSIF new.duration_days = 14 THEN
    rate_percent := 0.8;
  ELSIF new.duration_days = 21 THEN
    rate_percent := 1.4;
  ELSE
    RAISE EXCEPTION 'Invalid loan duration. Duration must be 7, 14, or 21 days.';
  END IF;

  new.interest_rate_annual := ROUND(((rate_percent / new.duration_days) * 365)::NUMERIC, 3);
  new.calculated_interest := ROUND((new.amount * rate_percent / 100)::NUMERIC, 2);
  new.total_repayment := ROUND((new.amount + new.calculated_interest)::NUMERIC, 2);

  IF new.due_date IS NULL THEN
    new.due_date := (CURRENT_DATE + new.duration_days);
  END IF;

  INSERT INTO master_db.loans (id, org_id, campus_id, customer_id, borrower_id, amount, purpose, duration_days, status, created_at)
  VALUES (new.id, new.org_id, new.campus_id, new.customer_id, new.borrower_id, new.amount, new.purpose, new.duration_days, new.status, new.created_at)
  ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, amount = EXCLUDED.amount;

  INSERT INTO org_rmse_waverock.loans (id, org_id, campus_id, customer_id, borrower_id, amount, purpose, duration_days, status, created_at)
  VALUES (new.id, new.org_id, new.campus_id, new.customer_id, new.borrower_id, new.amount, new.purpose, new.duration_days, new.status, new.created_at)
  ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, amount = EXCLUDED.amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_loans_auto_calculate_interest ON public.loans;
CREATE TRIGGER trg_loans_auto_calculate_interest
  BEFORE INSERT OR UPDATE OF amount, duration_days ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION calculate_loan_interest_tier();

-- STEP 5: NOTIFICATIONS, OTPS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS master_db.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES master_db.organizations(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES master_db.campuses(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES master_db.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type NOTIFICATION_TYPE NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_db.auth_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_db.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES master_db.organizations(id) ON DELETE SET NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_rmse_waverock.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES org_rmse_waverock.organizations(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES org_rmse_waverock.campuses(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES org_rmse_waverock.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type NOTIFICATION_TYPE NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  loan_id UUID REFERENCES public.loans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type NOTIFICATION_TYPE NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.auth_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 6: RLS POLICIES & SECURITY
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role = 'admin'
  );
$$;

ALTER TABLE master_db.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_db.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_db.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_db.borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_db.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_db.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_db.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_db.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_db.auth_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_db.audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE org_rmse_waverock.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_rmse_waverock.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_rmse_waverock.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_rmse_waverock.borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_rmse_waverock.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_rmse_waverock.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_rmse_waverock.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_rmse_waverock.notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY master_org_select ON master_db.organizations FOR SELECT USING (true);
CREATE POLICY master_campuses_select ON master_db.campuses;
CREATE POLICY master_profiles_select ON master_db.profiles FOR SELECT USING (auth_is_admin() OR org_id = auth_org_id() OR id = auth.uid());
CREATE POLICY master_loans_select ON master_db.loans FOR SELECT USING (auth_is_admin() OR org_id = auth_org_id() OR borrower_id = auth.uid() OR customer_id = auth.uid());

CREATE POLICY org_loans_select ON org_rmse_waverock.loans FOR SELECT USING (auth_is_admin() OR org_id = auth_org_id() OR borrower_id = auth.uid() OR customer_id = auth.uid());

CREATE POLICY org_policy_select ON public.organizations FOR SELECT USING (true);
CREATE POLICY org_policy_all_admin ON public.organizations FOR ALL USING (auth_is_admin());

CREATE POLICY campus_policy_select ON public.campuses FOR SELECT USING (true);
CREATE POLICY campus_policy_all_admin ON public.campuses FOR ALL USING (auth_is_admin());

CREATE POLICY profiles_policy_select ON public.profiles FOR SELECT USING (auth_is_admin() OR org_id = auth_org_id() OR id = auth.uid());
CREATE POLICY profiles_policy_insert ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY profiles_policy_update ON public.profiles FOR UPDATE USING (auth_is_admin() OR org_id = auth_org_id() OR id = auth.uid());

CREATE POLICY borrowers_policy_select ON public.borrowers FOR SELECT USING (auth_is_admin() OR organization_id = auth_org_id() OR id = auth.uid());
CREATE POLICY borrowers_policy_insert ON public.borrowers FOR INSERT WITH CHECK (true);
CREATE POLICY borrowers_policy_update ON public.borrowers FOR UPDATE USING (auth_is_admin() OR organization_id = auth_org_id() OR id = auth.uid());

CREATE POLICY loans_policy_select ON public.loans FOR SELECT USING (auth_is_admin() OR org_id = auth_org_id() OR borrower_id = auth.uid() OR customer_id = auth.uid() OR lender_id = auth.uid() OR admin_id = auth.uid());
CREATE POLICY loans_policy_insert ON public.loans FOR INSERT WITH CHECK (auth_is_admin() OR org_id = auth_org_id());
CREATE POLICY loans_policy_update ON public.loans FOR UPDATE USING (auth_is_admin() OR org_id = auth_org_id());

CREATE POLICY payments_policy_select ON public.loan_payments FOR SELECT USING (auth_is_admin() OR org_id = auth_org_id() OR borrower_id = auth.uid() OR customer_id = auth.uid());
CREATE POLICY payments_policy_insert ON public.loan_payments FOR INSERT WITH CHECK (auth_is_admin() OR org_id = auth_org_id() OR borrower_id = auth.uid() OR customer_id = auth.uid());
CREATE POLICY payments_policy_update ON public.loan_payments FOR UPDATE USING (auth_is_admin() OR org_id = auth_org_id());

CREATE POLICY agreements_policy_select ON public.agreements FOR SELECT USING (auth_is_admin() OR org_id = auth_org_id());
CREATE POLICY agreements_policy_insert ON public.agreements FOR INSERT WITH CHECK (auth_is_admin() OR org_id = auth_org_id());
CREATE POLICY agreements_policy_update ON public.agreements FOR UPDATE USING (auth_is_admin() OR org_id = auth_org_id());

CREATE POLICY notifications_policy_select ON public.notifications FOR SELECT USING (auth_is_admin() OR user_id = auth.uid() OR org_id = auth_org_id());
CREATE POLICY notifications_policy_insert ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY notifications_policy_update ON public.notifications FOR UPDATE USING (auth_is_admin() OR user_id = auth.uid());

CREATE POLICY otps_policy_all ON public.auth_otps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY audit_policy_all ON public.audit_logs FOR ALL USING (auth_is_admin());

NOTIFY pgrst, 'reload schema';

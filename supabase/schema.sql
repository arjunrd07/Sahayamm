-- =====================================================================
-- Sahayam Master Database Schema Script
-- Roles: borrower, lender, admin
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUM TYPES
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

-- 2. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CAMPUSES
CREATE TABLE IF NOT EXISTS campuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, code)
);

-- 4. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
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
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. BORROWERS
CREATE TABLE IF NOT EXISTS borrowers (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  verification_status VERIFICATION_STATUS NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. LOANS
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
  borrower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  lender_id UUID REFERENCES profiles(id),
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

-- 7. LOAN PAYMENTS
CREATE TABLE IF NOT EXISTS loan_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
  borrower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_proof_url TEXT NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'repayment',
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. AGREEMENTS
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE UNIQUE,
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

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type NOTIFICATION_TYPE NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. AUTH OTPS TABLE
CREATE TABLE IF NOT EXISTS auth_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. SECURITY & TENANCY HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
      AND role = 'admin'
  );
$$;

NOTIFY pgrst, 'reload schema';

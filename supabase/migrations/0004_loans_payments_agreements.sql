-- Migration 0004: Loans, Loan Payments, and Agreements Tables across Master DB, Org Schema, and Public Schema

-- 1. Master DB Schema Tables
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

-- 2. Organization-Campus Schema (org_rmse_waverock) Tables
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
  borrower_id UUID NOT NULL REFERENCES org_rmse_waverock.profiles(id) ON DELETE RESTRICT,
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

-- 3. Public Schema Tables
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

ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS borrower_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT;

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

ALTER TABLE public.loan_payments ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL;
ALTER TABLE public.loan_payments ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.loan_payments ADD COLUMN IF NOT EXISTS borrower_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT;

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

ALTER TABLE public.agreements ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_loans_org_campus_status ON public.loans(org_id, campus_id, status);

-- Trigger: Auto calculate loan interest & repayment and mirror across master_db and org_rmse_waverock schemas
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

  -- 1. Sync to master_db.loans
  INSERT INTO master_db.loans (id, org_id, campus_id, customer_id, borrower_id, amount, purpose, duration_days, status, created_at)
  VALUES (new.id, new.org_id, new.campus_id, new.customer_id, new.borrower_id, new.amount, new.purpose, new.duration_days, new.status, new.created_at)
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    amount = EXCLUDED.amount;

  -- 2. Sync to org_rmse_waverock.loans
  INSERT INTO org_rmse_waverock.loans (id, org_id, campus_id, customer_id, borrower_id, amount, purpose, duration_days, status, created_at)
  VALUES (new.id, new.org_id, new.campus_id, new.customer_id, new.borrower_id, new.amount, new.purpose, new.duration_days, new.status, new.created_at)
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    amount = EXCLUDED.amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_loans_auto_calculate_interest ON public.loans;
CREATE TRIGGER trg_loans_auto_calculate_interest
  BEFORE INSERT OR UPDATE OF amount, duration_days ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION calculate_loan_interest_tier();

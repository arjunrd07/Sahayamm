-- Migration 0007: Migrate database nomenclature to Borrower and Lender
-- 1. Ensure user_role enum includes 'borrower' and 'lender'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'borrower';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'lender';

-- 2. Update existing profile role strings
UPDATE public.profiles SET role = 'borrower' WHERE role = 'customer';
UPDATE public.profiles SET role = 'lender' WHERE role = 'admin';

-- 3. Rename columns in loans table if old names exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'customer_id') THEN
    ALTER TABLE public.loans RENAME COLUMN customer_id TO borrower_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'admin_id') THEN
    ALTER TABLE public.loans RENAME COLUMN admin_id TO lender_id;
  END IF;
END $$;

-- 4. Re-create indexes with updated names
DROP INDEX IF EXISTS idx_loans_customer;
DROP INDEX IF EXISTS idx_loans_admin;
CREATE INDEX IF NOT EXISTS idx_loans_borrower ON public.loans(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loans_lender ON public.loans(lender_id);

-- 5. Helper function auth_is_lender
CREATE OR REPLACE FUNCTION auth_is_lender()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('lender', 'admin', 'superadmin')
  );
$$;

-- Alias for auth_is_admin for backwards compatibility
CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth_is_lender();
$$;

-- 6. Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Migration 0006: Helper Security Functions, RLS Enablement, and Policies across Master DB, Org Schemas, and Public Schema

-- Security & Multi-Tenancy Helper Functions
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

-- 1. Enable Row Level Security Across Master DB Tables
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

-- 2. Enable Row Level Security Across Org Schema Tables (org_rmse_waverock)
ALTER TABLE org_rmse_waverock.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_rmse_waverock.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_rmse_waverock.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_rmse_waverock.borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_rmse_waverock.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_rmse_waverock.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_rmse_waverock.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_rmse_waverock.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Enable Row Level Security Across Public Schema Tables
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

-- Master DB Policies (Global Admin and Scoped Access)
DROP POLICY IF EXISTS master_org_select ON master_db.organizations;
CREATE POLICY master_org_select ON master_db.organizations FOR SELECT USING (true);

DROP POLICY IF EXISTS master_campuses_select ON master_db.campuses;
CREATE POLICY master_campuses_select ON master_db.campuses FOR SELECT USING (true);

DROP POLICY IF EXISTS master_profiles_select ON master_db.profiles;
CREATE POLICY master_profiles_select ON master_db.profiles FOR SELECT USING (
  auth_is_admin() OR org_id = auth_org_id() OR id = auth.uid()
);

DROP POLICY IF EXISTS master_loans_select ON master_db.loans;
CREATE POLICY master_loans_select ON master_db.loans FOR SELECT USING (
  auth_is_admin() OR org_id = auth_org_id() OR borrower_id = auth.uid() OR customer_id = auth.uid()
);

-- Org Schema Policies (org_rmse_waverock)
DROP POLICY IF EXISTS org_loans_select ON org_rmse_waverock.loans;
CREATE POLICY org_loans_select ON org_rmse_waverock.loans FOR SELECT USING (
  auth_is_admin() OR org_id = auth_org_id() OR borrower_id = auth.uid() OR customer_id = auth.uid()
);

-- Public Schema Policies
DROP POLICY IF EXISTS org_policy_select ON public.organizations;
DROP POLICY IF EXISTS org_policy_all_admin ON public.organizations;
CREATE POLICY org_policy_select ON public.organizations FOR SELECT USING (true);
CREATE POLICY org_policy_all_admin ON public.organizations FOR ALL USING (auth_is_admin());

DROP POLICY IF EXISTS campus_policy_select ON public.campuses;
DROP POLICY IF EXISTS campus_policy_all_admin ON public.campuses;
CREATE POLICY campus_policy_select ON public.campuses FOR SELECT USING (true);
CREATE POLICY campus_policy_all_admin ON public.campuses FOR ALL USING (auth_is_admin());

DROP POLICY IF EXISTS profiles_policy_select ON public.profiles;
DROP POLICY IF EXISTS profiles_policy_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_policy_update ON public.profiles;
CREATE POLICY profiles_policy_select ON public.profiles FOR SELECT USING (
  auth_is_admin() OR org_id = auth_org_id() OR id = auth.uid()
);
CREATE POLICY profiles_policy_insert ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY profiles_policy_update ON public.profiles FOR UPDATE USING (
  auth_is_admin() OR org_id = auth_org_id() OR id = auth.uid()
);

DROP POLICY IF EXISTS borrowers_policy_select ON public.borrowers;
DROP POLICY IF EXISTS borrowers_policy_insert ON public.borrowers;
DROP POLICY IF EXISTS borrowers_policy_update ON public.borrowers;
CREATE POLICY borrowers_policy_select ON public.borrowers FOR SELECT USING (
  auth_is_admin() OR organization_id = auth_org_id() OR id = auth.uid()
);
CREATE POLICY borrowers_policy_insert ON public.borrowers FOR INSERT WITH CHECK (true);
CREATE POLICY borrowers_policy_update ON public.borrowers FOR UPDATE USING (
  auth_is_admin() OR organization_id = auth_org_id() OR id = auth.uid()
);

DROP POLICY IF EXISTS loans_policy_select ON public.loans;
DROP POLICY IF EXISTS loans_policy_insert ON public.loans;
DROP POLICY IF EXISTS loans_policy_update ON public.loans;
CREATE POLICY loans_policy_select ON public.loans FOR SELECT USING (
  auth_is_admin() OR org_id = auth_org_id() OR borrower_id = auth.uid() OR customer_id = auth.uid() OR lender_id = auth.uid() OR admin_id = auth.uid()
);
CREATE POLICY loans_policy_insert ON public.loans FOR INSERT WITH CHECK (
  auth_is_admin() OR org_id = auth_org_id()
);
CREATE POLICY loans_policy_update ON public.loans FOR UPDATE USING (
  auth_is_admin() OR org_id = auth_org_id()
);

DROP POLICY IF EXISTS payments_policy_select ON public.loan_payments;
DROP POLICY IF EXISTS payments_policy_insert ON public.loan_payments;
DROP POLICY IF EXISTS payments_policy_update ON public.loan_payments;
CREATE POLICY payments_policy_select ON public.loan_payments FOR SELECT USING (
  auth_is_admin() OR org_id = auth_org_id() OR borrower_id = auth.uid() OR customer_id = auth.uid()
);
CREATE POLICY payments_policy_insert ON public.loan_payments FOR INSERT WITH CHECK (
  auth_is_admin() OR org_id = auth_org_id() OR borrower_id = auth.uid() OR customer_id = auth.uid()
);
CREATE POLICY payments_policy_update ON public.loan_payments FOR UPDATE USING (
  auth_is_admin() OR org_id = auth_org_id()
);

DROP POLICY IF EXISTS agreements_policy_select ON public.agreements;
DROP POLICY IF EXISTS agreements_policy_insert ON public.agreements;
DROP POLICY IF EXISTS agreements_policy_update ON public.agreements;
CREATE POLICY agreements_policy_select ON public.agreements FOR SELECT USING (
  auth_is_admin() OR org_id = auth_org_id()
);
CREATE POLICY agreements_policy_insert ON public.agreements FOR INSERT WITH CHECK (
  auth_is_admin() OR org_id = auth_org_id()
);
CREATE POLICY agreements_policy_update ON public.agreements FOR UPDATE USING (
  auth_is_admin() OR org_id = auth_org_id()
);

DROP POLICY IF EXISTS notifications_policy_select ON public.notifications;
DROP POLICY IF EXISTS notifications_policy_insert ON public.notifications;
DROP POLICY IF EXISTS notifications_policy_update ON public.notifications;
CREATE POLICY notifications_policy_select ON public.notifications FOR SELECT USING (
  auth_is_admin() OR user_id = auth.uid() OR org_id = auth_org_id()
);
CREATE POLICY notifications_policy_insert ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY notifications_policy_update ON public.notifications FOR UPDATE USING (
  auth_is_admin() OR user_id = auth.uid()
);

DROP POLICY IF EXISTS otps_policy_all ON public.auth_otps;
CREATE POLICY otps_policy_all ON public.auth_otps FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS audit_policy_all ON public.audit_logs;
CREATE POLICY audit_policy_all ON public.audit_logs FOR ALL USING (auth_is_admin());

NOTIFY pgrst, 'reload schema';

-- =====================================================================
-- Migration 0007: Fix Foreign Key Constraints on Organizations & Campuses
-- Replaces RESTRICT with ON DELETE SET NULL ON UPDATE CASCADE so that
-- updating or deleting organizations & campuses does not cause FK violations.
-- =====================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- 1. PUBLIC SCHEMA: PROFILES
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    FOR r IN (
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.profiles'::regclass AND contype = 'f'
      AND conname IN ('profile_org_id_fkey', 'profiles_org_id_fkey', 'profiles_org_id_fk')
    ) LOOP
      EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
    
    ALTER TABLE public.profiles
      ADD CONSTRAINT profile_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES public.organizations(id)
      ON DELETE SET NULL ON UPDATE CASCADE;

    FOR r IN (
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.profiles'::regclass AND contype = 'f'
      AND conname IN ('profile_campus_id_fkey', 'profiles_campus_id_fkey', 'profiles_campus_id_fk')
    ) LOOP
      EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
    
    ALTER TABLE public.profiles
      ADD CONSTRAINT profile_campus_id_fkey
      FOREIGN KEY (campus_id) REFERENCES public.campuses(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  -- 2. PUBLIC SCHEMA: BORROWERS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'borrowers') THEN
    ALTER TABLE public.borrowers ALTER COLUMN organization_id DROP NOT NULL;
    
    FOR r IN (
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.borrowers'::regclass AND contype = 'f'
      AND conname IN ('borrowers_organization_id_fkey', 'borrower_organization_id_fkey', 'borrowers_org_id_fkey')
    ) LOOP
      EXECUTE 'ALTER TABLE public.borrowers DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;

    ALTER TABLE public.borrowers
      ADD CONSTRAINT borrowers_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
      ON DELETE SET NULL ON UPDATE CASCADE;

    FOR r IN (
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.borrowers'::regclass AND contype = 'f'
      AND conname IN ('borrowers_campus_id_fkey', 'borrower_campus_id_fkey')
    ) LOOP
      EXECUTE 'ALTER TABLE public.borrowers DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;

    ALTER TABLE public.borrowers
      ADD CONSTRAINT borrowers_campus_id_fkey
      FOREIGN KEY (campus_id) REFERENCES public.campuses(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  -- 3. PUBLIC SCHEMA: LOANS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loans') THEN
    ALTER TABLE public.loans ALTER COLUMN org_id DROP NOT NULL;

    FOR r IN (
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.loans'::regclass AND contype = 'f'
      AND conname IN ('loans_org_id_fkey', 'loan_org_id_fkey')
    ) LOOP
      EXECUTE 'ALTER TABLE public.loans DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;

    ALTER TABLE public.loans
      ADD CONSTRAINT loans_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES public.organizations(id)
      ON DELETE SET NULL ON UPDATE CASCADE;

    FOR r IN (
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.loans'::regclass AND contype = 'f'
      AND conname IN ('loans_campus_id_fkey', 'loan_campus_id_fkey')
    ) LOOP
      EXECUTE 'ALTER TABLE public.loans DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;

    ALTER TABLE public.loans
      ADD CONSTRAINT loans_campus_id_fkey
      FOREIGN KEY (campus_id) REFERENCES public.campuses(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  -- 4. PUBLIC SCHEMA: LOAN PAYMENTS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loan_payments') THEN
    ALTER TABLE public.loan_payments ALTER COLUMN org_id DROP NOT NULL;

    FOR r IN (
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.loan_payments'::regclass AND contype = 'f'
      AND conname IN ('loan_payments_org_id_fkey', 'loan_payment_org_id_fkey')
    ) LOOP
      EXECUTE 'ALTER TABLE public.loan_payments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;

    ALTER TABLE public.loan_payments
      ADD CONSTRAINT loan_payments_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES public.organizations(id)
      ON DELETE SET NULL ON UPDATE CASCADE;

    FOR r IN (
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.loan_payments'::regclass AND contype = 'f'
      AND conname IN ('loan_payments_campus_id_fkey', 'loan_payment_campus_id_fkey')
    ) LOOP
      EXECUTE 'ALTER TABLE public.loan_payments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;

    ALTER TABLE public.loan_payments
      ADD CONSTRAINT loan_payments_campus_id_fkey
      FOREIGN KEY (campus_id) REFERENCES public.campuses(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  -- 5. PUBLIC SCHEMA: AGREEMENTS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agreements') THEN
    ALTER TABLE public.agreements ALTER COLUMN org_id DROP NOT NULL;

    FOR r IN (
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.agreements'::regclass AND contype = 'f'
      AND conname IN ('agreements_org_id_fkey', 'agreement_org_id_fkey')
    ) LOOP
      EXECUTE 'ALTER TABLE public.agreements DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;

    ALTER TABLE public.agreements
      ADD CONSTRAINT agreements_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES public.organizations(id)
      ON DELETE SET NULL ON UPDATE CASCADE;

    FOR r IN (
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.agreements'::regclass AND contype = 'f'
      AND conname IN ('agreements_campus_id_fkey', 'agreement_campus_id_fkey')
    ) LOOP
      EXECUTE 'ALTER TABLE public.agreements DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;

    ALTER TABLE public.agreements
      ADD CONSTRAINT agreements_campus_id_fkey
      FOREIGN KEY (campus_id) REFERENCES public.campuses(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  -- 6. PUBLIC SCHEMA: NOTIFICATIONS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    FOR r IN (
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.notifications'::regclass AND contype = 'f'
      AND conname IN ('notifications_org_id_fkey', 'notification_org_id_fkey')
    ) LOOP
      EXECUTE 'ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;

    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES public.organizations(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  -- 7. MASTER_DB SCHEMA IF IT EXISTS
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'master_db') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'master_db' AND table_name = 'profiles') THEN
      FOR r IN (
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'master_db.profiles'::regclass AND contype = 'f'
        AND conname LIKE '%org_id%'
      ) LOOP
        EXECUTE 'ALTER TABLE master_db.profiles DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
      END LOOP;

      ALTER TABLE master_db.profiles
        ADD CONSTRAINT master_profiles_org_id_fkey
        FOREIGN KEY (org_id) REFERENCES master_db.organizations(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'master_db' AND table_name = 'borrowers') THEN
      ALTER TABLE master_db.borrowers ALTER COLUMN organization_id DROP NOT NULL;
      FOR r IN (
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'master_db.borrowers'::regclass AND contype = 'f'
        AND (conname LIKE '%org_id%' OR conname LIKE '%organization_id%')
      ) LOOP
        EXECUTE 'ALTER TABLE master_db.borrowers DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
      END LOOP;

      ALTER TABLE master_db.borrowers
        ADD CONSTRAINT master_borrowers_organization_id_fkey
        FOREIGN KEY (organization_id) REFERENCES master_db.organizations(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'master_db' AND table_name = 'loans') THEN
      ALTER TABLE master_db.loans ALTER COLUMN org_id DROP NOT NULL;
      FOR r IN (
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'master_db.loans'::regclass AND contype = 'f'
        AND conname LIKE '%org_id%'
      ) LOOP
        EXECUTE 'ALTER TABLE master_db.loans DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
      END LOOP;

      ALTER TABLE master_db.loans
        ADD CONSTRAINT master_loans_org_id_fkey
        FOREIGN KEY (org_id) REFERENCES master_db.organizations(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'master_db' AND table_name = 'agreements') THEN
      ALTER TABLE master_db.agreements ALTER COLUMN org_id DROP NOT NULL;
      FOR r IN (
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'master_db.agreements'::regclass AND contype = 'f'
        AND conname LIKE '%org_id%'
      ) LOOP
        EXECUTE 'ALTER TABLE master_db.agreements DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
      END LOOP;

      ALTER TABLE master_db.agreements
        ADD CONSTRAINT master_agreements_org_id_fkey
        FOREIGN KEY (org_id) REFERENCES master_db.organizations(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'master_db' AND table_name = 'loan_payments') THEN
      ALTER TABLE master_db.loan_payments ALTER COLUMN org_id DROP NOT NULL;
      FOR r IN (
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'master_db.loan_payments'::regclass AND contype = 'f'
        AND conname LIKE '%org_id%'
      ) LOOP
        EXECUTE 'ALTER TABLE master_db.loan_payments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
      END LOOP;

      ALTER TABLE master_db.loan_payments
        ADD CONSTRAINT master_loan_payments_org_id_fkey
        FOREIGN KEY (org_id) REFERENCES master_db.organizations(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

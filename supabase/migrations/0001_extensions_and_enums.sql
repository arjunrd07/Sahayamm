-- Migration 0001: Extensions, Schemas, and Enum Types
-- Master DB, Org/Campus Schemas, and Public Schema Architecture

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Dedicated Schemas
CREATE SCHEMA IF NOT EXISTS master_db;
CREATE SCHEMA IF NOT EXISTS org_rmse_waverock;

-- Create Enum Types in master_db, org_rmse_waverock, and public schemas
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

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'borrower';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'lender';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

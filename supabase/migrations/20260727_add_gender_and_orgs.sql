-- Migration: Add gender column to profiles, seed sample organizations, and auto-verify profiles with completed KYC
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;

-- Seed organizations if not existing
INSERT INTO public.organizations (name, code)
VALUES
  ('BedRock', 'bedrock-org'),
  ('Microsoft', 'microsoft-org'),
  ('Amazon', 'amazon-org'),
  ('Google', 'google-org'),
  ('Tata Motors', 'tata-org')
ON CONFLICT (code) DO NOTHING;

-- Auto-verify any profiles that have completed mandatory KYC details
UPDATE public.profiles
SET verification_status = 'verified', kyc_completed = true
WHERE pan_number IS NOT NULL OR kyc_completed = true;

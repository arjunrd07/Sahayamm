-- Migration 0002: Master Database & Org Schemas Organizations and Campuses

-- Master DB Schema Tables
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

-- Org/Campus Schema (org_rmse_waverock) Tables
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

-- Public Schema Tables
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

-- Seed Default Seeds across master_db, org_rmse_waverock, and public
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

CREATE INDEX IF NOT EXISTS idx_master_campuses_org_id ON master_db.campuses(org_id);
CREATE INDEX IF NOT EXISTS idx_org_campuses_org_id ON org_rmse_waverock.campuses(org_id);
CREATE INDEX IF NOT EXISTS idx_public_campuses_org_id ON public.campuses(org_id);

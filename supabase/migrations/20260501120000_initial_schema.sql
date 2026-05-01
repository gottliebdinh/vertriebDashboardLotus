-- Lotus & Eagle — Supabase / Postgres Schema
-- In Supabase: SQL Editor → New query → Paste → Run
-- Or: supabase db push (CLI)

-- -----------------------------------------------------------------------------
-- Enums (Passend zu src/types.ts)
-- -----------------------------------------------------------------------------
CREATE TYPE public.person_status AS ENUM (
  'available',
  'proposed',
  'placed'
);

-- -----------------------------------------------------------------------------
-- Tabellen
-- -----------------------------------------------------------------------------
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3a66ff',
  description TEXT,
  target_slots INTEGER NOT NULL DEFAULT 3 CHECK (target_slots >= 1),
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX companies_archived_idx ON public.companies (archived);

CREATE TABLE public.persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  birth_date DATE,
  job_wish TEXT NOT NULL DEFAULT '',
  notes TEXT,
  status public.person_status NOT NULL DEFAULT 'available',
  -- Supabase Storage Pfade (Bucket z. B. "person-files")
  -- Empfohlen: {person_id}/photo.jpg, {person_id}/cv.pdf, ...
  photo_path TEXT,
  photo_original_name TEXT,
  cv_path TEXT,
  cv_original_name TEXT,
  cover_letter_path TEXT,
  cover_letter_original_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
);

CREATE INDEX persons_company_id_idx ON public.persons (company_id);
CREATE INDEX persons_status_idx ON public.persons (status);

COMMENT ON TABLE public.companies IS 'Arbeitgeber / Vermittlungsziele';
COMMENT ON TABLE public.persons IS 'Bewerber mit Status und optionalen Storage-Pfaden';

-- -----------------------------------------------------------------------------
-- updated_at automatisch (wie üblich bei Supabase)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at ()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER companies_set_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at ();

CREATE TRIGGER persons_set_updated_at
  BEFORE UPDATE ON public.persons
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at ();

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- Passe die Policies an dein Auth-Modell an (siehe supabase/README.md).
-- -----------------------------------------------------------------------------

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

-- Variante A — Nur eingeloggte Nutzer (nach Supabase Auth):
-- CREATE POLICY "companies_authenticated_all"
--   ON public.companies FOR ALL TO authenticated
--   USING (true) WITH CHECK (true);
-- CREATE POLICY "persons_authenticated_all"
--   ON public.persons FOR ALL TO authenticated
--   USING (true) WITH CHECK (true);

-- Variante B — Entwicklung / internes Tool ohne Login (VORSICHT im Internet):
CREATE POLICY "companies_anon_all_dev"
  ON public.companies FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "persons_anon_all_dev"
  ON public.persons FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- Optional gleiche Regeln für authenticated, wenn du später Auth nutzt:
CREATE POLICY "companies_authenticated_all_dev"
  ON public.companies FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "persons_authenticated_all_dev"
  ON public.persons FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

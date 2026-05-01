-- =============================================================================
-- Lotus & Eagle — ALLES LÖSCHEN und Dashboard-Schema neu anlegen
-- =============================================================================
-- ⚠️  WARNUNG: Löscht ALLE Zeilen in `persons` und `companies` sowie die
--     zugehörigen Tabellen/Trigger/Policies. Nur für Dev / wenn du die DB
--     komplett zurücksetzen willst.
--
-- Supabase: SQL Editor → komplette Datei einfügen → Run
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TEIL 1 — Bestehendes Dashboard-Schema entfernen
-- -----------------------------------------------------------------------------
-- Hinweis: CASCADE entfernt automatisch Policies, Trigger und Abhängigkeiten.

-- Reihenfolge wegen Fremdschlüssel: zuerst persons, dann companies
DROP TABLE IF EXISTS public.persons CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- Trigger-Funktion (Trigger verschwinden mit den Tabellen)
DROP FUNCTION IF EXISTS public.set_updated_at () CASCADE;

-- Enum (nach Entfernen aller abhängigen Spalten)
DROP TYPE IF EXISTS public.person_status CASCADE;

-- -----------------------------------------------------------------------------
-- TEIL 2 — Schema neu erstellen (gleiche Struktur wie migration)
-- -----------------------------------------------------------------------------

CREATE TYPE public.person_status AS ENUM (
  'available',
  'proposed',
  'placed'
);

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3a66ff',
  description TEXT,
  target_slots INTEGER NOT NULL DEFAULT 3 CHECK (target_slots >= 1),
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
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

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_anon_all_dev"
  ON public.companies FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "persons_anon_all_dev"
  ON public.persons FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "companies_authenticated_all_dev"
  ON public.companies FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "persons_authenticated_all_dev"
  ON public.persons FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- Fertig. Tabellen `companies` und `persons` sind leer und bereit für die App.
-- =============================================================================

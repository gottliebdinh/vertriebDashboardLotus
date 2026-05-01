-- Bucket + Policies für Bewerber-Dateien (idempotent — mehrfach ausführbar)
-- Supabase → SQL Editor

INSERT INTO storage.buckets (id, name, public)
VALUES ('person-files', 'person-files', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Alte Policies entfernen (Namenskonvention projectbezogen)
DROP POLICY IF EXISTS "person_files_anon_insert" ON storage.objects;
DROP POLICY IF EXISTS "person_files_anon_select" ON storage.objects;
DROP POLICY IF EXISTS "person_files_anon_update" ON storage.objects;
DROP POLICY IF EXISTS "person_files_anon_delete" ON storage.objects;
DROP POLICY IF EXISTS "person_files_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "person_files_auth_select" ON storage.objects;
DROP POLICY IF EXISTS "person_files_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "person_files_auth_delete" ON storage.objects;

CREATE POLICY "person_files_anon_insert"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'person-files');

CREATE POLICY "person_files_anon_select"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'person-files');

CREATE POLICY "person_files_anon_update"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'person-files')
  WITH CHECK (bucket_id = 'person-files');

CREATE POLICY "person_files_anon_delete"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'person-files');

CREATE POLICY "person_files_auth_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'person-files');

CREATE POLICY "person_files_auth_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'person-files');

CREATE POLICY "person_files_auth_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'person-files')
  WITH CHECK (bucket_id = 'person-files');

CREATE POLICY "person_files_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'person-files');

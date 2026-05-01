# Supabase — Lotus & Eagle

## 1. Projekt anlegen

Auf [supabase.com](https://supabase.com) ein neues Projekt erstellen. Danach unter **Project Settings → API**:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** Key → `VITE_SUPABASE_ANON_KEY`

Lokal im Projektroot eine `.env` anlegen (siehe `.env.example`).

## 2. SQL ausführen

### Nur einmal / frische Tabellen (ohne vorherige Daten zu löschen)

**Option A — SQL Editor (schnell)**  
Supabase Dashboard → **SQL Editor** → New query → Inhalt von  
`supabase/migrations/20260501120000_initial_schema.sql` einfügen → **Run**.

### Alles löschen und Schema neu aufsetzen (Reset)

Wenn du die Dashboard-Tabellen **komplett leeren und neu anlegen** willst (z. B. nach Experimenten):

→ **`supabase/reset_and_init_dashboard.sql`** im SQL Editor ausführen.

⚠️ Das löscht alle Zeilen in `persons` und `companies` und baut die Tabellen neu auf.

**Option B — Supabase CLI**  
`supabase link` und `supabase db push` (wenn du das CLI nutzt).

## 3. Row Level Security (RLS)

Die Migration legt **offene Policies** für `anon` und `authenticated` an (voller Zugriff). Das ist für Entwicklung und ein internes Tool gedacht.

**Produktion:** Öffentliche Schreibzugriffe über den `anon`-Key sind ein Sicherheitsrisiko. Stattdessen:

- Supabase **Auth** nutzen und nur `authenticated`-Policies mit `auth.uid()`-Prüfung, **oder**
- Keine direkten Client-Schreibzugriffe: eigene Edge Functions mit Service Role.

Die auskommentierten Policy-Beispiele in der Migration kannst du anpassen und die `*_anon_*`-Policies löschen:

```sql
DROP POLICY IF EXISTS companies_anon_all_dev ON public.companies;
DROP POLICY IF EXISTS persons_anon_all_dev ON public.persons;
```

## 4. Storage-Bucket `person-files`

Damit Uploads aus der App funktionieren:

1. SQL aus **`storage_person_files.sql`** einmal im SQL Editor ausführen (legt Bucket + Policies an).
2. Alternativ: Dashboard → **Storage** → Bucket `person-files` anlegen und Policies analog setzen.

Ohne Bucket/Policies erscheinen Personen **trotzdem** in der Tabelle `persons`, aber ohne Dateien (Upload schlägt still fehl).

## 5. Dateien (Profilbild, PDFs) — Überblick

Mit aktivem Supabase speichert die App Personen/Unternehmen in der DB und Dateien im Bucket. Ohne Supabase weiterhin **lokal** (IndexedDB). Details:

1. Im Dashboard **Storage** → Bucket anlegen, z. B. `person-files`, **nicht öffentlich**.
2. Upload aus der App mit `supabase.storage.from('person-files').upload(...)`.
3. In der Tabelle `persons` die Spalten `photo_path`, `cv_path`, `cover_letter_path` mit dem Storage-Pfad füllen (wie in der Migration).
4. Zum Anzeigen **signierte URLs**: `createSignedUrl(path, 3600)`.

## 6. Client in der App

`src/lib/supabase.ts` nutzt die Umgebungsvariablen. Beispiel lesen/schreiben:

```ts
import { supabase } from "./lib/supabase";

const { data, error } = await supabase.from("companies").select("*");
```

Spaltennamen in Postgres sind **snake_case** (`first_name`, `company_id`, …). Beim Lesen in die React-Typen (`firstName`) mapst du entweder in einer kleinen Hilfsfunktion oder mit einer View.

## 7. Namensabbildung (React ↔ DB)

| React (`types.ts`) | Postgres (`persons`) |
|--------------------|----------------------|
| `firstName`        | `first_name`         |
| `lastName`         | `last_name`          |
| `birthDate`        | `birth_date`         |
| `jobWish`          | `job_wish`           |
| `companyId`        | `company_id`         |
| `createdAt` (ms)   | `created_at` (ISO)   |

`companies`: `targetSlots` → `target_slots`.

/**
 * Prüft Supabase-Verbindung: lädt .env.local und ruft REST auf.
 * Usage: node scripts/check-supabase.mjs
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Keine .env.local gefunden:", envPath);
    process.exit(1);
  }
  const env = {};
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnvLocal();
const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    "VITE_SUPABASE_URL oder VITE_SUPABASE_ANON_KEY fehlt in .env.local",
  );
  process.exit(1);
}

console.log("URL:", url.replace(/^(https:\/\/[^.]+\.).*/, "$1…"));
console.log("Teste Verbindung …\n");

const supabase = createClient(url, anonKey);

const { data, error, count } = await supabase
  .from("companies")
  .select("id", { count: "exact", head: true });

if (error) {
  console.error("Fehler:", error.message);
  console.error("Code:", error.code, "Details:", error.details ?? "—");
  if (error.message.includes("relation") || error.code === "42P01") {
    console.error(
      "\nTipp: Tabellen fehlen noch — reset_and_init_dashboard.sql im SQL Editor ausführen.",
    );
  }
  process.exit(1);
}

console.log("OK — Verbindung zu Supabase funktioniert.");
console.log("Tabelle companies erreichbar (Zeilen:", count ?? "?", ").");

const { error: pErr } = await supabase.from("persons").select("id").limit(1);
if (pErr) {
  console.error("Warnung persons:", pErr.message);
  process.exit(1);
}
console.log("Tabelle persons erreichbar.");

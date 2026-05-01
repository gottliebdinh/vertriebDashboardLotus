import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "[Lotus & Eagle] VITE_SUPABASE_URL oder VITE_SUPABASE_ANON_KEY fehlt. .env anlegen (siehe .env.example).",
  );
}

/** Supabase-Browser-Client (anon key). Für Admin-Aktionen nie den Service-Role-Key im Frontend verwenden. */
export const supabase = createClient(url ?? "", anonKey ?? "");

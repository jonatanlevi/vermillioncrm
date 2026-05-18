/**
 * מקור יניקה בלבד — קריאה חד-כיוונית מ-DB של אפליקציית VerMillion.
 * אסור לייבא מודול זה מקומפוננטות UI או מ-lib/vermillion/queries (store).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function ingestionUrl(): string | undefined {
  return (
    process.env.VERMILLION_INGESTION_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}

function ingestionKey(): string | undefined {
  return (
    process.env.VERMILLION_INGESTION_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY
  );
}

/** האם מוגדר מקור יניקה (שרת בלבד — לא חשוף ללקוח) */
export function isIngestionSourceConfigured(): boolean {
  return Boolean(ingestionUrl() && ingestionKey());
}

/** לקוח יניקה — רק מתוך sync.ts */
export function getIngestionClient(): SupabaseClient | null {
  const url = ingestionUrl();
  const key = ingestionKey();
  if (!url || !key) return null;

  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

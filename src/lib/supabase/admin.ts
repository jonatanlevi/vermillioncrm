/**
 * @deprecated — Supabase אינו חלק מה-CRM.
 * השתמש ב-@/lib/ingestion/app-source (יניקה בלבד) ו-@/lib/vermillion/status.
 */
export {
  getIngestionClient as getSupabaseAdmin,
  isIngestionSourceConfigured as isSupabaseConfigured,
} from "@/lib/ingestion/app-source";

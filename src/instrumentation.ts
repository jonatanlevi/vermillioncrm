export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startRealtimeSync } = await import("@/lib/ingestion/realtime-sync");
    startRealtimeSync();
  }
}

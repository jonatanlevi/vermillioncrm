/** Fetches metrics from the VerMillion app API */

export interface VermillionMetric {
  name: string;
  value: number;
  unit?: string;
  alert?: boolean;
  raw?: Record<string, unknown>;
}

export async function fetchVermillionMetrics(): Promise<VermillionMetric[]> {
  const baseUrl = process.env.VERMILLION_APP_URL;
  const apiKey = process.env.VERMILLION_API_KEY;

  if (!baseUrl) {
    return getDemoMetrics();
  }

  try {
    const res = await fetch(`${baseUrl}/api/metrics`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`VerMillion API ${res.status}`);
    const data = (await res.json()) as { metrics?: VermillionMetric[] };
    return data.metrics ?? getDemoMetrics();
  } catch {
    return getDemoMetrics();
  }
}

function getDemoMetrics(): VermillionMetric[] {
  return [
    { name: "active_users", value: 0, unit: "users", raw: { source: "demo" } },
    { name: "daily_sessions", value: 0, unit: "sessions", raw: { source: "demo" } },
    { name: "revenue_today", value: 0, unit: "ILS", raw: { source: "demo" } },
    { name: "errors_24h", value: 0, unit: "count", alert: false, raw: { source: "demo" } },
  ];
}

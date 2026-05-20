import { LiveMonitor } from "@/components/vermillion/live-monitor";
import { IngestionGate } from "@/components/vermillion/ingestion-gate";

export const dynamic = "force-dynamic";

export default function LivePage() {
  return (
    <IngestionGate>
      <LiveMonitor />
    </IngestionGate>
  );
}

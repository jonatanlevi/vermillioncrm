import { AgentPanel } from "@/components/agents/agent-panel";
import { SalesDashboard } from "@/components/sales/sales-dashboard";

export const dynamic = "force-dynamic";

export default function SalesPage() {
  return (
    <div className="space-y-10">
      <SalesDashboard />
      <div className="border-t border-[var(--border)] pt-8">
        <AgentPanel
          agentId="sales"
          title="מכירות וצינור"
          subtitle="הוסף לידים, עדכן עסקאות וקבל המלצות AI"
          placeholder="לדוגמה: הוסף ליד חדש / סכם את צינור המכירות השבוע..."
        />
      </div>
    </div>
  );
}

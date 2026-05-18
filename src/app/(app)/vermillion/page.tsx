import { AgentPanel } from "@/components/agents/agent-panel";
import { VermillionDashboard } from "@/components/vermillion/vermillion-dashboard";

export const dynamic = "force-dynamic";

export default function VermillionPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold">מרכז מוצר</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          מנויים, מעורבות, פרימיום ו-Stamps — מסונכרן מאפליקציית VerMillion (לא עובדים ולא CRM)
        </p>
      </header>

      <VermillionDashboard />

      <div className="border-t border-[var(--border)] pt-8">
        <AgentPanel
          agentId="vermillion"
          title="ניתוח מוצר"
          subtitle="תובנות על מנויים, שימור והכנסה — על בסיס נתוני המוצר המסונכרנים"
          placeholder="לדוגמה: מי בסיכון לעזוב? איך לשפר אחוז Stamps? תסכם את השבוע..."
        />
      </div>
    </div>
  );
}

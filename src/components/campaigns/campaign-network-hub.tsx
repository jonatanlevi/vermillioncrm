"use client";

import { useState } from "react";
import {
  NETWORK_CATEGORIES,
  SOCIAL_NETWORKS,
  networksByCategory,
  type NetworkCategory,
  type SocialNetworkConfig,
} from "@/lib/social/networks";
import { NetworkPanel } from "./network-panel";

const CATEGORY_ORDER: NetworkCategory[] = ["mobile", "general", "professional"];

export function CampaignNetworkHub() {
  const [activeId, setActiveId] = useState<SocialNetworkConfig["id"]>("instagram");
  const active = SOCIAL_NETWORKS.find((n) => n.id === activeId) ?? SOCIAL_NETWORKS[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">שיווק וקמפיינים</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          עמוד נפרד לכל רשת — כולל מובייל מובילים (אינסטגרם, טיקטוק, סנאפ, שורטס)
        </p>
      </header>

      {CATEGORY_ORDER.map((cat) => (
        <section key={cat}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            {NETWORK_CATEGORIES[cat].labelHe}
          </h2>
          <div className="flex flex-wrap gap-2">
            {networksByCategory(cat).map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setActiveId(n.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  activeId === n.id
                    ? "border-[var(--accent)] bg-[var(--accent-dim)] text-white"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/50"
                }`}
                style={
                  activeId === n.id
                    ? { boxShadow: `0 0 0 1px ${n.color}55` }
                    : undefined
                }
              >
                <span>{n.icon}</span>
                <span>{n.nameHe}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      <div className="border-t border-[var(--border)] pt-6">
        <NetworkPanel key={active.id} network={active} />
      </div>
    </div>
  );
}

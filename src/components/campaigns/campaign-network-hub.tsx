"use client";

import { useEffect, useRef, useState } from "react";
import {
  NETWORK_CATEGORIES,
  SOCIAL_NETWORKS,
  networksByCategory,
  type NetworkCategory,
  type SocialNetworkConfig,
} from "@/lib/social/networks";
import { NetworkPanel } from "./network-panel";

const CATEGORY_ORDER: NetworkCategory[] = ["mobile", "general", "professional"];
const ELECTRIC_DURATION_MS = 2500;

export function CampaignNetworkHub() {
  const [activeId, setActiveId] = useState<SocialNetworkConfig["id"]>("instagram");
  const [animatingId, setAnimatingId] = useState<SocialNetworkConfig["id"] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = SOCIAL_NETWORKS.find((n) => n.id === activeId) ?? SOCIAL_NETWORKS[0];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleSelect(id: SocialNetworkConfig["id"]) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveId(id);
    setAnimatingId(id);
    timerRef.current = setTimeout(() => setAnimatingId(null), ELECTRIC_DURATION_MS);
  }

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
            {networksByCategory(cat).map((n) => {
              const isActive = activeId === n.id;
              const isAnimating = animatingId === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleSelect(n.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition${isAnimating ? " electric-burst" : ""} ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent-dim)] text-white"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/50"
                  }`}
                  style={{
                    ...(isActive && !isAnimating
                      ? { boxShadow: `0 0 0 1px ${n.color}55` }
                      : {}),
                    ...(isAnimating
                      ? ({ "--el-color": n.color } as React.CSSProperties)
                      : {}),
                  }}
                >
                  <span>{n.icon}</span>
                  <span>{n.nameHe}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <div className="border-t border-[var(--border)] pt-6">
        <NetworkPanel key={active.id} network={active} />
      </div>
    </div>
  );
}

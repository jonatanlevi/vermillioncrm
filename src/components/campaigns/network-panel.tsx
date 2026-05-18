"use client";

import { useCallback, useEffect, useState } from "react";
import { AgentPanel } from "@/components/agents/agent-panel";
import type { SocialNetworkConfig } from "@/lib/social/networks";

interface PostRow {
  id: string;
  content: string;
  status: string;
  campaign: { name: string; status: string };
}

interface NetworkPanelProps {
  network: SocialNetworkConfig;
}

export function NetworkPanel({ network }: NetworkPanelProps) {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/campaigns/posts?network=${network.id}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [network.id]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ network?: string }>).detail;
      if (!detail?.network || detail.network === network.id) loadPosts();
    };
    window.addEventListener("cha:campaign-updated", handler);
    return () => window.removeEventListener("cha:campaign-updated", handler);
  }, [network.id, loadPosts]);

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border p-4"
        style={{
          borderColor: `${network.color}44`,
          background: `linear-gradient(135deg, ${network.color}12 0%, transparent 60%)`,
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{network.icon}</span>
          <div>
            <h2 className="text-xl font-bold">{network.nameHe}</h2>
            <p className="text-sm text-[var(--muted)]">{network.nameEn}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {network.formatHints.map((hint) => (
            <span
              key={hint}
              className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs text-[var(--muted)]"
            >
              {hint}
            </span>
          ))}
        </div>
      </div>

      <AgentPanel
        agentId="campaigns"
        compact
        title={`ערוץ ${network.nameHe}`}
        placeholder={network.placeholder}
        metadata={{ network: network.id }}
      />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">פוסטים אחרונים — {network.nameHe}</h3>
          <button
            type="button"
            onClick={loadPosts}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            רענן
          </button>
        </div>
        {loadingPosts ? (
          <p className="text-sm text-[var(--muted)]">טוען...</p>
        ) : posts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted)]">
            אין עדיין פוסטים ל-{network.nameHe}. הפעל יצירת תוכן למעלה.
          </p>
        ) : (
          <ul className="space-y-2">
            {posts.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-medium text-[var(--accent)]">
                    {p.campaign.name}
                  </span>
                  <span className="text-xs text-[var(--muted)]">{p.status}</span>
                </div>
                <p className="line-clamp-2 text-[var(--muted)]" dir="rtl">
                  {p.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

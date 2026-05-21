import { NextResponse } from "next/server";
import { getIngestionClient, isIngestionSourceConfigured } from "@/lib/ingestion/app-source";
import { db } from "@/lib/db";
import type { ActivityEvent } from "@/lib/vermillion/types";

export const dynamic = "force-dynamic";

interface RawMessage {
  id?: string;
  role?: string;
  text?: string;
  content?: string;
  sentAt?: number;
  typingMs?: number | null;
  charsPerSec?: number | null;
  responseMs?: number | null;
}

export async function GET() {
  if (!isIngestionSourceConfigured()) {
    return NextResponse.json({ ok: false, error: "ingestion not configured" }, { status: 400 });
  }

  const sb = getIngestionClient();
  if (!sb) {
    return NextResponse.json({ ok: false, error: "cannot connect" }, { status: 500 });
  }

  // Local CRM cache for name/subscription — fast
  const localUsers = await db.appUser.findMany({
    where: { deletedAt: null },
    select: { externalId: true, name: true, email: true, subscription: true },
  });
  const localMap = new Map(localUsers.map((u) => [u.externalId, u]));

  const activeCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const eventCutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // last 1h of events

  // Fetch activity events + chat history in parallel
  const [eventsRes, chatsRes] = await Promise.all([
    sb
      .from("user_activity_events")
      .select("id, user_id, occurred_at, event_type, screen, payload, session_id, device_tz")
      .gte("occurred_at", eventCutoff)
      .order("occurred_at", { ascending: false })
      .limit(500),
    sb.from("chat_history").select("user_id, messages"),
  ]);

  const allEvents = (eventsRes.data ?? []) as ActivityEvent[];
  const chatByUser = new Map(
    (chatsRes.data ?? []).map((r: { user_id: string; messages: unknown }) => [
      r.user_id,
      r.messages,
    ])
  );

  // Group events per user
  const eventsByUser = new Map<string, ActivityEvent[]>();
  for (const ev of allEvents) {
    const arr = eventsByUser.get(ev.user_id) ?? [];
    arr.push(ev);
    eventsByUser.set(ev.user_id, arr);
  }

  // All users who had any event in the last hour OR have chat history
  const userIds = new Set([
    ...eventsByUser.keys(),
    ...chatByUser.keys(),
  ]);

  const users = [...userIds].map((userId) => {
    const events = (eventsByUser.get(userId) ?? []).slice(0, 50); // newest-first already
    const lastEventAt = events[0]?.occurred_at ?? null;
    const isLive = lastEventAt != null && lastEventAt > activeCutoff;

    const chatRaw = chatByUser.get(userId);
    const messages = Array.isArray(chatRaw)
      ? (chatRaw as RawMessage[]).slice(-40).map((m) => ({
          role: String(m.role ?? ""),
          text: String(m.text ?? m.content ?? ""),
          sentAt: typeof m.sentAt === "number" ? m.sentAt : null,
          typingMs: typeof m.typingMs === "number" ? m.typingMs : null,
          responseMs: typeof m.responseMs === "number" ? m.responseMs : null,
        }))
      : [];

    const local = localMap.get(userId);

    // Compute basic stats from events
    const userMsgEvents = events.filter((e) => e.event_type === "chat_user_message");
    const aiDoneEvents = events.filter((e) => e.event_type === "chat_ai_done");
    const typingValues = userMsgEvents
      .map((e) => (e.payload as { typingMs?: number }).typingMs)
      .filter((v): v is number => typeof v === "number" && v > 0);
    const responseValues = aiDoneEvents
      .map((e) => (e.payload as { responseMs?: number }).responseMs)
      .filter((v): v is number => typeof v === "number" && v > 0);

    const avgTypingMs =
      typingValues.length > 0
        ? Math.round(typingValues.reduce((a, b) => a + b, 0) / typingValues.length)
        : null;
    const avgResponseMs =
      responseValues.length > 0
        ? Math.round(responseValues.reduce((a, b) => a + b, 0) / responseValues.length)
        : null;

    return {
      userId,
      name: local?.name ?? null,
      email: local?.email ?? null,
      subscription: local?.subscription ?? "free",
      lastActivity: lastEventAt,
      isLive,
      stats: { avgTypingMs, avgResponseMs, eventCount: events.length },
      events,           // chronological activity events (newest first)
      recentMessages: messages,  // last 40 from chat_history — תמליל ב-Live Monitor
    };
  })
  .filter((u) => u.events.length > 0)
  .sort((a, b) => {
    const ta = a.lastActivity ?? "";
    const tb = b.lastActivity ?? "";
    return tb.localeCompare(ta);
  });

  return NextResponse.json({ ok: true, users, fetchedAt: new Date().toISOString() });
}

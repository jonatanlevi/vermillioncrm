"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

/** בדיקת סטטוס — רק בעמודי מוצר */
const POLL_MS = 30_000;
/** reconcile — קל, לא כל הזמן */
const RECONCILE_MS = 120_000;

export type SyncStatusSnapshot = {
  ingestionConfigured: boolean;
  lastSyncAt: string | null;
  userCount: number;
  dataRevision: string;
  realtime: {
    enabled: boolean;
    status: string;
    lastError: string | null;
    lastEventAt: string | null;
  };
};

type Ctx = {
  data: SyncStatusSnapshot | null;
  pollNow: () => void;
};

const VermillionSyncContext = createContext<Ctx | null>(null);

let sharedInterval: ReturnType<typeof setInterval> | null = null;
let sharedReconcileInterval: ReturnType<typeof setInterval> | null = null;
let subscriberCount = 0;
let lastFetched: SyncStatusSnapshot | null = null;
const listeners = new Set<(d: SyncStatusSnapshot) => void>();

async function fetchStatus(): Promise<SyncStatusSnapshot | null> {
  try {
    const res = await fetch("/api/app/sync/status", { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as SyncStatusSnapshot & {
      lastSyncAt?: string | Date | null;
    };
    return {
      ingestionConfigured: Boolean(json.ingestionConfigured),
      lastSyncAt:
        json.lastSyncAt == null
          ? null
          : typeof json.lastSyncAt === "string"
            ? json.lastSyncAt
            : new Date(json.lastSyncAt).toISOString(),
      userCount: json.userCount ?? 0,
      dataRevision: json.dataRevision ?? "",
      realtime: {
        enabled: json.realtime?.enabled ?? false,
        status: json.realtime?.status ?? "off",
        lastError: json.realtime?.lastError ?? null,
        lastEventAt: json.realtime?.lastEventAt
          ? typeof json.realtime.lastEventAt === "string"
            ? json.realtime.lastEventAt
            : new Date(json.realtime.lastEventAt).toISOString()
          : null,
      },
    };
  } catch {
    return null;
  }
}

async function runReconcile(): Promise<number> {
  try {
    const res = await fetch("/api/app/sync/reconcile", { method: "POST" });
    if (!res.ok) return 0;
    const json = (await res.json()) as { churned?: number };
    return json.churned ?? 0;
  } catch {
    return 0;
  }
}

function notify(data: SyncStatusSnapshot) {
  lastFetched = data;
  for (const fn of listeners) fn(data);
}

function startSharedPolling() {
  if (sharedInterval) return;

  const tick = async () => {
    const data = await fetchStatus();
    if (data) notify(data);
  };

  void tick();
  sharedInterval = setInterval(tick, POLL_MS);
  sharedReconcileInterval = setInterval(async () => {
    const churned = await runReconcile();
    if (churned > 0) {
      const data = await fetchStatus();
      if (data) notify(data);
    }
  }, RECONCILE_MS);
}

function stopSharedPolling() {
  if (sharedInterval) {
    clearInterval(sharedInterval);
    sharedInterval = null;
  }
  if (sharedReconcileInterval) {
    clearInterval(sharedReconcileInterval);
    sharedReconcileInterval = null;
  }
}

export function VermillionSyncProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const onVermillion = pathname.startsWith("/vermillion");
  const [data, setData] = useState<SyncStatusSnapshot | null>(lastFetched);
  const lastRevision = useRef<string>("");
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedulePageRefresh = useCallback(
    (revision: string) => {
      if (!onVermillion) return;
      if (!lastRevision.current) {
        lastRevision.current = revision;
        return;
      }
      if (revision === lastRevision.current) return;
      lastRevision.current = revision;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        router.refresh();
      }, 1_500);
    },
    [onVermillion, router]
  );

  useEffect(() => {
    if (!onVermillion) {
      setData(lastFetched);
      return;
    }

    subscriberCount += 1;
    const listener = (snap: SyncStatusSnapshot) => {
      setData(snap);
      schedulePageRefresh(snap.dataRevision);
    };
    listeners.add(listener);
    if (lastFetched) listener(lastFetched);
    startSharedPolling();

    return () => {
      listeners.delete(listener);
      subscriberCount -= 1;
      if (subscriberCount <= 0) stopSharedPolling();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [onVermillion, schedulePageRefresh]);

  const pollNow = useCallback(async () => {
    const snap = await fetchStatus();
    if (snap) {
      notify(snap);
      if (onVermillion) schedulePageRefresh(snap.dataRevision);
    }
  }, [onVermillion, schedulePageRefresh]);

  const value = useMemo(() => ({ data, pollNow }), [data, pollNow]);

  return (
    <VermillionSyncContext.Provider value={value}>{children}</VermillionSyncContext.Provider>
  );
}

export function useVermillionSync() {
  return useContext(VermillionSyncContext);
}

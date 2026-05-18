"use client";

import { usePathname } from "next/navigation";
import { useVermillionSync } from "./vermillion-sync-poller";

/** אינדיקטור קל — בלי polling נפרד (משתמש ב-VermillionSyncProvider) */
export function CrmAutoRefresh() {
  const pathname = usePathname();
  const onVermillion = pathname.startsWith("/vermillion");
  const { data } = useVermillionSync() ?? { data: null };

  if (!onVermillion) return null;

  const live = data?.realtime?.status === "live";

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] text-[var(--muted)]"
      title="בעמוד מוצר: בדיקה כל ~30 שנ׳, רענון מסך רק כשהנתונים השתנו"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-500" : "bg-amber-500"}`}
        aria-hidden
      />
      עדכון אוטומטי {live ? "~30 שנ׳" : "ממתין"}
    </span>
  );
}

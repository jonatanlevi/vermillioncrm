export function formatTimer(
  hour: number | null | undefined,
  minute: number | null | undefined
): string | null {
  if (hour == null || minute == null) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

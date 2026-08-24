export function formatDuration(sec: number, withSuffix = false): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const formatted = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return withSuffix ? `${formatted}s` : formatted;
}

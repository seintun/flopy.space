export function formatDuration(sec: number): string {
  if (sec < 60) {
    return `${sec.toFixed(2)}sec`;
  }
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}sec`;
}

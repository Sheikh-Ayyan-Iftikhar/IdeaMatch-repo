export const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

export function timeAgo(iso: string): string {
  const d = daysSince(iso);
  if (d < 1) return "today";
  if (d < 2) return "yesterday";
  if (d < 30) return `${d} days ago`;
  if (d < 365) { const m = Math.floor(d / 30); return `${m} month${m > 1 ? "s" : ""} ago`; }
  const y = Math.floor(d / 365);
  return `${y} year${y > 1 ? "s" : ""} ago`;
}

export const compact = (n: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

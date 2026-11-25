const hits = new Map<string, number[]>();
/** Tiny in-memory limiter (per server instance). Swap for Redis/Upstash when deploying across instances. */
export function limited(req: Request, max = 12, windowMs = 60_000): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > max;
}

import type { Signal, SignalKey } from "@/lib/ranking";

const COLOR: Record<SignalKey, string> = {
  text: "bg-accent",
  readme: "bg-accent/70",
  topics: "bg-accent/45",
  language: "bg-accent/25",
  activity: "bg-good",
  maturity: "bg-muted",
};

export function SignalBar({ signals }: { signals: Signal[] }) {
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-sm bg-raised" role="img"
      aria-label={signals.map((s) => `${s.label}: ${s.points.toFixed(1)} of ${s.max.toFixed(1)}`).join(", ")}>
      {signals.map((s) => (
        <div key={s.key} className={COLOR[s.key]} style={{ width: `${s.points}%` }} />
      ))}
    </div>
  );
}

export function SignalLegend({ signals }: { signals: Signal[] }) {
  return (
    <ul className="mt-3 space-y-1.5 text-sm">
      {signals.map((s) => (
        <li key={s.key} className="flex items-center gap-2">
          <span className={`size-2 shrink-0 rounded-sm ${COLOR[s.key]}`} />
          <span className="flex-1 text-muted">{s.label}</span>
          <span className="tabular-nums">{s.points.toFixed(1)}<span className="text-muted"> / {s.max.toFixed(0)}</span></span>
        </li>
      ))}
    </ul>
  );
}

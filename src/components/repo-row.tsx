import { compact, timeAgo } from "@/lib/format";
import type { Scored } from "@/lib/ranking";
import { SignalBar, SignalLegend } from "./signal-bar";

export function RepoRow({ s }: { s: Scored }) {
  const r = s.repo;
  const facts: [string, string][] = [
    ["Language", r.language ?? "Not stated"],
    ["Stars", compact(r.stargazers_count)],
    ["Forks", compact(r.forks_count)],
    ["Open issues", compact(r.open_issues_count)],
    ["Last push", timeAgo(r.pushed_at)],
    ["License", r.license ?? "None listed"],
  ];
  return (
    <li className="grid gap-5 border-t border-line py-8 first:border-t-0 sm:grid-cols-[1fr_210px] sm:gap-10">
      <div className="min-w-0">
        <a href={r.html_url} target="_blank" rel="noopener noreferrer"
          className="font-display break-words text-xl font-medium tracking-tight hover:text-accent">
          <span className="text-muted">{r.owner}/</span>{r.name}
        </a>
        {r.description && <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-muted">{r.description}</p>}
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed">{s.explanation}</p>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
          {facts.map(([k, v]) => (
            <div key={k} className="flex gap-1.5">
              <dt className="text-muted">{k}</dt>
              <dd className="tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        {r.topics.length > 0 && (
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">Topics: {r.topics.slice(0, 8).join(", ")}</p>
        )}
      </div>
      <div>
        <div className="font-display text-4xl font-semibold tabular-nums leading-none">
          {s.score}<span className="ml-1 text-sm font-normal text-muted">of 100</span>
        </div>
        <div className="mt-3"><SignalBar signals={s.signals} /></div>
        <details className="group mt-3">
          <summary className="cursor-pointer text-sm text-muted hover:text-text">Score breakdown</summary>
          <SignalLegend signals={s.signals} />
          {!s.usedReadme && <p className="mt-2 text-xs leading-snug text-muted">No README was available, so that signal was left out and the others rescaled.</p>}
        </details>
      </div>
    </li>
  );
}

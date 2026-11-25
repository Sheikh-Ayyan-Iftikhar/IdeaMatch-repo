"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AnalyzeResponse, SearchResponse } from "@/lib/types";
import { RepoRow } from "./repo-row";

type Stage = "idle" | "analyzing" | "searching" | "done" | "error";

async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? `Request failed (${r.status}).`);
  return j as T;
}

const AI_NOTICE: Record<string, string> = {
  missing_key: "No Gemini API key is configured, so these results come from a keyword search built from your own words.",
  rate_limited: "Gemini's rate limit was reached, so these results come from a keyword search built from your own words.",
  invalid_response: "Gemini returned something unusable, so these results come from a keyword search built from your own words.",
  unavailable: "Gemini could not be reached, so these results come from a keyword search built from your own words.",
};

export function Discover() {
  const router = useRouter();
  const params = useSearchParams();
  const [idea, setIdea] = useState(params.get("q") ?? "");
  const [langs, setLangs] = useState(params.get("l") ?? "");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const started = useRef(false);

  async function run(text: string, langText: string) {
    const languages = langText.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5);
    if (text.trim().length < 15) { setError("Describe your idea in at least a sentence (15+ characters)."); setStage("error"); return; }
    router.replace(`/discover?q=${encodeURIComponent(text.trim())}${languages.length ? `&l=${encodeURIComponent(languages.join(","))}` : ""}`, { scroll: false });
    setError(null); setResults(null); setAnalysis(null); setStage("analyzing");
    try {
      const a = await post<AnalyzeResponse>("/api/analyze", { idea: text, languages });
      setAnalysis(a); setStage("searching");
      setResults(await post<SearchResponse>("/api/search", { plan: a.plan, languages }));
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong."); setStage("error");
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const q = params.get("q");
    if (q && q.trim().length >= 15) run(q, params.get("l") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const busy = stage === "analyzing" || stage === "searching";

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); run(idea, langs); }} className="max-w-2xl">
        <label htmlFor="idea" className="font-display text-2xl font-semibold tracking-tight">What do you want to build?</label>
        <textarea id="idea" value={idea} onChange={(e) => setIdea(e.target.value)} rows={4} maxLength={2000}
          className="mt-4 w-full resize-y rounded-md border border-line bg-surface p-4 text-base leading-relaxed focus:border-accent"
          placeholder="Say what it does and who it is for. A few sentences is plenty." />
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="langs" className="text-sm text-muted">Preferred languages (optional, comma separated)</label>
            <input id="langs" value={langs} onChange={(e) => setLangs(e.target.value)} placeholder="TypeScript, Python"
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2.5 focus:border-accent" />
          </div>
          <button disabled={busy} className="rounded-md bg-accent px-5 py-2.5 font-medium text-bg hover:brightness-110 disabled:opacity-50">
            {busy ? "Searching…" : stage === "idle" ? "Find matching repositories" : "Search again"}
          </button>
        </div>
        <p className="mt-3 text-sm text-muted">Your idea is sent to Google&rsquo;s Gemini API to write search queries.</p>
      </form>

      <div className="mt-12" aria-live="polite">
        {busy && (
          <div>
            <ul className="space-y-1.5 text-[15px]">
              <li className={stage === "analyzing" ? "text-text" : "text-muted"}>{stage === "analyzing" ? "Reading your idea and writing search queries…" : "Read your idea and wrote search queries."}</li>
              <li className={stage === "searching" ? "text-text" : "text-muted"}>Searching GitHub, then ranking the closest repositories.</li>
            </ul>
            <ul className="mt-8" aria-hidden>
              {[0, 1, 2].map((i) => (
                <li key={i} className="border-t border-line py-8 first:border-t-0">
                  <div className="h-5 w-64 rounded bg-raised motion-safe:animate-pulse" />
                  <div className="mt-3 h-4 w-full max-w-prose rounded bg-raised motion-safe:animate-pulse" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-raised motion-safe:animate-pulse" />
                </li>
              ))}
            </ul>
          </div>
        )}

        {stage === "error" && (
          <div className="max-w-2xl border-l-2 border-accent pl-4">
            <p className="font-medium">The search did not finish.</p>
            <p className="mt-1 text-[15px] leading-relaxed text-muted">{error}</p>
            <button onClick={() => run(idea, langs)} className="mt-3 text-sm text-accent underline underline-offset-4">Try again</button>
          </div>
        )}

        {stage === "done" && analysis && results && (
          <>
            <section className="max-w-2xl">
              {analysis.analysis ? (
                <>
                  <h2 className="font-display text-xl font-semibold tracking-tight">{analysis.analysis.projectName}</h2>
                  <p className="mt-2 leading-relaxed text-muted">{analysis.analysis.purpose}</p>
                  <p className="mt-3 text-sm text-muted">Generated by Gemini from your idea. Queries searched on GitHub: {analysis.plan.queries.join("; ")}.</p>
                </>
              ) : (
                <>
                  <p className="leading-relaxed text-muted">{AI_NOTICE[analysis.ai.status] ?? AI_NOTICE.unavailable}</p>
                  <p className="mt-2 text-sm text-muted">Queries searched on GitHub: {analysis.plan.queries.join("; ")}.</p>
                </>
              )}
            </section>

            <section className="mt-10">
              {results.repos.length === 0 ? (
                <div className="max-w-2xl border-l-2 border-accent pl-4">
                  <p className="font-medium">GitHub returned nothing for these queries.</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-muted">That does not mean the idea is new. Try describing what it does in different words, or drop the language filter.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-sm text-muted">
                    {results.repos.length} closest of {results.totalFound} repositories found
                    {results.failedQueries > 0 && ` (${results.failedQueries} query failed and was skipped)`}
                  </h2>
                  <ul className="mt-2">{results.repos.map((s) => <RepoRow key={s.repo.id} s={s} />)}</ul>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}

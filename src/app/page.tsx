import Link from "next/link";
import { BASE_WEIGHTS, SIGNAL_INFO, type SignalKey } from "@/lib/ranking";

const EXAMPLES = [
  "A code review tool that reads pull requests, finds bugs and security issues, and suggests fixes",
  "A self-hosted habit tracker with streaks and a public API",
  "A browser extension that summarises long GitHub issue threads",
];

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-28 pt-14 sm:px-8 sm:pt-24">
      <h1 className="font-display max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
        Your idea. The open-source projects behind it.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
        Describe what you want to build. IdeaMatch searches GitHub for repositories that already cover part of it, and shows exactly how each one earned its score.
      </p>

      <form action="/discover" className="mt-10 max-w-2xl">
        <label htmlFor="q" className="sr-only">Your project idea</label>
        <textarea
          id="q" name="q" required minLength={15} maxLength={2000} rows={4}
          placeholder="I want to build…"
          className="w-full resize-y rounded-md border border-line bg-surface p-4 text-base leading-relaxed placeholder:text-muted/70 focus:border-accent"
        />
        <button className="mt-3 rounded-md bg-accent px-5 py-2.5 font-medium text-bg hover:brightness-110">
          Find matching repositories
        </button>
      </form>

      <section className="mt-12 max-w-2xl">
        <h2 className="text-sm text-muted">Or start from an example</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {EXAMPLES.map((e) => (
            <li key={e}>
              <Link href={`/discover?q=${encodeURIComponent(e)}`} className="block py-3 text-[15px] leading-snug hover:text-accent">{e}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-24 max-w-2xl">
        <h2 className="font-display text-2xl font-semibold tracking-tight">How a match is scored</h2>
        <p className="mt-3 leading-relaxed text-muted">
          Gemini reads your idea and writes the search queries. It does not score anything. Each repository gets points from these signals, and you can open the breakdown on every result.
        </p>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          {(Object.keys(BASE_WEIGHTS) as SignalKey[]).map((k) => (
            <div key={k} className="grid gap-1 py-3 sm:grid-cols-[170px_1fr_auto] sm:gap-6">
              <dt className="font-medium">{SIGNAL_INFO[k].label}</dt>
              <dd className="text-[15px] leading-relaxed text-muted">{SIGNAL_INFO[k].how}</dd>
              <dd className="tabular-nums text-muted sm:text-right">{BASE_WEIGHTS[k]} pts</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Your idea is sent to Google&rsquo;s Gemini API to generate search terms. Repository data comes straight from the GitHub API. Nothing is stored on a server.
        </p>
      </section>
    </main>
  );
}

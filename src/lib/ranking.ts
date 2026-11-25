import type { GHRepo } from "./github";
import type { Plan } from "./schema";
import { daysSince, timeAgo } from "./format";
import { tokenize, unique } from "./keywords";

export type SignalKey = "text" | "readme" | "topics" | "language" | "activity" | "maturity";

/** Base weights, summing to 100. Signals that don't apply to a search are dropped and the rest are rescaled. */
export const BASE_WEIGHTS: Record<SignalKey, number> = { text: 35, readme: 20, topics: 15, language: 10, activity: 12, maturity: 8 };

export const SIGNAL_INFO: Record<SignalKey, { label: string; how: string }> = {
  text: { label: "Description match", how: "Share of your idea's key terms found in the repository's name, description and topics." },
  readme: { label: "README match", how: "Share of your idea's key terms found in the first 6,000 characters of the README." },
  topics: { label: "Topic overlap", how: "Technologies and categories from your idea that appear in the repository's GitHub topics." },
  language: { label: "Language", how: "Full marks if the primary language is one you asked for. Only counted when you list languages." },
  activity: { label: "Recent activity", how: "Decays from full marks (pushed this month) to zero (no push in two years)." },
  maturity: { label: "Maturity", how: "Logarithmic in stars, reaching full marks at 10,000. Deliberately a small share." },
};

export interface Signal { key: SignalKey; label: string; value: number; points: number; max: number }
export interface Scored {
  repo: GHRepo; score: number; strength: "Strong" | "Moderate" | "Weak";
  signals: Signal[]; explanation: string; usedReadme: boolean;
}

const coverage = (terms: string[], haystack: Set<string>) => {
  if (!terms.length) return { value: 0, hits: [] as string[] };
  const hits = terms.filter((t) => haystack.has(t));
  return { value: Math.min(1, hits.length / Math.min(terms.length, 12)), hits };
};

export function scoreRepo(repo: GHRepo, plan: Plan, opts: { languages: string[]; readme?: string | null }): Scored {
  const terms = unique(plan.terms.flatMap(tokenize));
  const topicTerms = unique(plan.topicTerms.flatMap(tokenize));
  const meta = new Set(tokenize(`${repo.name} ${repo.description ?? ""} ${repo.topics.join(" ")}`));
  const topicSet = new Set(repo.topics.flatMap((t) => tokenize(t.replace(/-/g, " "))));

  const text = coverage(terms, meta);
  const topics = coverage(topicTerms, topicSet);
  const topicHits = repo.topics.filter((t) => tokenize(t.replace(/-/g, " ")).some((x) => topicTerms.includes(x)));

  const values: Partial<Record<SignalKey, number>> = {
    text: text.value,
    topics: Math.min(1, topics.hits.length / 3),
    activity: Math.max(0, 1 - Math.log2(1 + daysSince(repo.pushed_at) / 30) / Math.log2(1 + 730 / 30)),
    maturity: Math.min(1, Math.log10(1 + repo.stargazers_count) / 4),
  };
  const usedReadme = typeof opts.readme === "string" && opts.readme.length > 0;
  if (usedReadme) values.readme = coverage(terms, new Set(tokenize(opts.readme!))).value;
  const wantLangs = opts.languages.map((l) => l.toLowerCase());
  const langHit = !!repo.language && wantLangs.includes(repo.language.toLowerCase());
  if (wantLangs.length) values.language = langHit ? 1 : 0;

  const active = (Object.keys(values) as SignalKey[]);
  const total = active.reduce((s, k) => s + BASE_WEIGHTS[k], 0);
  const signals: Signal[] = active.map((key) => {
    const max = (BASE_WEIGHTS[key] * 100) / total;
    return { key, label: SIGNAL_INFO[key].label, value: values[key]!, max, points: max * values[key]! };
  });
  const score = Math.round(signals.reduce((s, x) => s + x.points, 0));
  const strength = score >= 60 ? "Strong" : score >= 40 ? "Moderate" : "Weak";

  const parts: string[] = [];
  if (text.hits.length) parts.push(`mentions ${text.hits.slice(0, 4).join(", ")}`);
  if (topicHits.length) parts.push(`shares the topics ${topicHits.slice(0, 3).join(", ")}`);
  if (langHit) parts.push(`is written in ${repo.language}`);
  parts.push(`was last pushed ${timeAgo(repo.pushed_at)}`);
  const explanation = text.hits.length || topicHits.length
    ? `${strength} match: ${parts.join("; ")}.`
    : `${strength} match: GitHub returned it for your search, but it shares few terms with your idea.`;

  return { repo, score, strength, signals, explanation, usedReadme };
}

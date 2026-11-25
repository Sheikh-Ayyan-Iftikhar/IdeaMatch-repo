import { tokenize, unique } from "./keywords";
import type { Analysis, Plan } from "./schema";

export function planFromAnalysis(a: Analysis): Plan {
  return {
    queries: a.searchQueries.map((q) => q.replace(/["']/g, "").slice(0, 80)),
    terms: unique([...a.keywords, ...a.coreFeatures, ...a.technologies].flatMap(tokenize)).slice(0, 30),
    topicTerms: unique([...a.technologies, ...a.categories, ...a.keywords].flatMap(tokenize)).slice(0, 30),
  };
}

/** Keyword-only plan used when the AI provider is unavailable. Built purely from the user's own words. */
export function planFromIdea(idea: string): Plan {
  const t = unique(tokenize(idea));
  const queries = unique(
    [t.slice(0, 3), [...t.slice(0, 2), ...t.slice(3, 5)], t.slice(1, 4)].map((x) => x.join(" ")).filter((s) => s.length > 1)
  ).slice(0, 3);
  return {
    queries: queries.length ? queries : [idea.slice(0, 60)],
    terms: t.slice(0, 30),
    topicTerms: t.slice(0, 15),
  };
}

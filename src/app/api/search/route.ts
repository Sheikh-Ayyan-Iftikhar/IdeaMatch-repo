import { z } from "zod";
import { fetchReadme, GitHubError, searchRepos, type GHRepo } from "@/lib/github";
import { limited } from "@/lib/limit";
import { scoreRepo } from "@/lib/ranking";
import { PlanSchema } from "@/lib/schema";
import type { SearchResponse } from "@/lib/types";

const Body = z.object({ plan: PlanSchema, languages: z.array(z.string().trim().max(30)).max(5).default([]) });

function rateLimitMessage(e: GitHubError) {
  const mins = e.resetAt ? Math.max(1, Math.ceil((e.resetAt * 1000 - Date.now()) / 60_000)) : null;
  return `GitHub's rate limit was reached${mins ? `; it resets in about ${mins} minute${mins > 1 ? "s" : ""}` : ""}. Adding a GITHUB_TOKEN raises the limit.`;
}

export async function POST(req: Request) {
  if (limited(req)) return Response.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid search request." }, { status: 400 });
  const { plan, languages } = parsed.data;

  // 1. Search every query variation in parallel, then deduplicate by repository id.
  const queries = plan.queries.slice(0, 4);
  const settled = await Promise.allSettled(queries.map((q) => searchRepos(q)));
  const failed = settled.filter((s): s is PromiseRejectedResult => s.status === "rejected");
  if (failed.length === queries.length) {
    const e = failed[0].reason;
    if (e instanceof GitHubError) return Response.json({ error: e.code === "rate_limited" ? rateLimitMessage(e) : e.message }, { status: e.code === "rate_limited" ? 429 : 502 });
    return Response.json({ error: "GitHub search failed." }, { status: 502 });
  }
  const byId = new Map<number, GHRepo>();
  for (const s of settled) if (s.status === "fulfilled") for (const r of s.value) if (!byId.has(r.id)) byId.set(r.id, r);

  // 2. Rank on metadata only, then fetch READMEs just for the leaders and re-rank them.
  const prelim = [...byId.values()].map((r) => scoreRepo(r, plan, { languages })).sort((a, b) => b.score - a.score).slice(0, 12);
  const readmes = await Promise.allSettled(prelim.map((p) => fetchReadme(p.repo.full_name)));
  const repos = prelim
    .map((p, i) => {
      const r = readmes[i];
      return scoreRepo(p.repo, plan, { languages, readme: r.status === "fulfilled" ? r.value : null });
    })
    .sort((a, b) => b.score - a.score);

  return Response.json({ repos, totalFound: byId.size, failedQueries: failed.length } satisfies SearchResponse);
}

export interface GHRepo {
  id: number; full_name: string; name: string; owner: string; html_url: string;
  description: string | null; language: string | null;
  stargazers_count: number; forks_count: number; open_issues_count: number;
  pushed_at: string; license: string | null; topics: string[]; archived: boolean;
}

export class GitHubError extends Error {
  constructor(public code: "rate_limited" | "failed", message: string, public resetAt?: number) { super(message); }
}

const headers = (accept = "application/vnd.github+json"): HeadersInit => ({
  accept,
  "x-github-api-version": "2022-11-28",
  "user-agent": "ideamatch",
  ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
});

// Collapses identical in-flight requests (same URL) into one.
const inflight = new Map<string, Promise<Response>>();
function get(url: string, accept?: string): Promise<Response> {
  const k = `${accept ?? ""}|${url}`;
  const hit = inflight.get(k);
  if (hit) return hit.then((r) => r.clone());
  const p = fetch(url, { headers: headers(accept), next: { revalidate: 3600 }, signal: AbortSignal.timeout(15_000) });
  inflight.set(k, p);
  p.finally(() => inflight.delete(k)).catch(() => {});
  return p.then((r) => r.clone());
}

function assertOk(res: Response) {
  if (res.ok) return;
  if ((res.status === 403 || res.status === 429) && res.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(res.headers.get("x-ratelimit-reset")) || undefined;
    throw new GitHubError("rate_limited", "GitHub rate limit reached.", reset);
  }
  throw new GitHubError("failed", `GitHub returned ${res.status}.`);
}

export async function searchRepos(query: string, page = 1, perPage = 20): Promise<GHRepo[]> {
  const q = `${query} in:name,description,topics,readme fork:false archived:false stars:>=3`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}`;
  let res: Response;
  try { res = await get(url); } catch { throw new GitHubError("failed", "Could not reach GitHub."); }
  assertOk(res);
  const data = await res.json();
  return (data.items ?? []).map((i: any): GHRepo => ({
    id: i.id, full_name: i.full_name, name: i.name, owner: i.owner?.login ?? "",
    html_url: i.html_url, description: i.description, language: i.language,
    stargazers_count: i.stargazers_count, forks_count: i.forks_count, open_issues_count: i.open_issues_count,
    pushed_at: i.pushed_at, license: i.license?.spdx_id && i.license.spdx_id !== "NOASSERTION" ? i.license.spdx_id : i.license?.name ?? null,
    topics: i.topics ?? [], archived: !!i.archived,
  }));
}

/** First 6,000 characters of the README as plain text, or null if none. */
export async function fetchReadme(fullName: string): Promise<string | null> {
  try {
    const res = await get(`https://api.github.com/repos/${fullName}/readme`, "application/vnd.github.raw+json");
    if (res.status === 404) return null;
    assertOk(res);
    return (await res.text()).slice(0, 6000);
  } catch (e) {
    if (e instanceof GitHubError && e.code === "rate_limited") throw e;
    return null;
  }
}

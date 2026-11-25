import type { Analysis, Plan } from "./schema";
import type { Scored } from "./ranking";

export interface AnalyzeResponse {
  analysis: Analysis | null;
  plan: Plan;
  ai: { status: "ok" | "missing_key" | "rate_limited" | "invalid_response" | "unavailable"; message?: string };
}
export interface SearchResponse {
  repos: Scored[];
  totalFound: number;
  failedQueries: number;
}

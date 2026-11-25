import { AIError, analyzeIdea } from "@/lib/gemini";
import { limited } from "@/lib/limit";
import { planFromAnalysis, planFromIdea } from "@/lib/plan";
import { IdeaInputSchema } from "@/lib/schema";
import type { AnalyzeResponse } from "@/lib/types";

export async function POST(req: Request) {
  if (limited(req)) return Response.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429 });
  const parsed = IdeaInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { idea } = parsed.data;

  try {
    const analysis = await analyzeIdea(idea);
    return Response.json({ analysis, plan: planFromAnalysis(analysis), ai: { status: "ok" } } satisfies AnalyzeResponse);
  } catch (e) {
    if (e instanceof AIError) {
      // Honest fallback: keyword plan from the user's own words, flagged so the UI says so.
      return Response.json({ analysis: null, plan: planFromIdea(idea), ai: { status: e.code, message: e.message } } satisfies AnalyzeResponse);
    }
    return Response.json({ error: "Unexpected error while analysing your idea." }, { status: 500 });
  }
}

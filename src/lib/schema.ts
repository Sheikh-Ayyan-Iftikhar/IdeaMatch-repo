import { z } from "zod";

export const IdeaInputSchema = z.object({
  idea: z.string().trim().min(15, "Describe your idea in at least a sentence (15+ characters).").max(2000, "Keep the idea under 2,000 characters."),
  languages: z.array(z.string().trim().min(1).max(30)).max(5).default([]),
});

export const AnalysisSchema = z.object({
  projectName: z.string(),
  purpose: z.string(),
  problem: z.string(),
  targetUsers: z.array(z.string()),
  coreFeatures: z.array(z.string()),
  technologies: z.array(z.string()),
  keywords: z.array(z.string()),
  searchQueries: z.array(z.string()).min(1).max(6),
  categories: z.array(z.string()),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

/** What the search + ranking stages need. Built from an AI analysis or, as a fallback, from the raw idea. */
export const PlanSchema = z.object({
  queries: z.array(z.string().trim().min(2).max(80)).min(1).max(6),
  terms: z.array(z.string().trim().min(1).max(60)).max(40),
  topicTerms: z.array(z.string().trim().min(1).max(40)).max(40),
});
export type Plan = z.infer<typeof PlanSchema>;

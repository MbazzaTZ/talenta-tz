import { supabase } from "@/integrations/supabase/client";

/**
 * Client wrapper for the secure `deepseek` Edge Function.
 * The API key lives only on the server; this just calls our function.
 */

type ExtractFields = {
  title?: string;
  company?: string;
  location?: string;
  region?: string;
  industry?: string;
  position_level?: string;
  contract_type?: string;
  qualification?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  description?: string;
};

async function invoke(body: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabase.functions.invoke("deepseek", { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.detail || data.error);
  return String(data?.content ?? "");
}

/** AI-extract structured job fields from raw text. Falls back to {} on parse fail. */
export async function aiExtractJob(text: string): Promise<ExtractFields> {
  const content = await invoke({ task: "extract", text });
  try {
    // Function requests JSON output, but strip fences just in case.
    const clean = content.replace(/```json|```/g, "").trim();
    return JSON.parse(clean) as ExtractFields;
  } catch {
    return {};
  }
}

/** Generate a CV summary or cover letter. */
export async function aiWriteCv(
  kind: "summary" | "cover_letter",
  context: string,
): Promise<string> {
  return invoke({ task: "cv", kind, context });
}

/** Analyze a CV and give improvement suggestions. */
export async function aiAnalyzeCv(cv: string): Promise<string> {
  return invoke({ task: "cv-analyze", cv });
}

/**
 * AI-rank applicants by fit for a job.
 * Returns JSON array of {email, name, score (0-100), reasoning}.
 */
export async function aiShortlistCandidates(
  jobTitle: string,
  jobDescription: string,
  applicantsJson: string,
): Promise<
  { email: string; name: string; score: number; reasoning: string }[]
> {
  const content = await invoke({
    task: "shortlist",
    jobTitle,
    jobDescription,
    applicantsJson,
  });
  try {
    const clean = content.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return [];
  }
}

/**
 * Suggest search terms and job filters for a job seeker's profile.
 * Returns {keywords, jobTitles, industries, reasoning}.
 */
export async function aiFindMatchingJobs(profile: string): Promise<{
  keywords: string[];
  jobTitles: string[];
  industries: string[];
  reasoning: string;
}> {
  const content = await invoke({ task: "find-jobs", profile });
  try {
    const clean = content.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      keywords: [],
      jobTitles: [],
      industries: [],
      reasoning: "Could not analyze profile.",
    };
  }
}

/** General chat assistant. messages = [{role, content}, ...] */
export async function aiChat(
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  return invoke({ task: "chat", messages });
}

export function aiAvailable(): boolean {
  // The function decides; client can't see the key. This is just a hint.
  return true;
}

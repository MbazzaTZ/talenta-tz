// ============================================================================
// Talentra — DeepSeek proxy (Supabase Edge Function)
// ============================================================================
// Holds the DeepSeek API key SERVER-SIDE. The browser never sees it.
// The frontend calls this function; this function calls DeepSeek.
//
// Set the key once (never in code/git):
//   supabase secrets set DEEPSEEK_API_KEY=sk-...
//
// Deploy:
//   supabase functions deploy deepseek
//
// Supported "task" values in the request body:
//   - "extract" : turn raw job text into structured JSON fields
//   - "cv"      : help write/improve CV summary or cover letter
//   - "chat"    : general assistant chat (array of messages)
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY") ?? "";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Build the system + user prompt for each task.
function buildMessages(task: string, payload: Record<string, unknown>) {
  if (task === "shortlist") {
    const jobTitle = String(payload.jobTitle ?? "");
    const jobDescription = String(payload.jobDescription ?? "").slice(0, 2000);
    const applicantsJson = String(payload.applicantsJson ?? "");
    return [
      {
        role: "system",
        content:
          "You are a recruitment expert. You will analyze job applicants and rank them by fit for the role. " +
          "Respond ONLY with minified JSON, no markdown, no prose. " +
          "Schema: [{email: string, name: string, score: 0-100, reasoning: brief string}] " +
          "Sort by score descending. Be fair and specific in reasoning.",
      },
      {
        role: "user",
        content:
          `Job: ${jobTitle}\n\nDescription:\n${jobDescription}\n\nApplicants:\n${applicantsJson}`,
      },
    ];
  }

  if (task === "find-jobs") {
    const profile = String(payload.profile ?? "").slice(0, 3000);
    return [
      {
        role: "system",
        content:
          "You are a career matcher. Given a job seeker's profile, suggest 3-5 key search terms and " +
          "job title filters they should use to find matching roles. " +
          "Respond ONLY with minified JSON, no markdown, no prose. " +
          "Schema: {keywords: [string], jobTitles: [string], industries: [string], " +
          "reasoning: string}",
      },
      {
        role: "user",
        content:
          `My profile:\n${profile}\n\nWhat jobs should I search for or apply to?`,
      },
    ];
  }

  if (task === "cv-analyze") {
    const cv = String(payload.cv ?? "").slice(0, 8000);
    return [
      {
        role: "system",
        content:
          "You are a professional CV coach for the Tanzanian job market. " +
          "Analyze the CV provided and give constructive feedback. " +
          "Be specific, kind, and actionable. " +
          "Point out strengths, areas to improve, and concrete suggestions for each section. " +
          "Format: use plain text, short paragraphs, bullet points where helpful.",
      },
      {
        role: "user",
        content:
          "Please review my CV and give me detailed feedback on how to improve it:\n\n" +
          cv,
      },
    ];
  }

  if (task === "extract") {
    const text = String(payload.text ?? "").slice(0, 12000);
    return [
      {
        role: "system",
        content:
          "You extract structured job-posting data from messy text. " +
          "Respond ONLY with minified JSON, no markdown, no prose. " +
          "Schema: {title, company, location, region, industry, " +
          "position_level (one of intern,graduate_trainee,entry,mid,senior,manager,director,executive), " +
          "contract_type (one of permanent,contract,temporary,freelance,internship,volunteer,consultancy), " +
          "qualification (one of certificate,diploma,bachelors,masters,phd,professional or empty), " +
          "salary_min (number or null), salary_max (number or null), " +
          "description (clean plain-text summary)}. " +
          "Use empty string or null when unknown. Salaries are numbers only.",
      },
      { role: "user", content: text },
    ];
  }

  if (task === "cv") {
    const kind = String(payload.kind ?? "summary"); // summary | cover_letter
    const context = String(payload.context ?? "").slice(0, 8000);
    const sys =
      kind === "cover_letter"
        ? "You are a career writing assistant. Write a concise, professional cover letter " +
          "for the Tanzanian job market. Plain text, 200-300 words, warm but professional."
        : "You are a career writing assistant. Write a strong, concise professional CV summary " +
          "(3-4 sentences) for the Tanzanian job market based on the details provided.";
    return [
      { role: "system", content: sys },
      { role: "user", content: context },
    ];
  }

  if (task === "chat") {
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    return [
      {
        role: "system",
        content:
          "You are Talentra's helpful assistant for a Tanzanian job platform. " +
          "Be concise, friendly, and practical. You can answer in English or Kiswahili " +
          "depending on the user's language.",
      },
      ...messages,
    ];
  }

  throw new Error("Unknown task");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  if (!DEEPSEEK_API_KEY) {
    return json({ error: "Server missing DEEPSEEK_API_KEY" }, 500);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const task = String(body.task ?? "");
  let messages;
  try {
    messages = buildMessages(task, body);
  } catch {
    return json({ error: "Invalid or missing task" }, 400);
  }

  try {
    const ds = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: task === "extract" ? 0.1 : 0.7,
        max_tokens: 1500,
        // Ask DeepSeek for JSON output on extract
        ...(task === "extract" ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!ds.ok) {
      const errText = await ds.text();
      return json({ error: "DeepSeek error", detail: errText }, 502);
    }

    const data = await ds.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return json({ task, content });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upstream call failed";
    return json({ error: msg }, 500);
  }
});

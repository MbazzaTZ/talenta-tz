import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY") ?? "";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  console.log("🔵 Function started");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!DEEPSEEK_API_KEY) {
    console.error("🔴 API key missing");
    return new Response(JSON.stringify({ error: "API key not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("🔵 API key present");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
    console.log("🔵 Body parsed:", body.task);
  } catch (e) {
    console.error("🔴 Parse error:", e);
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const task = String(body.task ?? "chat");
  const messages = Array.isArray(body.messages) ? body.messages : [];

  // Simple system message
  const allMessages = [
    {
      role: "system",
      content: "You are a helpful assistant. Be concise and friendly.",
    },
    ...messages,
  ];

  console.log("🔵 Calling DeepSeek with", allMessages.length, "messages");

  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    console.log("🔵 DeepSeek responded with status:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error("🔴 DeepSeek error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "DeepSeek API error", detail: errText }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    
    console.log("🟢 Success! Response length:", content.length);

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("🔴 Exception:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { planData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const {
      businessName, goal, totalBudget, channels, geoSummary,
      audienceSummary, expectedRanges, planName, planningPath,
      historicalInsights, kpis
    } = planData;

    const channelList = (channels || [])
      .map((c: any) => `${c.channel}: $${c.budget?.toLocaleString()} (${c.percentage}%)`)
      .join("\n  - ");

    const historyBlock = planningPath === "existing" && historicalInsights
      ? `\nHistorical context: ${historicalInsights}\nFrame recommendations around improving past performance.`
      : `\nThis is a new client with no historical data. Frame recommendations around industry benchmarks and goals.`;

    const systemPrompt = `You are a senior media strategist writing a client-ready plan narrative. 
Write in professional but accessible language. Use short paragraphs. 
Do NOT use markdown headers — use plain paragraphs with bold key phrases.
Structure: 1) Planning context & goal, 2) Channel strategy rationale, 3) Key insights, 4) Expected outcomes.
Keep it under 400 words.`;

    const userPrompt = `Write a client-ready narrative for this media plan:

Client: ${businessName || "Client"}
Plan: ${planName || "Balanced"}
Goal: ${goal || "Leads"}
KPIs: ${(kpis || []).join(", ") || "TBD"}
Monthly Budget: $${totalBudget?.toLocaleString() || "5,000"}
Geography: ${geoSummary || "TBD"}
Audiences: ${audienceSummary || "TBD"}
Channel Mix:
  - ${channelList || "TBD"}
Expected Results: ${(expectedRanges || []).map((r: any) => `${r.metric}: ${r.low?.toLocaleString()}-${r.high?.toLocaleString()}`).join(", ") || "TBD"}
${historyBlock}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error(`AI gateway returned ${status}`);
    }

    const result = await response.json();
    const narrative = result.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ narrative }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-narrative error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

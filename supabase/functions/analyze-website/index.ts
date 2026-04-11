import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { websiteUrl, businessName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a business analyst AI. Given a website URL (and optionally a business name), determine:
1. The business vertical (e.g. "Quick Service Restaurant", "Healthcare", "Automotive", "Retail", "Real Estate", "Legal Services", "Home Services", "Education", "Financial Services", "Technology", "Hospitality", "Fitness & Wellness", "E-commerce", "Entertainment", etc.)
2. The services/products they offer (3-5 specific items)
3. The primary CTA type on their website: one of "Form", "Call", "Visit", "eCommerce", "App Download"
4. A confidence level: "High" if you recognize the brand, "Medium" if you can infer from the URL, "Low" if uncertain.

Use your knowledge of well-known brands and businesses. For example:
- mcdonalds.com → Quick Service Restaurant, services: Burgers, Breakfast, McCafé, Delivery, Drive-Thru
- nike.com → Athletic Retail, services: Footwear, Apparel, Nike App, Training Programs

Return ONLY valid JSON with this exact structure, no markdown:
{"vertical":"...","services":["..."],"ctaType":"...","confidence":"...","businessName":"..."}`
          },
          {
            role: "user",
            content: `Analyze this business:\nWebsite: ${websiteUrl}\nBusiness name: ${businessName || "Unknown"}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_business",
              description: "Return structured business analysis from a website URL",
              parameters: {
                type: "object",
                properties: {
                  vertical: { type: "string", description: "Business vertical/industry" },
                  services: { type: "array", items: { type: "string" }, description: "3-5 key services or products" },
                  ctaType: { type: "string", enum: ["Form", "Call", "Visit", "eCommerce", "App Download"] },
                  confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                  businessName: { type: "string", description: "The proper business name" }
                },
                required: ["vertical", "services", "ctaType", "confidence", "businessName"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_business" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const analysis = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("No structured output from AI");
  } catch (e) {
    console.error("analyze-website error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Analysis failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

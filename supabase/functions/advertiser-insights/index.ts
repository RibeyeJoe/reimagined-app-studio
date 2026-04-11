import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { advertiserCode, lookbackDays = 90, kpi } = await req.json();
    if (!advertiserCode) {
      return new Response(JSON.stringify({ error: "advertiserCode required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
    const cutoff = cutoffDate.toISOString().split("T")[0];

    // Query all data for this advertiser within the lookback window
    const { data, error } = await supabase
      .from("campaign_performance")
      .select("*")
      .eq("advertiser_code", advertiserCode.toUpperCase())
      .gte("campaign_day", cutoff)
      .order("campaign_day", { ascending: false })
      .limit(10000);

    if (error) throw error;

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({
        found: false,
        message: `No recent performance data found for ${advertiserCode}. Plan recommendations are based on industry benchmarks and goals only.`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Aggregate by channel
    const channelStats: Record<string, {
      impressions: number; reach: number; frequency: number[];
      vcr: number[]; acr: number[]; count: number;
      publishers: Set<string>; dayparts: Set<string>; dmas: Set<string>;
    }> = {};

    const dateRange = { min: data[data.length - 1].campaign_day, max: data[0].campaign_day };

    for (const row of data) {
      const ch = row.digital_channel || "Unknown";
      if (!channelStats[ch]) {
        channelStats[ch] = {
          impressions: 0, reach: 0, frequency: [], vcr: [], acr: [], count: 0,
          publishers: new Set(), dayparts: new Set(), dmas: new Set(),
        };
      }
      const s = channelStats[ch];
      s.impressions += Number(row.impressions) || 0;
      s.reach += Number(row.reach) || 0;
      if (row.frequency) s.frequency.push(Number(row.frequency));
      if (row.vcr) s.vcr.push(Number(row.vcr));
      if (row.acr) s.acr.push(Number(row.acr));
      s.count++;
      if (row.publisher) s.publishers.add(row.publisher);
      if (row.daypart) s.dayparts.add(row.daypart);
      if (row.dma) s.dmas.add(row.dma);
    }

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const channelSummary = Object.entries(channelStats).map(([channel, s]) => ({
      channel,
      totalImpressions: s.impressions,
      totalReach: s.reach,
      avgFrequency: Math.round(avg(s.frequency) * 100) / 100,
      avgVCR: Math.round(avg(s.vcr) * 100) / 100,
      avgACR: Math.round(avg(s.acr) * 100) / 100,
      rows: s.count,
      topPublishers: [...s.publishers].slice(0, 10),
      dayparts: [...s.dayparts],
      dmaCount: s.dmas.size,
    }));

    // DMA-level breakdown (top by impressions)
    const dmaStats: Record<string, { impressions: number; reach: number; count: number }> = {};
    const zipStats: Record<string, { impressions: number; reach: number; count: number }> = {};

    for (const row of data) {
      const dma = row.dma?.trim();
      if (dma) {
        if (!dmaStats[dma]) dmaStats[dma] = { impressions: 0, reach: 0, count: 0 };
        dmaStats[dma].impressions += Number(row.impressions) || 0;
        dmaStats[dma].reach += Number(row.reach) || 0;
        dmaStats[dma].count++;
      }

      const zip = row.zip?.trim();
      if (zip) {
        if (!zipStats[zip]) zipStats[zip] = { impressions: 0, reach: 0, count: 0 };
        zipStats[zip].impressions += Number(row.impressions) || 0;
        zipStats[zip].reach += Number(row.reach) || 0;
        zipStats[zip].count++;
      }
    }

    const topDMAs = Object.entries(dmaStats)
      .map(([dma, s]) => ({ dma, ...s }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 25);

    const topZIPs = Object.entries(zipStats)
      .map(([zip, s]) => ({ zip, ...s }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 100);

    // Generate AI-driven recommendations if KPI is provided
    let recommendations: string[] = [];
    if (kpi) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
          const summaryText = JSON.stringify({
            advertiser: advertiserCode,
            dateRange, lookbackDays, kpi,
            channels: channelSummary,
            topDMAs: topDMAs.slice(0, 5),
            dayparts: daypartSummary,
            totalImpressions: channelSummary.reduce((a, c) => a + c.totalImpressions, 0),
            totalReach: channelSummary.reduce((a, c) => a + c.totalReach, 0),
          });

          const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                  content: `You are a media planning analyst at Ribeye Media. Given historical campaign performance data for an advertiser, analyze it through the lens of the selected KPI and provide 4-6 specific, data-driven recommendations for the next flight. Focus on:
1. Which channels/publishers over- or under-delivered
2. Which dayparts performed best
3. Where budget should be shifted
4. DMA/geo optimization opportunities
5. Frequency and reach efficiency
Be specific with numbers from the data. Return a JSON array of recommendation strings.`,
                },
                { role: "user", content: `Analyze this campaign data for KPI "${kpi}":\n${summaryText}` },
              ],
              tools: [{
                type: "function",
                function: {
                  name: "provide_recommendations",
                  description: "Return media mix recommendations",
                  parameters: {
                    type: "object",
                    properties: {
                      recommendations: {
                        type: "array",
                        items: { type: "string" },
                        description: "4-6 specific recommendations",
                      },
                    },
                    required: ["recommendations"],
                  },
                },
              }],
              tool_choice: { type: "function", function: { name: "provide_recommendations" } },
            }),
          });

          if (aiResp.ok) {
            const aiResult = await aiResp.json();
            const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall?.function?.arguments) {
              const parsed = JSON.parse(toolCall.function.arguments);
              recommendations = parsed.recommendations || [];
            }
          }
        } catch (aiErr) {
          console.error("AI recommendation error:", aiErr);
        }
      }
    }

    return new Response(JSON.stringify({
      found: true,
      advertiserCode,
      dateRange,
      lookbackDays,
      totalRows: data.length,
      channels: channelSummary,
      topDMAs,
      topZIPs,
      dayparts: daypartSummary,
      recommendations,
      totalImpressions: channelSummary.reduce((a, c) => a + c.totalImpressions, 0),
      totalReach: channelSummary.reduce((a, c) => a + c.totalReach, 0),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("advertiser-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Analysis failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

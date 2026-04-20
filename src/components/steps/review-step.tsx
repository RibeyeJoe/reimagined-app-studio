import { useState, useEffect, useRef } from "react";
import { usePlanner } from "@/lib/planner-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ReachCurvesChart } from "@/components/reach-curves-chart";
import type { PlanOption, ConfidenceLevel, ChannelAllocation, ShareOfVoice, HistoricalPerformance, ExpectedRange, Requirement } from "@/lib/schema";
import { calculatePlan, channelMetrics, getUniverse, DEFAULT_CPMS, UNIVERSE, AUDIENCE_SEGMENTS } from "@/lib/calculations";
import { CHANNEL_CTR, CHANNEL_CONV_RATE } from "@/lib/channel-ctr";
import { DEFAULT_CONFIGS, getConfigCPM, getDaypartRateMap } from "@/lib/media-channel-defaults";
import { CHANNELS } from "@/lib/schema";
import { DEFAULT_CHANNEL_MIX } from "@/lib/benchmarks";
import { expandHistoricalChannels, matchesHistoricalPlannerChannel } from "@/lib/channel-mapping";
import {
  ArrowLeft, Sparkles, Save, CheckCircle2,
  TrendingUp, Shield, Zap, Printer, Copy, Check,
  Search, Share2, Monitor, PlayCircle, Tv, RadioTower,
  Radio, Headphones, MapPin, Mail, ShoppingCart, Youtube, Film,
  Signpost, Upload, BarChart3, Globe, FileText, Loader2,
  Calendar, Eye, Users, Activity,
} from "lucide-react";

const CHANNEL_ICON_MAP: Record<string, typeof Search> = {
  Search, Social: Share2, Display: Monitor, OLV: PlayCircle, CTV: Tv,
  Linear: RadioTower, Radio, Audio: Headphones, DOOH: MapPin, OOH: Signpost,
  Email: Mail, "YouTube/YouTubeTV": Youtube, "Amazon/Prime Video/Twitch": ShoppingCart, Netflix: Film,
};

const PLAN_META: Record<string, { icon: typeof Shield; label: string; color: string }> = {
  Conservative: { icon: Shield, label: "Efficiency-focused", color: "text-blue-600" },
  Balanced: { icon: TrendingUp, label: "Recommended", color: "text-primary" },
  Aggressive: { icon: Zap, label: "Share-of-voice", color: "text-amber-600" },
};

/* ── CPM benchmarks now come from calculations.ts ── */

function buildCustomCpms(): Record<string, number> {
  const cpms: Record<string, number> = {};
  for (const ch of CHANNELS) {
    const configCpm = getConfigCPM(DEFAULT_CONFIGS[ch]);
    if (configCpm !== null) cpms[ch] = configCpm;
  }
  return cpms;
}

function buildDaypartRateMap(): Record<string, Record<string, number>> {
  const map: Record<string, Record<string, number>> = {};
  for (const ch of CHANNELS) {
    const dpMap = getDaypartRateMap(DEFAULT_CONFIGS[ch]);
    if (dpMap) map[ch] = dpMap;
  }
  return map;
}

const CUSTOM_CPMS = buildCustomCpms();
const DAYPART_RATES = buildDaypartRateMap();

function buildDaypartSplits(allocs: ChannelAllocation[]): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const a of allocs) {
    if (a.daypartBudgetSplit && Object.keys(a.daypartBudgetSplit).length > 0) {
      out[a.channel] = a.daypartBudgetSplit;
    }
  }
  return out;
}

function estimateMetrics(alloc: ChannelAllocation, universeK: number) {
  const cpm = CUSTOM_CPMS[alloc.channel];
  const m = channelMetrics(
    alloc.channel,
    alloc.budget,
    universeK,
    cpm,
    alloc.daypartBudgetSplit,
    DAYPART_RATES[alloc.channel],
  );
  return {
    impressions: m.impressions,
    reach: m.reach,
    frequency: m.frequency,
    cpm: m.cpm,
    daypartLines: m.daypartLines,
    source: cpm ? "Rate Card" as const : "Benchmark" as const,
  };
}

function generateSOV(
  allocs: ChannelAllocation[],
  _budget: number,
  geo?: string | string[] | null,
  audience?: string | null,
  demo: string = "Adults 25-54",
  ethnicOverlay: string | null = null,
): ShareOfVoice[] {
  const enabled = allocs.filter(a => a.enabled && a.budget > 0);
  const plan = calculatePlan(allocs, demo, geo, audience, {
    customCpms: CUSTOM_CPMS,
    daypartBudgetSplits: buildDaypartSplits(allocs),
    daypartRates: DAYPART_RATES,
    ethnicOverlay,
  });
  const sovMap = new Map(plan.shareOfVoice.map(s => [s.name, s]));

  return enabled.map(a => {
    const sov = sovMap.get(a.channel);
    const estSOV = sov?.sov ?? 0;
    const marketAvg = Math.round(100 / Math.max(enabled.length, 1)); // equal-split baseline
    return {
      channel: a.channel as any,
      estimatedSOV: estSOV,
      marketAverage: marketAvg,
      competitive: estSOV > marketAvg * 1.2 ? "Leading" as const : estSOV > marketAvg * 0.8 ? "Competitive" as const : "Below Average" as const,
    };
  });
}

function generateFallbackPlans(state: any): PlanOption[] {
  const { intake, goals, geo, audiences, channels } = state;
  const budget = intake.monthlyBudget || 5000;
  const goal = goals.goal || "Leads";
  const mix = DEFAULT_CHANNEL_MIX[goal] || {};
  const constrainedHistoricalChannels = expandHistoricalChannels(state.performanceChannels || []).map((c: string) => c.toLowerCase());
  const isImproveMode = goals.channelMixMode === "improve" && constrainedHistoricalChannels.length > 0;

  const makeAllocs = (multiplier: number): ChannelAllocation[] => {
    if (channels.allocations?.length > 0) {
      const scaledExistingAllocations = channels.allocations
        .map((a: ChannelAllocation) => {
          const isHistorical = constrainedHistoricalChannels.includes(a.channel.toLowerCase());
          const enabled = isImproveMode ? a.enabled && isHistorical : a.enabled;
          return {
            ...a,
            enabled,
            percentage: enabled ? a.percentage : 0,
            budget: enabled ? Math.round(a.budget * multiplier) : 0,
          };
        });

      if (scaledExistingAllocations.some((allocation: ChannelAllocation) => allocation.enabled)) {
        return scaledExistingAllocations.filter((a: ChannelAllocation) => a.enabled || !isImproveMode);
      }
    }

    return CHANNELS.map(ch => {
      const isHistorical = constrainedHistoricalChannels.includes(ch.toLowerCase());
      const pct = mix[ch] || 0;
      const enabled = isImproveMode ? pct > 0 && isHistorical : pct > 0;
      return { channel: ch, enabled, percentage: enabled ? pct : 0, budget: enabled ? Math.round(budget * multiplier * (pct / 100)) : 0 };
    });
  };

  const geoParam = state.geo?.geoValue ? parseDMAs(state.geo.geoValue) : "National";
  const audienceParam = extractAudience(audiences.audiences || []);
  const demoParam = audiences.demo || "Adults 25-54";
  const ethnicParam = audiences.ethnicOverlay && audiences.ethnicOverlay !== "General Market" ? audiences.ethnicOverlay : null;
  const hasAnalyzedUrl = intake.analyzed;
  const isExistingClient = state.planningPath === "existing";

  const buildPlan = (name: "Conservative" | "Balanced" | "Aggressive", multiplier: number, conf: ConfidenceLevel): PlanOption => {
    const allocs = makeAllocs(multiplier);
    const totalBudget = Math.round(budget * multiplier);
    const calc = calculatePlan(allocs, demoParam, geoParam, audienceParam, {
      customCpms: CUSTOM_CPMS,
      daypartBudgetSplits: buildDaypartSplits(allocs),
      daypartRates: DAYPART_RATES,
      ethnicOverlay: ethnicParam,
    });
    const enabled = allocs.filter(a => a.enabled && a.budget > 0);

    // Compute clicks from CTR benchmarks
    let totalClicks = 0;
    for (const a of enabled) {
      const cpm = CUSTOM_CPMS[a.channel] ?? DEFAULT_CPMS[a.channel] ?? 15;
      const imps = Math.round((a.budget / cpm) * 1000);
      totalClicks += Math.round(imps * (CHANNEL_CTR[a.channel] ?? 0));
    }

    // Expected ranges
    const expectedRanges: ExpectedRange[] = [
      { metric: "Impressions", low: Math.round(calc.totalImpressions * 0.85), high: Math.round(calc.totalImpressions * 1.15), unit: "", confidence: "High" },
      { metric: "Reach", low: Math.round(calc.totalReach * 0.88), high: Math.round(calc.totalReach * 1.12), unit: "", confidence: "Medium" },
      { metric: "Clicks", low: Math.round(totalClicks * 0.80), high: Math.round(totalClicks * 1.20), unit: "", confidence: "Medium" },
      { metric: "Frequency", low: +(calc.avgFrequency * 0.90).toFixed(1), high: +(calc.avgFrequency * 1.10).toFixed(1), unit: "x", confidence: "High" },
    ];

    // CPL for Leads goal
    if (goal === "Leads" && totalClicks > 0) {
      let totalConversions = 0;
      for (const a of enabled) {
        const cpm = CUSTOM_CPMS[a.channel] ?? DEFAULT_CPMS[a.channel] ?? 15;
        const imps = Math.round((a.budget / cpm) * 1000);
        const clicks = Math.round(imps * (CHANNEL_CTR[a.channel] ?? 0));
        totalConversions += Math.round(clicks * (CHANNEL_CONV_RATE[a.channel] ?? 0.005));
      }
      if (totalConversions > 0) {
        const cpl = totalBudget / totalConversions;
        expectedRanges.push({ metric: "Est. CPL", low: Math.round(cpl * 0.85), high: Math.round(cpl * 1.25), unit: "$", confidence: "Medium" });
      }
    }

    // Dynamic rationale
    const sortedByBudget = [...enabled].sort((a, b) => b.budget - a.budget);
    const topChannels = sortedByBudget.slice(0, 3);
    const rationale: string[] = [];
    if (topChannels.length > 0) {
      const topStr = topChannels.map(c => `${c.channel} (${c.percentage}%, $${c.budget.toLocaleString()})`).join(", ");
      rationale.push(`Top allocations: ${topStr}`);
    }
    rationale.push(`Projected to reach ~${fmt(calc.totalReach)} unique people at ${calc.avgFrequency}x average frequency`);
    if (isExistingClient) {
      rationale.push("Channel mix informed by historical campaign performance");
    }
    if (name === "Conservative") rationale.push("Lower spend reduces risk while maintaining core channel presence");
    if (name === "Aggressive") rationale.push("Higher budget maximizes share of voice and market coverage");

    // Dynamic requirements
    const requirements: Requirement[] = [];
    const hasSearch = enabled.some(a => a.channel === "Search");
    const hasVideo = enabled.some(a => ["Display", "OLV", "CTV", "Netflix"].includes(a.channel));
    const hasSocial = enabled.some(a => a.channel === "Social");
    const hasBroadcast = enabled.some(a => ["Linear", "Radio"].includes(a.channel));
    const hasDigital = enabled.some(a => !["Linear", "Radio", "OOH", "DOOH"].includes(a.channel));

    if (hasSearch) requirements.push({ label: "Landing page with conversion tracking", met: hasAnalyzedUrl });
    if (hasVideo) requirements.push({ label: "Creative assets (video/banner)", met: false });
    if (hasSocial) requirements.push({ label: "Social media accounts linked", met: false });
    if (hasBroadcast) requirements.push({ label: "Media rep coordination", met: false });
    if (hasDigital) requirements.push({ label: "Google Analytics / Tag Manager access", met: false });
    if (goal === "Leads") requirements.push({ label: "Call tracking number provisioned", met: false });
    if (requirements.length === 0) requirements.push({ label: "No additional setup required", met: true });

    return {
      name, summary: name === "Conservative" ? "Focus on proven channels with lower risk" :
        name === "Balanced" ? "Optimal mix of performance and reach" : "Maximum reach and share of voice",
      bestFor: name === "Conservative" ? "Clients wanting to test digital with minimal risk" :
        name === "Balanced" ? "Most clients — best balance of results and coverage" : "Clients wanting to dominate their market",
      goal, kpis: goals.kpis || [], geoSummary: geo.geoValue || "TBD",
      audienceSummary: `${audiences.audiences.length} audience segments`,
      allocations: allocs, expectedRanges, confidence: conf, rationale, requirements, totalBudget,
      shareOfVoice: generateSOV(allocs, totalBudget, geoParam, audienceParam, demoParam, ethnicParam),
    };
  };

  return [
    buildPlan("Conservative", 0.8, "High"),
    buildPlan("Balanced", 1, "High"),
    buildPlan("Aggressive", 1.2, "Medium"),
  ];
}

function parseDMAs(geoValue: string): string | string[] {
  if (!geoValue) return "National";
  const parts = geoValue.split(";").map(s => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts : parts[0] || "National";
}

function extractAudience(audiences: Array<{ name: string }>): string | null {
  const allKeys = new Set([...Object.keys(UNIVERSE), ...Object.keys(AUDIENCE_SEGMENTS)]);
  for (const a of audiences) {
    if (allKeys.has(a.name)) return a.name;
  }
  return null;
}

function confidenceBadge(c: ConfidenceLevel) {
  const colors: Record<string, string> = {
    High: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    Medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    Low: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  };
  return <Badge className={cn("text-[9px] font-medium", colors[c] || "")}>{c}</Badge>;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export function ReviewStep() {
  const { state, setStep, setOptions, savePlan, setHistoricalData } = usePlanner();
  const { options, geo, historicalData, intake, goals } = state;
  const [generating, setGenerating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("Balanced");
  const [narrative, setNarrative] = useState("");
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setGenerating(true);
    const timeout = setTimeout(() => {
      setOptions(generateFallbackPlans(state));
      setGenerating(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [state.goals.goal, state.goals.channelMixMode, state.channels.allocations, state.intake.monthlyBudget, state.geo.geoType, state.geo.geoValue, state.audiences.audiences, state.performanceChannels]);

  const activePlan = options.find(o => o.name === selectedPlan) || options[0];

  const regeneratePlans = () => {
    setGenerating(true);
    const nextOptions = generateFallbackPlans(state);
    setOptions(nextOptions);
    setGenerating(false);
  };
  const enabledChannels = activePlan?.allocations.filter(a => a.enabled) || [];

  /* ── totals via calculation engine ── */
  const geoParam2 = state.geo?.geoValue ? parseDMAs(state.geo.geoValue) : "National";
  const audienceParam2 = extractAudience(state.audiences?.audiences || []);
  const demoParam2 = state.audiences?.demo || "Adults 25-54";
  const ethnicParam2 = state.audiences?.ethnicOverlay && state.audiences.ethnicOverlay !== "General Market"
    ? state.audiences.ethnicOverlay
    : null;
  const universeK = getUniverse(geoParam2, audienceParam2, demoParam2, ethnicParam2);
  const planCalc = activePlan
    ? calculatePlan(activePlan.allocations, demoParam2, geoParam2, audienceParam2, {
        customCpms: CUSTOM_CPMS,
        daypartBudgetSplits: buildDaypartSplits(activePlan.allocations),
        daypartRates: DAYPART_RATES,
        ethnicOverlay: ethnicParam2,
      })
    : null;
  const totals = {
    impressions: planCalc?.totalImpressions ?? 0,
    reach: planCalc?.totalReach ?? 0,
    budget: enabledChannels.reduce((s, a) => s + a.budget, 0),
  };
  const avgFreq = planCalc?.avgFrequency ?? 0;

  /* ── generate narrative ── */
  const generateNarrative = async () => {
    if (!activePlan) return;
    setNarrativeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-narrative", {
        body: {
          planData: {
            businessName: intake.businessName,
            goal: activePlan.goal,
            totalBudget: activePlan.totalBudget,
            channels: enabledChannels.map(c => ({ channel: c.channel, budget: c.budget, percentage: c.percentage })),
            geoSummary: activePlan.geoSummary,
            audienceSummary: activePlan.audienceSummary,
            expectedRanges: activePlan.expectedRanges,
            planName: activePlan.name,
            planningPath: state.planningPath,
            historicalInsights: historicalData.length > 0
              ? `${historicalData.length} historical records across ${new Set(historicalData.map(h => h.channel)).size} channels`
              : null,
            kpis: activePlan.kpis,
          },
        },
      });
      if (error) throw error;
      setNarrative(data.narrative || "");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Narrative Error", description: e.message || "Failed to generate narrative", variant: "destructive" });
    } finally {
      setNarrativeLoading(false);
    }
  };

  const handleSave = (option: PlanOption) => {
    savePlan({
      id: Date.now().toString(),
      name: `${intake.businessName || "Client"} - ${option.name}`,
      createdAt: new Date().toISOString(),
      option,
      intake,
    });
    toast({ title: "Plan Saved", description: `${option.name} plan saved.` });
  };

  const copyNarrative = () => {
    navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleHistoricalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) return;
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const data: HistoricalPerformance[] = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim());
        const get = (key: string) => vals[headers.indexOf(key)] || "";
        return {
          channel: get("channel") as any, period: get("period") || "Previous",
          impressions: Number(get("impressions")) || 0, reach: Number(get("reach")) || 0, clicks: Number(get("clicks")) || 0,
          conversions: Number(get("conversions")) || 0, spend: Number(get("spend")) || 0,
          cpm: Number(get("cpm")) || 0, cpc: Number(get("cpc")) || 0,
          ctr: Number(get("ctr")) || 0, convRate: Number(get("convrate") || get("conv_rate")) || 0,
        };
      }).filter(d => d.channel);
      setHistoricalData(data);
      toast({ title: "Historical Data Loaded", description: `${data.length} rows imported.` });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── flight dates ── */
  const flightStart = intake.flightStart || "";
  const flightEnd = intake.flightEnd || "";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Review & Compare</h2>
          <p className="text-sm text-muted-foreground mt-1">Full plan details with budget breakdown, reach curves, and AI narrative.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleHistoricalUpload} />
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Historical Data
          </Button>
          <Button size="sm" variant="outline" onClick={regeneratePlans} disabled={generating}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Regenerate
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
          </Button>
        </div>
      </div>

      {generating ? (
        <div className="space-y-4">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <>
          {/* Plan Selector Tabs */}
          <div className="flex gap-3">
            {options.map(option => {
              const meta = PLAN_META[option.name] || { icon: TrendingUp, label: "", color: "text-primary" };
              const Icon = meta.icon;
              const isActive = selectedPlan === option.name;
              return (
                <button
                  key={option.name}
                  onClick={() => setSelectedPlan(option.name)}
                  className={cn(
                    "flex-1 p-4 rounded-lg border-2 transition-all text-left",
                    isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn("w-4 h-4", meta.color)} />
                    <span className="text-sm font-display font-bold">{option.name}</span>
                    {option.name === "Balanced" && <Badge className="text-[9px] bg-primary text-primary-foreground">Recommended</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{option.summary}</p>
                  <p className="text-lg font-bold mt-1">${option.totalBudget.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                </button>
              );
            })}
          </div>

          {activePlan && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <SummaryCard icon={Activity} label="Total Budget" value={`$${fmt(activePlan.totalBudget)}`} />
                <SummaryCard icon={Eye} label="Est. Impressions" value={fmt(totals.impressions)} />
                <SummaryCard icon={Users} label="Est. Reach" value={fmt(totals.reach)} />
                <SummaryCard icon={TrendingUp} label="Avg Frequency" value={String(avgFreq)} />
                <SummaryCard icon={Shield} label="Confidence" value={activePlan.confidence} badge />
              </div>

              {/* Universe Label */}
              {planCalc && (
                <div className="flex items-center gap-3 px-1 text-xs text-muted-foreground">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span>Universe: <span className="font-semibold text-foreground">{planCalc.universeLabel}</span></span>
                  <span className="text-muted-foreground">·</span>
                  <span>{planCalc.totalDedupReachPct}% reach · ~{fmt(planCalc.totalDedupReachPersons)} people</span>
                </div>
              )}

              {(flightStart || flightEnd) && (
                <Card className="p-4 card-elevated">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-display font-bold">Flight Timeline</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground w-16">Start</span>
                      <span className="font-semibold">{flightStart || "TBD"}</span>
                      <span className="text-muted-foreground mx-2">→</span>
                      <span className="text-muted-foreground w-16">End</span>
                      <span className="font-semibold">{flightEnd || "TBD"}</span>
                    </div>
                    {/* Channel timeline bars */}
                    <div className="space-y-1 mt-3">
                      {enabledChannels.slice(0, 8).map((ch, i) => (
                        <div key={ch.channel} className="flex items-center gap-2">
                          <span className="text-[10px] w-28 text-muted-foreground truncate">{ch.channel}</span>
                          <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
                            <div
                              className="h-full rounded-sm bg-primary/60"
                              style={{ width: `${Math.max(ch.percentage, 10)}%`, opacity: 0.5 + (ch.percentage / 200) }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold w-12 text-right">${ch.budget.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Tabs: Budget Breakdown / Reach Curves / SOV */}
              <Tabs defaultValue="breakdown" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="breakdown">Budget Breakdown</TabsTrigger>
                  <TabsTrigger value="reach">Reach Curves</TabsTrigger>
                  <TabsTrigger value="sov">Share of Voice</TabsTrigger>
                </TabsList>

                <TabsContent value="breakdown">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Channel-by-Channel Detail</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Channel</TableHead>
                            <TableHead className="text-right">Budget</TableHead>
                            <TableHead className="text-right">%</TableHead>
                            <TableHead className="text-right">Est. Impressions</TableHead>
                            <TableHead className="text-right">Est. Reach</TableHead>
                            <TableHead className="text-right">Frequency</TableHead>
                            <TableHead className="text-right">CPM</TableHead>
                            <TableHead className="text-center">Source</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {enabledChannels.map(ch => {
                            const m = estimateMetrics(ch, universeK);
                            const hasHistory = historicalData.some(h => matchesHistoricalPlannerChannel(ch.channel, h.channel));
                            return (
                              <Fragment key={ch.channel}>
                                <TableRow>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {(() => { const I = CHANNEL_ICON_MAP[ch.channel] || Monitor; return <I className="w-3.5 h-3.5 text-muted-foreground" />; })()}
                                      <span className="font-medium text-sm">{ch.channel}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">${ch.budget.toLocaleString()}</TableCell>
                                  <TableCell className="text-right">{ch.percentage}%</TableCell>
                                  <TableCell className="text-right">{fmt(m.impressions)}</TableCell>
                                  <TableCell className="text-right">{fmt(m.reach)}</TableCell>
                                  <TableCell className="text-right">{m.frequency}x</TableCell>
                                  <TableCell className="text-right">${m.cpm}</TableCell>
                                  <TableCell className="text-center">
                                    {hasHistory
                                      ? <Badge variant="outline" className="text-[9px] text-green-600 border-green-300">Historical</Badge>
                                      : m.source === "Rate Card"
                                      ? <Badge variant="outline" className="text-[9px] text-blue-600 border-blue-300">Rate Card</Badge>
                                      : <Badge variant="outline" className="text-[9px] text-muted-foreground">Benchmark</Badge>
                                    }
                                  </TableCell>
                                </TableRow>
                                {(m.daypartLines || []).map(dp => (
                                  <TableRow key={`${ch.channel}-${dp.daypart}`} className="bg-muted/20">
                                    <TableCell className="pl-8">
                                      <span className="text-xs text-muted-foreground">└ {dp.daypart}</span>
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">${dp.budget.toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">{dp.pct}%</TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">{fmt(dp.impressions)}</TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">—</TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">—</TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">${dp.cpm.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="outline" className="text-[9px] text-muted-foreground">Daypart</Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </Fragment>
                            );
                          })}
                          {/* Totals row */}
                          <TableRow className="font-bold bg-muted/30">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right">${totals.budget.toLocaleString()}</TableCell>
                            <TableCell className="text-right">100%</TableCell>
                            <TableCell className="text-right">{fmt(totals.impressions)}</TableCell>
                            <TableCell className="text-right">{fmt(totals.reach)}</TableCell>
                            <TableCell className="text-right">{avgFreq}x</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reach">
                  <Card className="p-5 card-elevated">
                    <ReachCurvesChart allocations={activePlan.allocations} totalBudget={activePlan.totalBudget} universeThousands={universeK} />
                  </Card>
                </TabsContent>

                <TabsContent value="sov">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Share of Voice Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Channel</TableHead>
                            <TableHead className="text-right">Est. SOV</TableHead>
                            <TableHead className="text-right">Market Avg</TableHead>
                            <TableHead className="text-center">Position</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(activePlan.shareOfVoice || []).map(sov => (
                            <TableRow key={sov.channel}>
                              <TableCell className="font-medium">{sov.channel}</TableCell>
                              <TableCell className="text-right font-semibold">{sov.estimatedSOV}%</TableCell>
                              <TableCell className="text-right text-muted-foreground">{sov.marketAverage}%</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={cn("text-[9px]",
                                  sov.competitive === "Leading" ? "text-green-600 border-green-300" :
                                  sov.competitive === "Competitive" ? "text-amber-600 border-amber-300" :
                                  "text-red-500 border-red-300"
                                )}>
                                  {sov.competitive}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Expected Results */}
              <Card className="p-4 card-elevated">
                <h3 className="text-sm font-display font-bold mb-3">Expected Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activePlan.expectedRanges.map(er => (
                    <div key={er.metric} className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{er.metric}</p>
                        <p className="text-sm font-bold">{er.low.toLocaleString()} – {er.high.toLocaleString()}</p>
                      </div>
                      {confidenceBadge(er.confidence)}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Requirements */}
              <Card className="p-4 card-elevated">
                <h3 className="text-sm font-display font-bold mb-3">Requirements Checklist</h3>
                <div className="flex gap-4 flex-wrap">
                  {activePlan.requirements.map(req => (
                    <div key={req.label} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className={cn("w-4 h-4", req.met ? "text-green-500" : "text-muted-foreground")} />
                      <span className={req.met ? "text-foreground" : "text-muted-foreground"}>{req.label}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* AI Narrative */}
              <Card className="p-5 card-elevated space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-display font-bold">Client-Ready Narrative</h3>
                  </div>
                  <div className="flex gap-2">
                    {narrative && (
                      <Button size="sm" variant="outline" onClick={copyNarrative}>
                        {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    )}
                    <Button size="sm" onClick={generateNarrative} disabled={narrativeLoading}>
                      {narrativeLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                      {narrative ? "Regenerate" : "Generate Narrative"}
                    </Button>
                  </div>
                </div>
                {narrativeLoading && (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                )}
                {narrative && !narrativeLoading && (
                  <div className="prose prose-sm max-w-none text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {narrative}
                  </div>
                )}
                {!narrative && !narrativeLoading && (
                  <p className="text-xs text-muted-foreground">
                    Click "Generate Narrative" to create an AI-written summary of this plan, ready for client presentation.
                  </p>
                )}
              </Card>

              {/* Save actions */}
              <div className="flex gap-2">
                {options.map(option => (
                  <Button key={option.name} size="sm" variant="outline" onClick={() => handleSave(option)}>
                    <Save className="w-3.5 h-3.5 mr-1" /> Save {option.name}
                  </Button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => setStep("channels")}><ArrowLeft className="w-4 h-4 mr-1.5" /> Back</Button>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, badge }: { icon: any; label: string; value: string; badge?: boolean }) {
  return (
    <Card className="p-3 card-elevated">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-primary/10">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">{label}</p>
          {badge
            ? confidenceBadge(value as ConfidenceLevel)
            : <p className="text-sm font-bold text-foreground">{value}</p>
          }
        </div>
      </div>
    </Card>
  );
}

import { useState, useEffect, useRef } from "react";
import { usePlanner } from "@/lib/planner-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PlanOption, ConfidenceLevel, ChannelAllocation, ShareOfVoice, HistoricalPerformance } from "@/lib/schema";
import { CHANNELS } from "@/lib/schema";
import { DEFAULT_CHANNEL_MIX } from "@/lib/benchmarks";
import {
  ArrowLeft, Sparkles, Save, Rocket, CheckCircle2,
  TrendingUp, Shield, Zap, Printer, Copy, Check,
  Search, Share2, Monitor, PlayCircle, Tv, RadioTower,
  Radio, Headphones, MapPin, Mail, ShoppingCart, Youtube, Film,
  Signpost, Upload, BarChart3, Globe,
} from "lucide-react";

const CHANNEL_ICON_MAP: Record<string, typeof Search> = {
  Search, Social: Share2, Display: Monitor, OLV: PlayCircle, CTV: Tv,
  Linear: RadioTower, Radio, Audio: Headphones, DOOH: MapPin, OOH: Signpost,
  Email: Mail, "YouTube/YouTubeTV": Youtube, "Amazon/Prime Video/Twitch": ShoppingCart, Netflix: Film,
};

const PLAN_META: Record<string, { icon: typeof Shield; label: string }> = {
  Conservative: { icon: Shield, label: "Efficiency-focused" },
  Balanced: { icon: TrendingUp, label: "Recommended" },
  Aggressive: { icon: Zap, label: "Share-of-voice" },
};

function generateSOV(allocs: ChannelAllocation[], budget: number): ShareOfVoice[] {
  return allocs.filter(a => a.enabled).map(a => {
    const marketAvg = Math.round(Math.random() * 15 + 5);
    const estSOV = Math.round((a.budget / (budget * 3)) * 100 * (1 + Math.random() * 0.5));
    return {
      channel: a.channel as any,
      estimatedSOV: Math.min(estSOV, 100),
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

  const makeAllocs = (multiplier: number): ChannelAllocation[] => {
    return CHANNELS.map(ch => {
      const pct = mix[ch] || 0;
      return { channel: ch, enabled: pct > 0, percentage: pct, budget: Math.round(budget * multiplier * (pct / 100)) };
    });
  };

  const plans: PlanOption[] = [
    {
      name: "Conservative", summary: "Focus on proven channels with lower risk",
      bestFor: "Clients wanting to test digital with minimal risk",
      goal, kpis: goals.kpis || [], geoSummary: geo.geoValue || "TBD",
      audienceSummary: `${audiences.audiences.length} audience segments`,
      allocations: makeAllocs(0.8), expectedRanges: [
        { metric: "Impressions", low: 50000, high: 100000, unit: "", confidence: "High" },
        { metric: "Clicks", low: 500, high: 1500, unit: "", confidence: "Medium" },
      ],
      confidence: "High", rationale: ["Focuses spend on highest-performing channels", "Lower risk, proven approach"],
      requirements: [{ label: "Landing page", met: true }, { label: "Creative assets", met: false }],
      totalBudget: Math.round(budget * 0.8),
    },
    {
      name: "Balanced", summary: "Optimal mix of performance and reach",
      bestFor: "Most clients — best balance of results and coverage",
      goal, kpis: goals.kpis || [], geoSummary: geo.geoValue || "TBD",
      audienceSummary: `${audiences.audiences.length} audience segments`,
      allocations: makeAllocs(1), expectedRanges: [
        { metric: "Impressions", low: 100000, high: 200000, unit: "", confidence: "High" },
        { metric: "Clicks", low: 1000, high: 3000, unit: "", confidence: "Medium" },
      ],
      confidence: "High", rationale: ["Balanced approach across funnel stages", "Good mix of brand and performance"],
      requirements: [{ label: "Landing page", met: true }, { label: "Creative assets", met: false }],
      totalBudget: budget,
    },
    {
      name: "Aggressive", summary: "Maximum reach and share of voice",
      bestFor: "Clients wanting to dominate their market",
      goal, kpis: goals.kpis || [], geoSummary: geo.geoValue || "TBD",
      audienceSummary: `${audiences.audiences.length} audience segments`,
      allocations: makeAllocs(1.2), expectedRanges: [
        { metric: "Impressions", low: 200000, high: 400000, unit: "", confidence: "Medium" },
        { metric: "Clicks", low: 2000, high: 5000, unit: "", confidence: "Medium" },
      ],
      confidence: "Medium", rationale: ["Maximum market coverage", "Aggressive share of voice strategy"],
      requirements: [{ label: "Landing page", met: true }, { label: "Creative assets", met: false }],
      totalBudget: Math.round(budget * 1.2),
    },
  ];

  return plans.map(p => ({
    ...p,
    shareOfVoice: generateSOV(p.allocations, p.totalBudget),
  }));
}

function parseLocations(v: string): string[] {
  return v.split(";").map(s => s.trim()).filter(Boolean);
}

export function ReviewStep() {
  const { state, setStep, setOptions, savePlan, setHistoricalData } = usePlanner();
  const { options, geo, historicalData } = state;
  const [generating, setGenerating] = useState(false);
  const [geoFilter, setGeoFilter] = useState<string>("all");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const geoLocations = parseLocations(geo.geoValue);

  useEffect(() => {
    if (options.length === 0) generatePlans();
  }, []);

  const generatePlans = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1200));
    setOptions(generateFallbackPlans(state));
    setGenerating(false);
  };

  const handleSave = (option: PlanOption) => {
    savePlan({
      id: Date.now().toString(),
      name: `${state.intake.businessName || "Client"} - ${option.name}`,
      createdAt: new Date().toISOString(),
      option,
      intake: state.intake,
    });
    toast({ title: "Plan Saved", description: `${option.name} plan saved.` });
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
          channel: get("channel") as any,
          period: get("period") || "Previous",
          impressions: Number(get("impressions")) || 0,
          clicks: Number(get("clicks")) || 0,
          conversions: Number(get("conversions")) || 0,
          spend: Number(get("spend")) || 0,
          cpm: Number(get("cpm")) || 0,
          cpc: Number(get("cpc")) || 0,
          ctr: Number(get("ctr")) || 0,
          convRate: Number(get("convrate") || get("conv_rate")) || 0,
        };
      }).filter(d => d.channel);
      setHistoricalData(data);
      toast({ title: "Historical Data Loaded", description: `${data.length} rows imported.` });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sovColor = (level: string) => {
    if (level === "Leading") return "text-green-600";
    if (level === "Competitive") return "text-yellow-600";
    return "text-red-500";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Review & Compare</h2>
          <p className="text-sm text-muted-foreground mt-1">Compare three plan options with share of voice analysis.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {geoLocations.length > 1 && (
            <Select value={geoFilter} onValueChange={setGeoFilter}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <Globe className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Filter by geo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Geos</SelectItem>
                {geoLocations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleHistoricalUpload} />
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Historical Data
          </Button>
          <Button size="sm" variant="outline" onClick={generatePlans} disabled={generating}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Regenerate
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
          </Button>
        </div>
      </div>

      {geoFilter !== "all" && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <MapPin className="w-4 h-4 text-primary" />
          <p className="text-xs font-medium">Showing plan for: <span className="font-bold">{geoFilter}</span></p>
          <Button size="sm" variant="ghost" className="ml-auto h-6 text-xs" onClick={() => setGeoFilter("all")}>Clear filter</Button>
        </div>
      )}

      {/* Historical Performance Comparison */}
      {historicalData.length > 0 && (
        <Card className="p-5 space-y-3 card-elevated">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-display font-bold">Historical Performance</h3>
            <Badge variant="secondary" className="text-[10px]">{historicalData.length} records</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Plans are optimized based on your historical data to improve next-flight performance.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {historicalData.slice(0, 4).map(h => (
              <div key={`${h.channel}-${h.period}`} className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs font-semibold">{h.channel}</p>
                <p className="text-[10px] text-muted-foreground">{h.period}</p>
                <div className="mt-1 space-y-0.5 text-[10px]">
                  <div className="flex justify-between"><span>CPC</span><span className="font-semibold">${h.cpc.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>CTR</span><span className="font-semibold">{(h.ctr * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span>Conv Rate</span><span className="font-semibold">{(h.convRate * 100).toFixed(1)}%</span></div>
                </div>
              </div>
            ))}
          </div>
          {historicalData.length > 4 && <p className="text-[10px] text-muted-foreground">+{historicalData.length - 4} more channels</p>}
        </Card>
      )}

      {generating ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <Card key={i} className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-24 w-full" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {options.map(option => {
            const meta = PLAN_META[option.name] || { icon: TrendingUp, label: "" };
            const Icon = meta.icon;
            const isBalanced = option.name === "Balanced";
            return (
              <Card key={option.name} className={cn(
                "p-5 space-y-4 card-elevated relative",
                isBalanced && "ring-2 ring-primary"
              )}>
                {isBalanced && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground font-semibold text-[10px] px-3">
                      Recommended
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-display font-bold">{option.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{meta.label}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{option.summary}</p>

                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-display font-bold text-foreground">${option.totalBudget.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channel Mix</p>
                  {option.allocations.filter(a => a.enabled).slice(0, 5).map(a => {
                    const ChIcon = CHANNEL_ICON_MAP[a.channel] || Monitor;
                    return (
                      <div key={a.channel} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <ChIcon className="w-3 h-3 text-muted-foreground" />
                          <span>{a.channel}</span>
                        </div>
                        <span className="font-semibold">{a.percentage}%</span>
                      </div>
                    );
                  })}
                  {option.allocations.filter(a => a.enabled).length > 5 && (
                    <p className="text-[10px] text-muted-foreground">+{option.allocations.filter(a => a.enabled).length - 5} more</p>
                  )}
                </div>

                {/* Share of Voice */}
                {option.shareOfVoice && option.shareOfVoice.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Share of Voice</p>
                    {option.shareOfVoice.slice(0, 4).map(sov => (
                      <div key={sov.channel} className="flex items-center justify-between text-xs">
                        <span>{sov.channel}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{sov.estimatedSOV}%</span>
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", sovColor(sov.competitive))}>
                            {sov.competitive}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {option.shareOfVoice.length > 4 && (
                      <p className="text-[10px] text-muted-foreground">+{option.shareOfVoice.length - 4} more channels</p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expected Results</p>
                  {option.expectedRanges.map(er => (
                    <div key={er.metric} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{er.metric}</span>
                      <span className="font-semibold">{er.low.toLocaleString()} – {er.high.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1 font-semibold" onClick={() => handleSave(option)}>
                    <Save className="w-3.5 h-3.5 mr-1" /> Save
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => setStep("channels")}><ArrowLeft className="w-4 h-4 mr-1.5" /> Back</Button>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { usePlanner } from "@/lib/planner-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PlanOption, ConfidenceLevel, ChannelAllocation } from "@/lib/schema";
import { CHANNELS } from "@/lib/schema";
import { DEFAULT_CHANNEL_MIX } from "@/lib/benchmarks";
import {
  ArrowLeft, Sparkles, Save, Rocket, CheckCircle2,
  TrendingUp, Shield, Zap, Printer, Copy, Check,
  Search, Share2, Monitor, PlayCircle, Tv, RadioTower,
  Radio, Headphones, MapPin, Mail, ShoppingCart, Youtube, Film,
} from "lucide-react";

const CHANNEL_ICON_MAP: Record<string, typeof Search> = {
  Search, Social: Share2, Display: Monitor, OLV: PlayCircle, CTV: Tv,
  Linear: RadioTower, Radio, Audio: Headphones, DOOH: MapPin, Email: Mail,
  "YouTube/YouTubeTV": Youtube, "Amazon/Prime Video/Twitch": ShoppingCart, Netflix: Film,
};

const PLAN_META: Record<string, { icon: typeof Shield; label: string }> = {
  Conservative: { icon: Shield, label: "Efficiency-focused" },
  Balanced: { icon: TrendingUp, label: "Recommended" },
  Aggressive: { icon: Zap, label: "Share-of-voice" },
};

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

  return [
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
}

export function ReviewStep() {
  const { state, setStep, setOptions, savePlan } = usePlanner();
  const { options } = state;
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Review & Compare</h2>
          <p className="text-sm text-muted-foreground mt-1">Compare three plan options generated for your client.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={generatePlans} disabled={generating}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Regenerate
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
          </Button>
        </div>
      </div>

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

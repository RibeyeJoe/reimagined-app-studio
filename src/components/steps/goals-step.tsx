import { useState, useEffect } from "react";
import { usePlanner } from "@/lib/planner-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { GOALS, type Goal, type ChannelMixMode } from "@/lib/schema";
import { GOAL_KPI_MAP } from "@/lib/benchmarks";
import { AdvertiserInsightsPanel } from "@/components/advertiser-insights-panel";
import type { AdvertiserInsights } from "@/lib/performance-utils";
import {
  Target, Eye, MousePointerClick, UserCheck, Footprints, Swords,
  Sparkles, X, ArrowLeft, ArrowRight, Info,
} from "lucide-react";

const GOAL_ICONS: Record<Goal, typeof Eye> = {
  Awareness: Eye, Consideration: MousePointerClick, Leads: UserCheck,
  "Foot Traffic": Footprints, Conquest: Swords,
};

const GOAL_DESCRIPTIONS: Record<Goal, string> = {
  Awareness: "Get your brand in front of as many people as possible",
  Consideration: "Drive interest and engagement with your products or services",
  Leads: "Generate qualified leads through calls, forms, and signups",
  "Foot Traffic": "Drive customers into your physical location",
  Conquest: "Win market share from competitors in your area",
};

// Map goals to KPI strings for the insights engine
const GOAL_KPI_LABELS: Record<Goal, string> = {
  Awareness: "Brand Awareness (Impressions, Reach, VCR)",
  Consideration: "Consideration (Clicks, CTR, Engagement)",
  Leads: "Lead Generation (Conversions, CPL, Form Fills)",
  "Foot Traffic": "Foot Traffic (Store Visits, Location Reach)",
  Conquest: "Conquest (SOV, Market Share, Competitive Reach)",
};

export function GoalsStep() {
  const { state, updateGoals, setStep } = usePlanner();
  const { goals } = state;
  const perfState = state as any;
  const advertiserCode: string | undefined = perfState.performanceAdvertiserCode || undefined;
  const hasPerformanceData = Boolean(perfState.performanceUploaded && advertiserCode);

  const [insights, setInsights] = useState<AdvertiserInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [lookback, setLookback] = useState(90);

  // Fetch insights when goal changes and we have performance data
  useEffect(() => {
    if (!hasPerformanceData || !advertiserCode) return;
    fetchInsights(goals.goal ? GOAL_KPI_LABELS[goals.goal] : undefined);
  }, [goals.goal, lookback, hasPerformanceData, advertiserCode]);

  // Also fetch on mount if we have data
  useEffect(() => {
    if (hasPerformanceData && advertiserCode && !insights) {
      fetchInsights(goals.goal ? GOAL_KPI_LABELS[goals.goal] : undefined);
    }
  }, [hasPerformanceData, advertiserCode, insights]);

  const fetchInsights = async (kpi?: string) => {
    if (!advertiserCode) return;
    setInsightsLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/advertiser-insights`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            advertiserCode,
            lookbackDays: lookback,
            kpi,
          }),
        }
      );
      if (resp.ok) {
        setInsights(await resp.json());
      }
    } catch (err) {
      console.error("Insights fetch error:", err);
    }
    setInsightsLoading(false);
  };

  const selectGoal = (goal: Goal) => {
    updateGoals({ goal, kpis: [...(GOAL_KPI_MAP[goal] || [])] });
  };

  const removeKpi = (kpi: string) => {
    updateGoals({ kpis: goals.kpis.filter(k => k !== kpi) });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Goals & KPIs</h2>
        <p className="text-sm text-muted-foreground mt-1">
          What does your client want to achieve? Pick a primary goal and we'll recommend KPIs.
        </p>
      </div>

      {/* Advertiser Insights Panel - shows before goal selection if data exists */}
      {hasPerformanceData && (
        <AdvertiserInsightsPanel
          insights={insights}
          loading={insightsLoading}
          lookback={lookback}
          onLookbackChange={(days) => setLookback(days)}
          kpi={goals.goal ? GOAL_KPI_LABELS[goals.goal] : undefined}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {GOALS.map(goal => {
          const Icon = GOAL_ICONS[goal];
          const isSelected = goals.goal === goal;
          return (
            <Card
              key={goal}
              className={cn(
                "p-4 cursor-pointer transition-all duration-200 card-elevated",
                isSelected && "ring-2 ring-primary bg-coral-light/40"
              )}
              onClick={() => selectGoal(goal)}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-display font-bold">{goal}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {GOAL_DESCRIPTIONS[goal]}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {goals.goal && (
        <Card className="p-5 space-y-3 card-elevated animate-fade-in">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-display font-bold">Recommended KPIs</h3>
            </div>
            <Button size="sm" variant="outline" onClick={() => updateGoals({ kpis: [...(GOAL_KPI_MAP[goals.goal!] || [])] })}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              AI Suggest
            </Button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {goals.kpis.map(kpi => (
              <Badge key={kpi} variant="secondary" className="flex items-center gap-1">
                {kpi}
                <button onClick={() => removeKpi(kpi)} className="ml-0.5"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => setStep("intake")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Button>
        <Button onClick={() => setStep("geo")} disabled={!goals.goal} className="font-semibold">
          Continue to Geo <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}

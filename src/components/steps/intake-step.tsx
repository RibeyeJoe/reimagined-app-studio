import { useState, useEffect, useCallback } from "react";
import { usePlanner } from "@/lib/planner-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks } from "date-fns";
import {
  Globe, Sparkles, X, Building2, MapPin, DollarSign,
  ArrowRight, Loader2, CalendarIcon, Clock, Database, CheckCircle2, AlertCircle,
} from "lucide-react";
import type { CTAType } from "@/lib/schema";
import { FLIGHTING_PRESETS } from "@/lib/schema";
import { supabase } from "@/integrations/supabase/client";

interface HistoricalLookup {
  status: "idle" | "searching" | "found" | "not_found";
  campaignCount?: number;
  lastActivity?: string;
  channels?: string[];
}

export function IntakeStep() {
  const { state, updateIntake, setStep, setState } = usePlanner();
  const { intake } = state;
  const [analyzing, setAnalyzing] = useState(false);
  const [lookup, setLookup] = useState<HistoricalLookup>({ status: "idle" });

  // Auto-lookup historical data when business name changes
  const lookupHistoricalData = useCallback(async (name: string) => {
    if (!name || name.length < 2) {
      setLookup({ status: "idle" });
      return;
    }
    setLookup({ status: "searching" });

    try {
      const searchTerm = name.trim();

      // Count matching campaigns
      const { count, error: countError } = await supabase
        .from("campaign_performance")
        .select("*", { count: "exact", head: true })
        .or(`advertiser_name.ilike.%${searchTerm}%,advertiser_code.ilike.%${searchTerm}%`);

      if (countError) throw countError;

      if (!count || count === 0) {
        setLookup({ status: "not_found" });
        setState((prev: any) => ({
          ...prev,
          performanceUploaded: false,
          performanceAdvertisers: [],
        }));
        return;
      }

      // Get last activity date, channels, and DMAs
      const { data: summary } = await supabase
        .from("campaign_performance")
        .select("campaign_day, digital_channel, dma")
        .or(`advertiser_name.ilike.%${searchTerm}%,advertiser_code.ilike.%${searchTerm}%`)
        .order("campaign_day", { ascending: false })
        .limit(1000);

      const lastDate = summary?.[0]?.campaign_day;
      const channels = [...new Set(summary?.map((r) => r.digital_channel).filter(Boolean) || [])];
      const dmas = [...new Set(summary?.map((r) => r.dma).filter(Boolean) || [])];

      setLookup({
        status: "found",
        campaignCount: count,
        lastActivity: lastDate ? format(new Date(lastDate), "MMMM yyyy") : undefined,
        channels: channels as string[],
      });

      setState((prev: any) => ({
        ...prev,
        performanceUploaded: true,
        performanceAdvertisers: [name],
        performanceDMAs: dmas,
      }));
    } catch (err) {
      console.error("Historical lookup error:", err);
      setLookup({ status: "not_found" });
    }
  }, [setState]);

  // Debounced lookup on business name change
  useEffect(() => {
    const timer = setTimeout(() => {
      lookupHistoricalData(intake.businessName);
    }, 600);
    return () => clearTimeout(timer);
  }, [intake.businessName, lookupHistoricalData]);

  const handleAnalyze = async () => {
    if (!intake.websiteUrl) return;
    setAnalyzing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-website`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            websiteUrl: intake.websiteUrl,
            businessName: intake.businessName,
          }),
        }
      );
      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      updateIntake({
        detected: {
          vertical: data.vertical || "General",
          services: data.services || [],
          ctaType: (data.ctaType || "Form") as CTAType,
          businessName: data.businessName || intake.businessName || "Business",
          confidence: data.confidence || "Medium",
        },
        analyzed: true,
      });
    } catch (err) {
      console.error("Website analysis error:", err);
      updateIntake({
        detected: {
          vertical: "General",
          services: ["Digital Marketing"],
          ctaType: "Form" as CTAType,
          businessName: intake.businessName || "Business",
          confidence: "Low",
        },
        analyzed: true,
      });
    }
    setAnalyzing(false);
  };

  const removeService = (service: string) => {
    if (!intake.detected) return;
    updateIntake({
      detected: { ...intake.detected, services: intake.detected.services.filter(s => s !== service) },
    });
  };

  const applyFlightPreset = (preset: string) => {
    const now = new Date();
    let start: Date, end: Date;
    switch (preset) {
      case "Next Week":
        start = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
        end = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
        break;
      case "Next 2 Weeks":
        start = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
        end = endOfWeek(addWeeks(now, 2), { weekStartsOn: 1 });
        break;
      case "Next Month":
        start = startOfMonth(addMonths(now, 1));
        end = endOfMonth(addMonths(now, 1));
        break;
      case "Next Quarter":
        start = startOfMonth(addMonths(now, 1));
        end = endOfMonth(addMonths(now, 3));
        break;
      default:
        return;
    }
    updateIntake({
      flightStart: format(start, "yyyy-MM-dd"),
      flightEnd: format(end, "yyyy-MM-dd"),
    });
  };

  const flightStart = intake.flightStart ? new Date(intake.flightStart) : undefined;
  const flightEnd = intake.flightEnd ? new Date(intake.flightEnd) : undefined;
  const canContinue = intake.businessName && intake.monthlyBudget > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Client Intake</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Start by entering your client's information. We'll analyze their website to auto-detect their business.
        </p>
      </div>

      <Card className="p-6 space-y-5 card-elevated">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                Business Name
              </Label>
              <Input
                placeholder="Acme Corp"
                value={intake.businessName}
                onChange={e => updateIntake({ businessName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                Website URL
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com"
                  value={intake.websiteUrl}
                  onChange={e => updateIntake({ websiteUrl: e.target.value })}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAnalyze}
                  disabled={!intake.websiteUrl || analyzing}
                  className="flex-shrink-0"
                >
                  {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span className="ml-1.5 hidden sm:inline">Analyze</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                Locations
              </Label>
              <Input
                placeholder="Dallas, TX; Austin, TX"
                value={intake.locations}
                onChange={e => updateIntake({ locations: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                Monthly Budget
              </Label>
              <Input
                type="number"
                placeholder="5000"
                value={intake.monthlyBudget || ""}
                onChange={e => updateIntake({ monthlyBudget: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Historical Performance Data — Auto Lookup */}
      <Card className="p-6 space-y-3 card-elevated">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display font-semibold">Historical Performance Data</h3>
        </div>

        {lookup.status === "idle" && (
          <p className="text-xs text-muted-foreground">
            Enter a business name above to automatically search for historical performance data.
          </p>
        )}

        {lookup.status === "searching" && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Searching for historical data…</span>
          </div>
        )}

        {lookup.status === "found" && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Historical data found</span>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              <strong>{lookup.campaignCount?.toLocaleString()}</strong> campaign records found
              {lookup.lastActivity && <> · Last activity: <strong>{lookup.lastActivity}</strong></>}
            </p>
            {lookup.channels && lookup.channels.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-1">
                {lookup.channels.slice(0, 6).map((ch) => (
                  <Badge key={ch} variant="secondary" className="text-[10px]">{ch}</Badge>
                ))}
                {lookup.channels.length > 6 && (
                  <Badge variant="secondary" className="text-[10px]">+{lookup.channels.length - 6} more</Badge>
                )}
              </div>
            )}
            <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1">
              This data will be used automatically to generate AI-powered recommendations when you select a goal.
            </p>
          </div>
        )}

        {lookup.status === "not_found" && intake.businessName.length >= 2 && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">No historical data found</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Recommendations will be based on industry benchmarks and goals. Connect integrations or check Analytics to import data.
            </p>
          </div>
        )}
      </Card>

      {/* Flighting Section */}
      <Card className="p-6 space-y-4 card-elevated">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display font-semibold">Flight Dates</h3>
        </div>

        <div className="flex gap-2 flex-wrap">
          {FLIGHTING_PRESETS.filter(p => p !== "Custom").map(preset => (
            <Button key={preset} size="sm" variant="outline" onClick={() => applyFlightPreset(preset)}>
              {preset}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !flightStart && "text-muted-foreground")}>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {flightStart ? format(flightStart, "PPP") : "Pick a start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={flightStart}
                  onSelect={(d) => d && updateIntake({ flightStart: format(d, "yyyy-MM-dd") })}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !flightEnd && "text-muted-foreground")}>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {flightEnd ? format(flightEnd, "PPP") : "Pick an end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={flightEnd}
                  onSelect={(d) => d && updateIntake({ flightEnd: format(d, "yyyy-MM-dd") })}
                  disabled={(d) => flightStart ? d < flightStart : false}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {flightStart && flightEnd && (
          <p className="text-xs text-muted-foreground">
            Flight: {format(new Date(intake.flightStart), "MMM d")} – {format(new Date(intake.flightEnd), "MMM d, yyyy")}
            {" "}({Math.ceil((new Date(intake.flightEnd).getTime() - new Date(intake.flightStart).getTime()) / (1000 * 60 * 60 * 24))} days)
          </p>
        )}
      </Card>

      {intake.detected && (
        <Card className="p-5 space-y-3 card-elevated animate-fade-in border-primary/20 bg-coral-light/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-display font-semibold">AI Detection Results</h3>
            <Badge variant="secondary" className="text-[10px]">
              {intake.detected.confidence || "Medium"} confidence
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Vertical:</span>
            <Badge>{intake.detected.vertical}</Badge>
          </div>
          {intake.detected.services.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Detected Services</p>
              <div className="flex gap-1.5 flex-wrap">
                {intake.detected.services.map(s => (
                  <Badge key={s} variant="secondary" className="flex items-center gap-1">
                    {s}
                    <button onClick={() => removeService(s)}><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={() => setStep("goals")} disabled={!canContinue} className="font-semibold">
          Continue to Goals
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}

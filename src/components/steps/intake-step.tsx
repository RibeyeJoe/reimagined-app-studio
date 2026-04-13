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
import type { CTAType, PlanningPath } from "@/lib/schema";
import { FLIGHTING_PRESETS } from "@/lib/schema";
import { supabase } from "@/integrations/supabase/client";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface AdvertiserOption {
  code: string;
  name: string;
}

interface HistoricalLookup {
  status: "idle" | "searching" | "found" | "not_found";
  campaignCount?: number;
  lastActivity?: string;
  channels?: string[];
}

const normalizeAdvertiser = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const getAdvertiserSearchVariants = (value: string) => {
  const sanitizedWords = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const variants = new Set<string>();

  for (const word of sanitizedWords) {
    if (word.length >= 2) variants.add(word);
    if (word.endsWith("s") && word.length > 4) variants.add(word.slice(0, -1));
  }

  return [...variants];
};

const buildAdvertiserFilter = (variants: string[]) =>
  variants
    .flatMap((variant) => [
      `advertiser_name.ilike.%${variant}%`,
      `advertiser_code.ilike.%${variant.toUpperCase()}%`,
    ])
    .join(",");

const scoreAdvertiserMatch = (
  candidate: { advertiser_code: string; advertiser_name: string | null },
  query: string
) => {
  const normalizedQuery = normalizeAdvertiser(query);
  const normalizedName = normalizeAdvertiser(candidate.advertiser_name || "");
  const normalizedCode = normalizeAdvertiser(candidate.advertiser_code);

  if (normalizedCode === normalizedQuery) return 120;
  if (normalizedName === normalizedQuery) return 110;
  if (normalizedName.includes(normalizedQuery)) return 100;
  if (normalizedCode.includes(normalizedQuery)) return 90;
  return 0;
};

export function IntakeStep() {
  const { state, updateIntake, setStep, setState } = usePlanner();
  const { intake } = state;
  const planningPath = (state as any).planningPath || "new";
  const [analyzing, setAnalyzing] = useState(false);
  const [lookup, setLookup] = useState<HistoricalLookup>({ status: "idle" });
  const [advertiserList, setAdvertiserList] = useState<AdvertiserOption[]>([]);
  const [advertiserListLoading, setAdvertiserListLoading] = useState(false);

  // Load all unique advertisers when "existing" path is selected
  useEffect(() => {
    if (planningPath !== "existing" || advertiserList.length > 0) return;
    setAdvertiserListLoading(true);
    supabase
      .from("campaign_performance")
      .select("advertiser_code, advertiser_name")
      .limit(1000)
      .then(({ data }) => {
        const unique = Array.from(
          new Map(
            (data || []).map(r => [r.advertiser_code, { code: r.advertiser_code, name: r.advertiser_name || r.advertiser_code }])
          ).values()
        ).sort((a, b) => a.name.localeCompare(b.name));
        setAdvertiserList(unique);
        setAdvertiserListLoading(false);
      });
  }, [planningPath]);

  const setPlanningPath = (path: PlanningPath) => {
    if (path === "new") {
      setState((prev: any) => ({
        ...prev,
        planningPath: "new",
        performanceUploaded: false,
        performanceAdvertisers: [],
        performanceAdvertiserCode: null,
        performanceAdvertiserName: null,
        performanceDMAs: [],
        performanceZIPs: [],
        performanceChannels: [],
        historicalData: [],
      }));
      setLookup({ status: "idle" });
    } else {
      setState((prev: any) => ({ ...prev, planningPath: "existing" }));
    }
  };

  const selectAdvertiser = (code: string) => {
    const adv = advertiserList.find(a => a.code === code);
    if (adv) {
      updateIntake({ businessName: adv.name });
    }
  };

  // Auto-lookup historical data when business name changes
  const lookupHistoricalData = useCallback(async (name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setLookup({ status: "idle" });
      setState((prev: any) => ({
        ...prev,
        performanceUploaded: false,
        performanceAdvertisers: [],
        performanceAdvertiserCode: null,
        performanceAdvertiserName: null,
        performanceDMAs: [],
        performanceZIPs: [],
      }));
      return;
    }

    setLookup({ status: "searching" });

    try {
      const variants = getAdvertiserSearchVariants(trimmedName);
      if (variants.length === 0) throw new Error("No valid advertiser search variants");

      const { data: candidateRows, error: candidateError } = await supabase
        .from("campaign_performance")
        .select("advertiser_code, advertiser_name")
        .or(buildAdvertiserFilter(variants))
        .limit(25);

      if (candidateError) throw candidateError;

      const uniqueCandidates = Array.from(
        new Map(
          (candidateRows || []).map((row) => [
            `${row.advertiser_code}:${row.advertiser_name || ""}`,
            row,
          ])
        ).values()
      ).sort((a, b) => scoreAdvertiserMatch(b, trimmedName) - scoreAdvertiserMatch(a, trimmedName));

      const matchedAdvertiser = uniqueCandidates[0];

      if (!matchedAdvertiser) {
        setLookup({ status: "not_found" });
        setState((prev: any) => ({
          ...prev,
          performanceUploaded: false,
          performanceAdvertisers: [],
          performanceAdvertiserCode: null,
          performanceAdvertiserName: null,
          performanceDMAs: [],
          performanceZIPs: [],
        }));
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/advertiser-insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          advertiserCode: matchedAdvertiser.advertiser_code,
          lookbackDays: 90,
        }),
      });

      if (!response.ok) throw new Error("Historical insights lookup failed");

      const insights = await response.json();

      if (!insights.found) {
        setLookup({ status: "not_found" });
        setState((prev: any) => ({
          ...prev,
          performanceUploaded: false,
          performanceAdvertisers: [],
          performanceAdvertiserCode: null,
          performanceAdvertiserName: null,
          performanceDMAs: [],
          performanceZIPs: [],
        }));
        return;
      }

      const channels = (insights.channels || []).map((channel: { channel: string }) => channel.channel);
      const dmas = (insights.topDMAs || []).map((row: { dma: string }) => row.dma).filter(Boolean);
      const zips = (insights.topZIPs || []).map((row: { zip: string }) => row.zip).filter(Boolean);

      setLookup({
        status: "found",
        campaignCount: insights.totalRows,
        lastActivity: insights.dateRange?.max ? format(new Date(insights.dateRange.max), "MMMM yyyy") : undefined,
        channels,
      });

      setState((prev: any) => ({
        ...prev,
        performanceUploaded: true,
        performanceAdvertisers: [matchedAdvertiser.advertiser_name || matchedAdvertiser.advertiser_code],
        performanceAdvertiserCode: matchedAdvertiser.advertiser_code,
        performanceAdvertiserName: matchedAdvertiser.advertiser_name || matchedAdvertiser.advertiser_code,
        performanceDMAs: dmas,
        performanceZIPs: zips,
        performanceChannels: channels,
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
          Start by choosing whether this is a new or existing client, then fill in their details.
        </p>
      </div>

      {/* Planning Path Selector */}
      <Card className="p-5 space-y-4 card-elevated">
        <Label className="text-sm font-display font-semibold">Planning Path</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPlanningPath("new")}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-center",
              planningPath === "new"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            )}
          >
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-sm font-semibold">New Client</span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              Start fresh with manual inputs and benchmark data
            </span>
          </button>
          <button
            onClick={() => setPlanningPath("existing")}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-center",
              planningPath === "existing"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            )}
          >
            <Database className="w-6 h-6 text-primary" />
            <span className="text-sm font-semibold">Existing Client</span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              Pull in historical data to optimize performance
            </span>
          </button>
        </div>

        {planningPath === "existing" && (
          <div className="space-y-2 animate-fade-in">
            <Label className="text-xs font-medium">Select Advertiser</Label>
            <Select onValueChange={selectAdvertiser}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={advertiserListLoading ? "Loading advertisers…" : "Choose an advertiser"} />
              </SelectTrigger>
              <SelectContent>
                {advertiserList.map(adv => (
                  <SelectItem key={adv.code} value={adv.code}>
                    {adv.name} ({adv.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>

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

      {/* Historical Performance Data — Auto Lookup (only for existing clients) */}
      {planningPath === "existing" && (
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
      )}

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

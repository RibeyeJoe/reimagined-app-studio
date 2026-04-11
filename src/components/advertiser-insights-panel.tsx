import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AdvertiserInsights } from "@/lib/performance-utils";
import {
  TrendingUp, AlertCircle, BarChart3, MapPin, Clock,
  Lightbulb, Monitor, ChevronDown, ChevronUp,
} from "lucide-react";

interface AdvertiserInsightsPanelProps {
  insights: AdvertiserInsights | null;
  loading: boolean;
  lookback: number;
  onLookbackChange: (days: number) => void;
  kpi?: string;
}

export function AdvertiserInsightsPanel({
  insights, loading, lookback, onLookbackChange, kpi,
}: AdvertiserInsightsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <Card className="p-5 space-y-3 card-elevated animate-fade-in">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary animate-pulse" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </Card>
    );
  }

  if (!insights) return null;

  if (!insights.found) {
    return (
      <Card className="p-5 space-y-2 card-elevated animate-fade-in border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-display font-semibold text-amber-800 dark:text-amber-200">No Historical Data</h3>
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-300">{insights.message}</p>
      </Card>
    );
  }

  const { channels = [], topDMAs = [], dayparts = [], recommendations = [] } = insights;

  return (
    <Card className="p-5 space-y-4 card-elevated animate-fade-in border-primary/20 bg-primary/5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display font-bold">Historical Performance — {insights.advertiserCode}</h3>
          <Badge variant="secondary" className="text-[10px]">
            {insights.totalRows?.toLocaleString()} records
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={lookback.toString()} onValueChange={(v) => onLookbackChange(Number(v))}>
            <SelectTrigger className="w-[140px] h-7 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {insights.dateRange && (
        <p className="text-[10px] text-muted-foreground">
          Data from {insights.dateRange.min} to {insights.dateRange.max}
        </p>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-background/80 border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Impressions</p>
          <p className="text-lg font-display font-bold">{(insights.totalImpressions || 0).toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-background/80 border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reach</p>
          <p className="text-lg font-display font-bold">{(insights.totalReach || 0).toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-background/80 border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Channels</p>
          <p className="text-lg font-display font-bold">{channels.length}</p>
        </div>
        <div className="p-3 rounded-lg bg-background/80 border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">DMAs</p>
          <p className="text-lg font-display font-bold">{topDMAs.length}+</p>
        </div>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2 p-4 rounded-lg bg-background/80 border border-primary/20">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-display font-bold uppercase tracking-wider">
              AI Recommendations {kpi ? `for "${kpi}"` : ""}
            </h4>
          </div>
          <ul className="space-y-1.5">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-xs text-foreground flex gap-2">
                <TrendingUp className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable Detail */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
        {expanded ? "Show Less" : "Show Channel & Geo Detail"}
      </Button>

      {expanded && (
        <div className="space-y-4 animate-fade-in">
          {/* Channel Breakdown */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channel Performance</p>
            {channels.map(ch => (
              <div key={ch.channel} className="p-3 rounded-lg bg-background/80 border">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Monitor className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-semibold">{ch.channel}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{ch.totalImpressions.toLocaleString()} imps</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground mt-1">
                  <div>Reach: <span className="font-semibold text-foreground">{ch.totalReach.toLocaleString()}</span></div>
                  <div>Avg Freq: <span className="font-semibold text-foreground">{ch.avgFrequency}</span></div>
                  <div>Avg VCR: <span className="font-semibold text-foreground">{ch.avgVCR}%</span></div>
                </div>
                {ch.topPublishers.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1.5">
                    {ch.topPublishers.slice(0, 5).map(p => (
                      <Badge key={p} variant="outline" className="text-[9px] px-1.5 py-0">{p}</Badge>
                    ))}
                    {ch.topPublishers.length > 5 && (
                      <span className="text-[9px] text-muted-foreground">+{ch.topPublishers.length - 5}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Top DMAs */}
          {topDMAs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top DMAs</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topDMAs.slice(0, 8).map(d => (
                  <div key={d.dma} className="flex items-center justify-between p-2 rounded-lg bg-background/80 border text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{d.dma}</span>
                    </div>
                    <span className="font-semibold flex-shrink-0 ml-2">{d.impressions.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daypart Breakdown */}
          {dayparts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daypart Performance</p>
              {dayparts.map(dp => (
                <div key={dp.daypart} className="flex items-center justify-between text-xs p-2 rounded-lg bg-background/80 border">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span>{dp.daypart}</span>
                  </div>
                  <div className="flex gap-3">
                    <span>{dp.impressions.toLocaleString()} imps</span>
                    <span className="font-semibold">VCR: {dp.avgVCR}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

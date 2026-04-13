import { useEffect, useState } from "react";
import { usePlanner } from "@/lib/planner-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ReachCurvesChart } from "@/components/reach-curves-chart";
import {
  CHANNELS, CHANNEL_GROUPS, OOH_VERTICALS, OOH_TYPES, DAYPARTS,
  type Channel, type ChannelAllocation, type ChannelGroup,
  type OOHVertical, type OOHType, type Daypart,
} from "@/lib/schema";
import { DEFAULT_CHANNEL_MIX, CHANNEL_META, CHANNEL_PRESETS, getChannelHint } from "@/lib/benchmarks";
import {
  Sparkles, ArrowLeft, ArrowRight, Lock, Unlock, ChevronDown, ChevronUp,
  Search, Share2, Monitor, PlayCircle, Tv, RadioTower,
  Radio, Headphones, MapPin, Mail, ShoppingCart, Youtube, Film, Signpost,
} from "lucide-react";

const CHANNEL_ICONS: Record<Channel, typeof Search> = {
  Search, Social: Share2, Display: Monitor, OLV: PlayCircle, CTV: Tv,
  "YouTube/YouTubeTV": Youtube, "Amazon/Prime Video/Twitch": ShoppingCart,
  Linear: RadioTower, Radio, Audio: Headphones, DOOH: MapPin, OOH: Signpost,
  Email: Mail, Netflix: Film,
};

const GROUP_LABELS: Record<ChannelGroup, { title: string; description: string }> = {
  "Demand Capture": { title: "Demand Capture", description: "Capture existing intent" },
  "Demand Create": { title: "Demand Create", description: "Generate new demand" },
  "Support": { title: "Support", description: "Support and retarget" },
};

const CHANNELS_WITH_DAYPARTS: Channel[] = ["Linear", "Radio"];
const CHANNELS_WITH_OOH: Channel[] = ["DOOH", "OOH"];

export function ChannelsStep() {
  const { state, updateChannels, setStep } = usePlanner();
  const { channels, intake, goals } = state;
  const channelMixMode = goals.channelMixMode || "expand";
  const performanceChannels: string[] = (state as any).performanceChannels || [];
  const normalizedHistoricalChannels = performanceChannels.map((channel) => channel.toLowerCase());
  const isConstrainedMode = channelMixMode === "improve" && normalizedHistoricalChannels.length > 0;
  const budget = intake.monthlyBudget || 5000;
  const hasServices = (intake.detected?.services?.length || 0) > 0;
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  const rebalanceAllocations = (allocations: ChannelAllocation[]) => {
    const enabled = allocations.filter((allocation) => allocation.enabled);
    if (enabled.length === 0) {
      return allocations.map((allocation) => ({ ...allocation, percentage: 0, budget: 0 }));
    }

    const total = enabled.reduce((sum, allocation) => sum + allocation.percentage, 0);

    return allocations.map((allocation) => {
      if (!allocation.enabled) {
        return { ...allocation, percentage: 0, budget: 0 };
      }

      const percentage = total > 0
        ? Math.round((allocation.percentage / total) * 100)
        : Math.round(100 / enabled.length);

      return {
        ...allocation,
        percentage,
        budget: Math.round(budget * (percentage / 100)),
      };
    });
  };

  const normalizeForMode = (allocations: ChannelAllocation[]) => {
    if (!isConstrainedMode) {
      return rebalanceAllocations(allocations);
    }

    const constrained = allocations.map((allocation) => {
      const isHistorical = normalizedHistoricalChannels.includes(allocation.channel.toLowerCase());
      return isHistorical
        ? allocation
        : { ...allocation, enabled: false, percentage: 0, budget: 0 };
    });

    const enabledHistorical = constrained.filter((allocation) => allocation.enabled);

    if (enabledHistorical.length > 0) {
      return rebalanceAllocations(constrained);
    }

    const fallbackHistorical = constrained.map((allocation) => {
      const isHistorical = normalizedHistoricalChannels.includes(allocation.channel.toLowerCase());
      return {
        ...allocation,
        enabled: isHistorical,
        percentage: isHistorical ? 1 : 0,
        budget: 0,
      };
    });

    return rebalanceAllocations(fallbackHistorical);
  };

  const suggestChannels = () => {
    const goal = goals.goal || "Leads";
    const mix = DEFAULT_CHANNEL_MIX[goal] || {};
    const allocs: ChannelAllocation[] = CHANNELS.map((channel) => {
      const percentage = mix[channel] || 0;
      return {
        channel,
        enabled: percentage > 0,
        percentage,
        budget: Math.round(budget * (percentage / 100)),
      };
    });

    updateChannels({ allocations: normalizeForMode(allocs), activePreset: null });
  };

  useEffect(() => {
    if (channels.allocations.length === 0 && goals.goal) suggestChannels();
  }, []);

  useEffect(() => {
    if (!channels.allocations.length) return;

    const normalized = normalizeForMode(channels.allocations);
    if (JSON.stringify(normalized) !== JSON.stringify(channels.allocations)) {
      updateChannels({ allocations: normalized, activePreset: isConstrainedMode ? null : channels.activePreset });
    }
  }, [isConstrainedMode, performanceChannels, budget]);

  const applyPreset = (presetId: string) => {
    const preset = CHANNEL_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    const allocs: ChannelAllocation[] = CHANNELS.map((channel) => {
      const percentage = preset.channels[channel] || 0;
      return {
        channel,
        enabled: percentage > 0,
        percentage,
        budget: Math.round(budget * (percentage / 100)),
      };
    });

    updateChannels({ allocations: normalizeForMode(allocs), locked: true, activePreset: presetId });
  };

  const toggleChannel = (channel: Channel) => {
    const updated = channels.allocations.map((allocation) =>
      allocation.channel === channel ? { ...allocation, enabled: !allocation.enabled } : allocation
    );
    updateChannels({ allocations: rebalanceAllocations(updated), activePreset: null });
  };

  const setPercentage = (channel: Channel, percentage: number) => {
    const updated = channels.allocations.map((allocation) =>
      allocation.channel === channel
        ? { ...allocation, percentage, budget: Math.round(budget * (percentage / 100)) }
        : allocation
    );
    updateChannels({ allocations: updated, activePreset: null });
  };

  const toggleOOHVertical = (channel: Channel, vertical: OOHVertical) => {
    const updated = channels.allocations.map((allocation) => {
      if (allocation.channel !== channel) return allocation;
      const current = allocation.oohVerticals || [];
      const next = current.includes(vertical) ? current.filter((item) => item !== vertical) : [...current, vertical];
      return { ...allocation, oohVerticals: next };
    });
    updateChannels({ allocations: updated });
  };

  const toggleOOHType = (channel: Channel, type: OOHType) => {
    const updated = channels.allocations.map((allocation) => {
      if (allocation.channel !== channel) return allocation;
      const current = allocation.oohTypes || [];
      const next = current.includes(type) ? current.filter((item) => item !== type) : [...current, type];
      return { ...allocation, oohTypes: next };
    });
    updateChannels({ allocations: updated });
  };

  const toggleDaypart = (channel: Channel, daypart: Daypart) => {
    const updated = channels.allocations.map((allocation) => {
      if (allocation.channel !== channel) return allocation;
      const current = allocation.dayparts || [];
      const next = current.includes(daypart) ? current.filter((item) => item !== daypart) : [...current, daypart];
      return { ...allocation, dayparts: next };
    });
    updateChannels({ allocations: updated });
  };

  const enabledCount = channels.allocations.filter((allocation) => allocation.enabled).length;
  const totalPct = channels.allocations.filter((allocation) => allocation.enabled).reduce((sum, allocation) => sum + allocation.percentage, 0);
  const channelsByGroup = (group: ChannelGroup) => {
    const groupChannels = CHANNEL_META.filter((meta) => meta.group === group).map((meta) => meta.channel);
    return channels.allocations.filter((allocation) => groupChannels.includes(allocation.channel as Channel));
  };

  const hasExtraConfig = (channel: string) => CHANNELS_WITH_DAYPARTS.includes(channel as Channel) || CHANNELS_WITH_OOH.includes(channel as Channel);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Channel Mix</h2>
        <p className="text-sm text-muted-foreground mt-1">Select channels and adjust budget allocation. Configure dayparts for Linear/Radio and verticals for OOH/DOOH.</p>
      </div>

      {isConstrainedMode && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Improve mode:</strong> Only channels from historical campaigns are active. Switch to "Expand channel mix" in the Goals step to add new channels.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-semibold">{enabledCount} active</Badge>
          <Badge variant={totalPct === 100 ? "default" : "outline"} className="font-semibold">{totalPct}% allocated</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => updateChannels({ locked: !channels.locked })}>
            {channels.locked ? <><Lock className="w-3.5 h-3.5 mr-1.5" />Locked</> : <><Unlock className="w-3.5 h-3.5 mr-1.5" />Unlocked</>}
          </Button>
          <Button size="sm" variant="outline" onClick={suggestChannels}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Suggest
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Presets</p>
        <div className="flex gap-2 flex-wrap">
          {CHANNEL_PRESETS.map((preset) => (
            <Tooltip key={preset.id}>
              <TooltipTrigger asChild>
                <Button size="sm" variant={channels.activePreset === preset.id ? "default" : "outline"} onClick={() => applyPreset(preset.id)}>
                  {preset.name}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs"><p className="text-xs">{preset.description}</p></TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {CHANNEL_GROUPS.map((group) => {
        const groupAllocs = channelsByGroup(group);
        if (groupAllocs.length === 0) return null;
        const groupInfo = GROUP_LABELS[group];
        return (
          <div key={group} className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">{groupInfo.title}</p>
              <span className="text-[10px] text-muted-foreground">{groupInfo.description}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groupAllocs.map((alloc) => {
                const Icon = CHANNEL_ICONS[alloc.channel as Channel] || Monitor;
                const hint = getChannelHint(alloc.channel as Channel, budget, hasServices);
                const isExpanded = expandedChannel === alloc.channel;
                const showExtra = alloc.enabled && hasExtraConfig(alloc.channel);
                const isHistorical = normalizedHistoricalChannels.includes(alloc.channel.toLowerCase());
                const isBlocked = isConstrainedMode && !isHistorical;
                return (
                  <Card key={alloc.channel} className={cn(
                    "p-4 transition-all card-elevated",
                    !alloc.enabled && "opacity-50",
                    isBlocked && "opacity-30 pointer-events-none"
                  )}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          alloc.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{alloc.channel}</p>
                          {isBlocked && <p className="text-[10px] text-muted-foreground italic">Not in historical data</p>}
                          {!isBlocked && hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
                        </div>
                      </div>
                      <Switch checked={alloc.enabled} onCheckedChange={() => toggleChannel(alloc.channel as Channel)} disabled={isBlocked} />
                    </div>
                    {alloc.enabled && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{alloc.percentage}%</span>
                          <span className="font-semibold">${alloc.budget.toLocaleString()}</span>
                        </div>
                        <Slider
                          value={[alloc.percentage]}
                          onValueChange={([value]) => setPercentage(alloc.channel as Channel, value)}
                          min={0}
                          max={100}
                          step={1}
                          disabled={channels.locked}
                        />
                      </div>
                    )}

                    {showExtra && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedChannel(isExpanded ? null : alloc.channel)}
                          className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {CHANNELS_WITH_OOH.includes(alloc.channel as Channel) ? "Verticals & Types" : "Dayparts"}
                        </button>

                        {isExpanded && CHANNELS_WITH_OOH.includes(alloc.channel as Channel) && (
                          <div className="mt-2 space-y-2 animate-fade-in">
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Verticals</p>
                              <div className="flex gap-1.5 flex-wrap">
                                {OOH_VERTICALS.map((vertical) => (
                                  <label key={vertical} className="flex items-center gap-1 text-xs cursor-pointer">
                                    <Checkbox
                                      checked={(alloc.oohVerticals || []).includes(vertical)}
                                      onCheckedChange={() => toggleOOHVertical(alloc.channel as Channel, vertical)}
                                    />
                                    {vertical}
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Placement Types</p>
                              <div className="flex gap-1.5 flex-wrap">
                                {OOH_TYPES.map((type) => (
                                  <label key={type} className="flex items-center gap-1 text-xs cursor-pointer">
                                    <Checkbox
                                      checked={(alloc.oohTypes || []).includes(type)}
                                      onCheckedChange={() => toggleOOHType(alloc.channel as Channel, type)}
                                    />
                                    {type}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {isExpanded && CHANNELS_WITH_DAYPARTS.includes(alloc.channel as Channel) && (
                          <div className="mt-2 animate-fade-in">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Dayparts</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {DAYPARTS.map((daypart) => (
                                <label key={daypart} className="flex items-center gap-1 text-xs cursor-pointer">
                                  <Checkbox
                                    checked={(alloc.dayparts || []).includes(daypart)}
                                    onCheckedChange={() => toggleDaypart(alloc.channel as Channel, daypart)}
                                  />
                                  {daypart}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Reach Curves */}
      {channels.allocations.some((allocation) => allocation.enabled && allocation.budget > 0) && (
        <Card className="p-5 card-elevated">
          <ReachCurvesChart allocations={channels.allocations} totalBudget={budget} />
        </Card>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => setStep("audiences")}><ArrowLeft className="w-4 h-4 mr-1.5" /> Back</Button>
        <Button onClick={() => setStep("review")} className="font-semibold">Continue to Review <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
      </div>
    </div>
  );
}

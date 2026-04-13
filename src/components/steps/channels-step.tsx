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
  const isConstrainedMode = channelMixMode === "improve" && performanceChannels.length > 0;
  const budget = intake.monthlyBudget || 5000;
  const hasServices = (intake.detected?.services?.length || 0) > 0;
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  useEffect(() => {
    if (channels.allocations.length === 0 && goals.goal) suggestChannels();
  }, []);

  const suggestChannels = () => {
    const goal = goals.goal || "Leads";
    const mix = DEFAULT_CHANNEL_MIX[goal] || {};
    const allocs: ChannelAllocation[] = CHANNELS.map(ch => {
      const pct = mix[ch] || 0;
      return { channel: ch, enabled: pct > 0, percentage: pct, budget: Math.round(budget * (pct / 100)) };
    });
    updateChannels({ allocations: allocs, activePreset: null });
  };

  const applyPreset = (presetId: string) => {
    const preset = CHANNEL_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    const allocs: ChannelAllocation[] = CHANNELS.map(ch => {
      const pct = preset.channels[ch] || 0;
      return { channel: ch, enabled: pct > 0, percentage: pct, budget: Math.round(budget * (pct / 100)) };
    });
    updateChannels({ allocations: allocs, locked: true, activePreset: presetId });
  };

  const toggleChannel = (channel: Channel) => {
    const updated = channels.allocations.map(a => a.channel === channel ? { ...a, enabled: !a.enabled } : a);
    const enabled = updated.filter(a => a.enabled);
    if (enabled.length === 0) { updateChannels({ allocations: updated }); return; }
    const totalPct = enabled.reduce((s, a) => s + a.percentage, 0);
    const balanced = updated.map(a => {
      if (!a.enabled) return { ...a, percentage: 0, budget: 0 };
      const pct = totalPct > 0 ? Math.round((a.percentage / totalPct) * 100) : Math.round(100 / enabled.length);
      return { ...a, percentage: pct, budget: Math.round(budget * (pct / 100)) };
    });
    updateChannels({ allocations: balanced, activePreset: null });
  };

  const setPercentage = (channel: Channel, pct: number) => {
    const updated = channels.allocations.map(a =>
      a.channel === channel ? { ...a, percentage: pct, budget: Math.round(budget * (pct / 100)) } : a
    );
    updateChannels({ allocations: updated, activePreset: null });
  };

  const toggleOOHVertical = (channel: Channel, vertical: OOHVertical) => {
    const updated = channels.allocations.map(a => {
      if (a.channel !== channel) return a;
      const current = a.oohVerticals || [];
      const next = current.includes(vertical) ? current.filter(v => v !== vertical) : [...current, vertical];
      return { ...a, oohVerticals: next };
    });
    updateChannels({ allocations: updated });
  };

  const toggleOOHType = (channel: Channel, type: OOHType) => {
    const updated = channels.allocations.map(a => {
      if (a.channel !== channel) return a;
      const current = a.oohTypes || [];
      const next = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
      return { ...a, oohTypes: next };
    });
    updateChannels({ allocations: updated });
  };

  const toggleDaypart = (channel: Channel, daypart: Daypart) => {
    const updated = channels.allocations.map(a => {
      if (a.channel !== channel) return a;
      const current = a.dayparts || [];
      const next = current.includes(daypart) ? current.filter(d => d !== daypart) : [...current, daypart];
      return { ...a, dayparts: next };
    });
    updateChannels({ allocations: updated });
  };

  const enabledCount = channels.allocations.filter(a => a.enabled).length;
  const totalPct = channels.allocations.filter(a => a.enabled).reduce((s, a) => s + a.percentage, 0);
  const channelsByGroup = (group: ChannelGroup) => {
    const groupChannels = CHANNEL_META.filter(m => m.group === group).map(m => m.channel);
    return channels.allocations.filter(a => groupChannels.includes(a.channel as Channel));
  };

  const hasExtraConfig = (ch: string) => CHANNELS_WITH_DAYPARTS.includes(ch as Channel) || CHANNELS_WITH_OOH.includes(ch as Channel);

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
          {CHANNEL_PRESETS.map(preset => (
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

      {/* Reach Curves */}
      {channels.allocations.some(a => a.enabled && a.budget > 0) && (
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

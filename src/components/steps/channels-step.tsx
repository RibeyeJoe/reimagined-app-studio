import { useEffect } from "react";
import { usePlanner } from "@/lib/planner-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CHANNELS, CHANNEL_GROUPS, type Channel, type ChannelAllocation, type ChannelGroup } from "@/lib/schema";
import { DEFAULT_CHANNEL_MIX, CHANNEL_META, CHANNEL_PRESETS, getChannelHint } from "@/lib/benchmarks";
import {
  Sparkles, ArrowLeft, ArrowRight, Lock, Unlock,
  Search, Share2, Monitor, PlayCircle, Tv, RadioTower,
  Radio, Headphones, MapPin, Mail, ShoppingCart, Youtube, Film,
} from "lucide-react";

const CHANNEL_ICONS: Record<Channel, typeof Search> = {
  Search, Social: Share2, Display: Monitor, OLV: PlayCircle, CTV: Tv,
  "YouTube/YouTubeTV": Youtube, "Amazon/Prime Video/Twitch": ShoppingCart,
  Linear: RadioTower, Radio, Audio: Headphones, DOOH: MapPin, Email: Mail, Netflix: Film,
};

const GROUP_LABELS: Record<ChannelGroup, { title: string; description: string }> = {
  "Demand Capture": { title: "Demand Capture", description: "Capture existing intent" },
  "Demand Create": { title: "Demand Create", description: "Generate new demand" },
  "Support": { title: "Support", description: "Support and retarget" },
};

export function ChannelsStep() {
  const { state, updateChannels, setStep } = usePlanner();
  const { channels, intake, goals } = state;
  const budget = intake.monthlyBudget || 5000;
  const hasServices = (intake.detected?.services?.length || 0) > 0;

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

  const enabledCount = channels.allocations.filter(a => a.enabled).length;
  const totalPct = channels.allocations.filter(a => a.enabled).reduce((s, a) => s + a.percentage, 0);
  const channelsByGroup = (group: ChannelGroup) => {
    const groupChannels = CHANNEL_META.filter(m => m.group === group).map(m => m.channel);
    return channels.allocations.filter(a => groupChannels.includes(a.channel as Channel));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Channel Mix</h2>
        <p className="text-sm text-muted-foreground mt-1">Select channels and adjust budget allocation.</p>
      </div>

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

      {CHANNEL_GROUPS.map(group => {
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
              {groupAllocs.map(alloc => {
                const Icon = CHANNEL_ICONS[alloc.channel as Channel] || Monitor;
                const hint = getChannelHint(alloc.channel as Channel, budget, hasServices);
                return (
                  <Card key={alloc.channel} className={cn("p-4 transition-all card-elevated", !alloc.enabled && "opacity-50")}>
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
                          {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
                        </div>
                      </div>
                      <Switch checked={alloc.enabled} onCheckedChange={() => toggleChannel(alloc.channel as Channel)} />
                    </div>
                    {alloc.enabled && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{alloc.percentage}%</span>
                          <span className="font-semibold">${alloc.budget.toLocaleString()}</span>
                        </div>
                        <Slider
                          value={[alloc.percentage]}
                          onValueChange={([v]) => setPercentage(alloc.channel as Channel, v)}
                          min={0} max={100} step={1}
                          disabled={channels.locked}
                        />
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => setStep("audiences")}><ArrowLeft className="w-4 h-4 mr-1.5" /> Back</Button>
        <Button onClick={() => setStep("review")} className="font-semibold">Continue to Review <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
      </div>
    </div>
  );
}

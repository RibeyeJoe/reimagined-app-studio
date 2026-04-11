import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Share2, Monitor, PlayCircle, Tv, RadioTower,
  Radio, Headphones, MapPin, Mail, ShoppingCart, Youtube, Film, Signpost,
} from "lucide-react";
import { CHANNELS, OOH_VERTICALS, OOH_TYPES, type Channel } from "@/lib/schema";
import ChannelConfigModal, {
  type ChannelConfig,
  getConfigSummary,
} from "@/components/channel-config-modal";
import { toast } from "sonner";

const CHANNEL_ICONS: Record<string, typeof Search> = {
  Search, Social: Share2, Display: Monitor, OLV: PlayCircle,
  CTV: Tv, "YouTube/YouTubeTV": Youtube, "Amazon/Prime Video/Twitch": ShoppingCart,
  Linear: RadioTower, Radio, Audio: Headphones, DOOH: MapPin, OOH: Signpost,
  Email: Mail, Netflix: Film,
};

const OOH_CHANNELS = ["OOH", "DOOH"];

const EMPTY_CONFIG: ChannelConfig = {
  pricing: [],
  daypartRates: [],
  publishers: [],
  notes: "",
};

export default function MediaChannelsPage() {
  const [configs, setConfigs] = useState<Record<string, ChannelConfig>>({});
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  const handleSave = (channel: Channel, config: ChannelConfig) => {
    setConfigs((prev) => ({ ...prev, [channel]: config }));
    toast.success(`${channel} configuration saved`);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border flex-shrink-0 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <h1 className="text-sm font-display font-bold text-foreground">Media Channels</h1>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Media Channels</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Available advertising channels for your media plans, including OOH and DOOH with verticals and placement types.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CHANNELS.map((ch) => {
              const Icon = CHANNEL_ICONS[ch] || Monitor;
              const isOOH = OOH_CHANNELS.includes(ch);
              const cfg = configs[ch];
              const summary = cfg ? getConfigSummary(cfg) : null;
              return (
                <Card
                  key={ch}
                  className="p-4 card-elevated cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all"
                  onClick={() => setActiveChannel(ch)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-display font-bold">{ch}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {summary || (isOOH ? "Select verticals & types in planner" : "Configure in planner")}
                      </p>
                    </div>
                  </div>
                  {isOOH && (
                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Verticals</p>
                        <div className="flex gap-1 flex-wrap">
                          {OOH_VERTICALS.map((v) => (
                            <Badge key={v} variant="secondary" className="text-[10px]">{v}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Placement Types</p>
                        <div className="flex gap-1 flex-wrap">
                          {OOH_TYPES.slice(0, 8).map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                          ))}
                          {OOH_TYPES.length > 8 && (
                            <Badge variant="outline" className="text-[10px]">+{OOH_TYPES.length - 8} more</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <ChannelConfigModal
        channel={activeChannel}
        open={activeChannel !== null}
        onOpenChange={(open) => !open && setActiveChannel(null)}
        config={activeChannel ? configs[activeChannel] || EMPTY_CONFIG : EMPTY_CONFIG}
        onSave={handleSave}
      />
    </div>
  );
}

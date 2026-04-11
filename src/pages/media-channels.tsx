import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search, Share2, Monitor, PlayCircle, Tv, RadioTower,
  Radio, Headphones, MapPin, Mail, ShoppingCart, Youtube, Film, Package,
} from "lucide-react";
import { CHANNELS, type Channel } from "@/lib/schema";

const CHANNEL_ICONS: Record<string, typeof Search> = {
  Search, Social: Share2, Display: Monitor, OLV: PlayCircle,
  CTV: Tv, "YouTube/YouTubeTV": Youtube, "Amazon/Prime Video/Twitch": ShoppingCart,
  Linear: RadioTower, Radio, Audio: Headphones, DOOH: MapPin, Email: Mail, Netflix: Film,
};

export default function MediaChannelsPage() {
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
              Available advertising channels for your media plans.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CHANNELS.map(ch => {
              const Icon = CHANNEL_ICONS[ch] || Monitor;
              return (
                <Card key={ch} className="p-4 card-elevated">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-display font-bold">{ch}</p>
                      <p className="text-xs text-muted-foreground">Configure in planner</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plug, Wifi, WifiOff, AlertCircle } from "lucide-react";

const INTEGRATIONS = [
  { name: "Google Ads", category: "Search & Display", status: "not_configured" },
  { name: "Meta Ads", category: "Social", status: "not_configured" },
  { name: "The Trade Desk", category: "DSP", status: "not_configured" },
  { name: "Google Analytics", category: "Data & Analytics", status: "not_configured" },
  { name: "Amazon DSP", category: "DSP", status: "not_configured" },
  { name: "Spotify Ad Studio", category: "Audio", status: "not_configured" },
];

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border flex-shrink-0 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <h1 className="text-sm font-display font-bold text-foreground">Integrations</h1>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Integrations</h2>
            <p className="text-sm text-muted-foreground mt-1">Connect to your ad tech platforms.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 flex items-center gap-3 card-elevated">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-emerald-600">0</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3 card-elevated">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-destructive">0</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3 card-elevated">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-muted-foreground">{INTEGRATIONS.length}</p>
                <p className="text-xs text-muted-foreground">Not Configured</p>
              </div>
            </Card>
          </div>

          <div className="space-y-3">
            {INTEGRATIONS.map(item => (
              <Card key={item.name} className="p-4 card-elevated">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Plug className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-display font-bold">{item.name}</p>
                      <Badge variant="outline" className="text-[10px] mt-0.5">{item.category}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Not Configured</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

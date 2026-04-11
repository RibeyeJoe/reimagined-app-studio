import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Presentation, Plus, Download, Star } from "lucide-react";

const DEFAULT_TEMPLATES = [
  {
    name: "Standard Proposal",
    description: "Clean, professional layout for most clients",
    isDefault: true,
    colors: ["#D4654A", "#3C2415", "#F5A623"],
  },
  {
    name: "Enterprise",
    description: "Premium design for large accounts",
    isDefault: false,
    colors: ["#1a1a2e", "#0f3460", "#e94560"],
  },
  {
    name: "Minimal",
    description: "Simple and focused deck template",
    isDefault: false,
    colors: ["#f5f3ee", "#2d2d2d", "#0d0d0d"],
  },
];

export default function TemplatesPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border flex-shrink-0 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-sm font-display font-bold flex items-center gap-2">
              <Presentation className="w-4 h-4" /> Proposal Templates
            </h1>
          </div>
        </div>
        <Button size="sm" className="font-semibold text-xs">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Template
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEFAULT_TEMPLATES.map(t => (
              <Card key={t.name} className="p-5 space-y-3 card-elevated">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-display font-bold flex items-center gap-1.5">
                      {t.name}
                      {t.isDefault && <Star className="w-3.5 h-3.5 text-gold fill-gold" />}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {t.colors.map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {["Title", "Overview", "Channels", "KPIs", "Investment"].map(s => (
                    <Badge key={s} variant="default" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

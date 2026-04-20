import { useState } from "react";
import { usePlanner } from "@/lib/planner-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AUDIENCE_TIERS, DEMO_OPTIONS, ETHNIC_OVERLAYS, type AudienceTier, type AudienceItem, type DemoOption, type EthnicOverlay } from "@/lib/schema";
import { Users, Sparkles, X, ArrowLeft, ArrowRight, Zap, TrendingUp, Megaphone, Plus, Swords, Trash2, UserCircle2 } from "lucide-react";
import { generateAudienceSuggestions } from "@/lib/audience-suggestions";
import { getUniverse } from "@/lib/calculations";

const TIER_META: Record<AudienceTier, { icon: typeof Zap; color: string; description: string }> = {
  "High Intent": { icon: Zap, color: "bg-emerald-100 text-emerald-700", description: "Ready to buy or take action now" },
  "Mid Intent": { icon: TrendingUp, color: "bg-blue-100 text-blue-700", description: "Researching and comparing options" },
  "Reach": { icon: Megaphone, color: "bg-primary/10 text-primary", description: "Building awareness with broad audiences" },
};

export function AudiencesStep() {
  const { state, updateAudiences, setStep } = usePlanner();
  const { audiences, intake, geo } = state;
  const [newInput, setNewInput] = useState("");
  const [newTier, setNewTier] = useState<AudienceTier>("High Intent");

  const demo = audiences.demo || "Adults 25-54";
  const ethnicOverlay = audiences.ethnicOverlay || "General Market";

  // Live universe preview based on geo + demo + ethnic overlay
  const geoParam = (() => {
    const v = geo.geoValue;
    if (!v) return "National" as const;
    const parts = v.split(";").map(s => s.trim()).filter(Boolean);
    return parts.length > 1 ? parts : (parts[0] || "National");
  })();
  const liveUniverseK = getUniverse(geoParam, "All Adults", demo, ethnicOverlay);
  const geoLabel = !geo.geoValue ? "U.S." : (() => {
    const parts = geo.geoValue.split(";").map(s => s.trim()).filter(Boolean);
    if (parts.length <= 3) return parts.join(", ");
    const areZips = parts.every(g => /^\d{5}$/.test(g));
    return areZips ? `${parts.length} ZIP codes` : `${parts.length} DMAs`;
  })();
  const ethnicLabel = ethnicOverlay && ethnicOverlay !== "General Market" ? `${ethnicOverlay} ` : "";

  const suggestAudiences = () => {
    const vertical = intake.detected?.vertical || "default";
    const services = intake.detected?.services || [];
    const businessName = intake.businessName || intake.detected?.businessName || "";
    const goal = state.goals?.goal || null;
    const result = generateAudienceSuggestions(vertical, goal, businessName, audiences.conquestEnabled, services);
    updateAudiences({ audiences: result.audiences });
  };

  const removeAudience = (name: string) => {
    updateAudiences({ audiences: audiences.audiences.filter(a => a.name !== name) });
  };

  const addAudience = () => {
    if (!newInput.trim()) return;
    if (audiences.audiences.some(a => a.name.toLowerCase() === newInput.trim().toLowerCase())) return;
    updateAudiences({ audiences: [...audiences.audiences, { name: newInput.trim(), tier: newTier }] });
    setNewInput("");
  };

  const audiencesByTier = (tier: AudienceTier) => audiences.audiences.filter(a => a.tier === tier);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Audience Stack</h2>
        <p className="text-sm text-muted-foreground mt-1">Build your audience strategy in three tiers.</p>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={audiences.conquestEnabled} onCheckedChange={v => updateAudiences({ conquestEnabled: v })} />
            <Label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <Swords className="w-3.5 h-3.5" /> Conquest Mode
            </Label>
          </div>
        </div>
        <div className="flex gap-2">
          {audiences.audiences.length > 0 && (
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateAudiences({ audiences: [] })}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear All
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={suggestAudiences}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Suggest
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {AUDIENCE_TIERS.map(tier => {
          const meta = TIER_META[tier];
          const Icon = meta.icon;
          const tierAudiences = audiencesByTier(tier);
          return (
            <Card key={tier} className="p-4 card-elevated">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", meta.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold">{tier}</h3>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </div>
              </div>
              {tierAudiences.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {tierAudiences.map(a => (
                    <Badge key={a.name} variant="secondary" className="flex items-center gap-1">
                      {a.name}
                      <button onClick={() => removeAudience(a.name)}><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
              {tierAudiences.length === 0 && (
                <p className="text-xs text-muted-foreground italic mb-2">No audiences added yet</p>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="p-4 card-elevated">
        <div className="flex gap-2">
          <Input placeholder="Add custom audience..." value={newInput}
            onChange={e => setNewInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addAudience()} className="flex-1" />
          <Select value={newTier} onValueChange={(v) => setNewTier(v as AudienceTier)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIENCE_TIERS.map(tier => (
                <SelectItem key={tier} value={tier}>{tier}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={addAudience} disabled={!newInput.trim()}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => setStep("geo")}><ArrowLeft className="w-4 h-4 mr-1.5" /> Back</Button>
        <Button onClick={() => setStep("channels")} className="font-semibold">Continue to Channels <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
      </div>
    </div>
  );
}

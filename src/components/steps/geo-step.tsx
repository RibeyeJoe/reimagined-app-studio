import { useState } from "react";
import { usePlanner } from "@/lib/planner-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GEO_TYPES, type GeoType } from "@/lib/schema";
import { MapPin, Sparkles, ArrowLeft, ArrowRight, AlertTriangle, Building, Radio, Map, Hash, Landmark, Plus, X } from "lucide-react";

const GEO_ICONS: Record<GeoType, typeof Building> = {
  City: Building, DMA: Radio, "ZIP List": Hash, Radius: Map, "Congressional District": Landmark,
};

const GEO_PLACEHOLDERS: Record<GeoType, string> = {
  City: "Dallas, TX", DMA: "Dallas-Fort Worth DMA", "ZIP List": "75201, 75202, 75203",
  Radius: "15 miles from 75201", "Congressional District": "TX-32",
};

function parseLocations(v: string): string[] { return v.split(";").map(s => s.trim()).filter(Boolean); }
function joinLocations(l: string[]): string { return l.join("; "); }

export function GeoStep() {
  const { state, updateGeo, setStep } = usePlanner();
  const { geo, intake } = state;
  const budget = intake.monthlyBudget || 0;
  const [newLoc, setNewLoc] = useState("");
  const locations = parseLocations(geo.geoValue);
  const isLowBudget = (geo.geoType === "DMA" && budget < 10000) || (geo.geoType === "Congressional District" && budget < 2500);

  const addLocation = () => { if (!newLoc.trim()) return; updateGeo({ geoValue: joinLocations([...locations, newLoc.trim()]) }); setNewLoc(""); };
  const removeLocation = (i: number) => { updateGeo({ geoValue: joinLocations(locations.filter((_, idx) => idx !== i)) }); };

  const suggestGeo = () => {
    const locs = intake.locations ? intake.locations.split(";").map(l => l.trim()).filter(Boolean) : ["business location"];
    updateGeo({
      geoType: "Radius",
      geoValue: locs.map(l => `15 miles from ${l}`).join("; "),
      strategies: [
        { type: "Core", description: "0-5 mile radius: Primary service area, highest intent" },
        { type: "Growth Ring", description: "5-15 mile radius: Expansion zone, moderate intent" },
        { type: "Conquest Zone", description: "15-25 mile radius: Competitor territory, awareness focus" },
      ],
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Geographic Targeting</h2>
        <p className="text-sm text-muted-foreground mt-1">Where should we show ads? Pick a targeting method and add locations.</p>
      </div>

      <Card className="p-6 space-y-5 card-elevated">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Label className="text-sm font-medium">Targeting Method</Label>
          <Button size="sm" variant="outline" onClick={suggestGeo}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Suggest
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {GEO_TYPES.map(type => {
            const Icon = GEO_ICONS[type];
            const isSelected = geo.geoType === type;
            return (
              <button key={type} onClick={() => updateGeo({ geoType: type, geoValue: "" })}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all text-center",
                  isSelected ? "border-primary bg-coral-light/40 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                )}>
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{type}</span>
              </button>
            );
          })}
        </div>

        {geo.geoType && (
          <div className="space-y-3">
            {locations.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {locations.map((loc, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1 text-xs py-1 px-2">
                    <MapPin className="w-3 h-3" /> {loc}
                    <button onClick={() => removeLocation(idx)} className="ml-0.5 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input placeholder={GEO_PLACEHOLDERS[geo.geoType]} value={newLoc}
                onChange={e => setNewLoc(e.target.value)} onKeyDown={e => e.key === "Enter" && addLocation()} />
              <Button size="sm" variant="outline" onClick={addLocation} disabled={!newLoc.trim()}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>
        )}

        {isLowBudget && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/50 text-accent-foreground">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs">Your budget may be tight for this targeting approach. Consider a more focused method.</p>
          </div>
        )}
      </Card>

      {geo.strategies.length > 0 && (
        <Card className="p-5 space-y-3 card-elevated animate-fade-in">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-display font-bold">AI Geo Strategy</h3>
          </div>
          <div className="space-y-2">
            {geo.strategies.map(s => (
              <div key={s.type} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Badge variant="secondary" className="flex-shrink-0 mt-0.5">{s.type}</Badge>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => setStep("goals")}><ArrowLeft className="w-4 h-4 mr-1.5" /> Back</Button>
        <Button onClick={() => setStep("audiences")} className="font-semibold">Continue to Audiences <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
      </div>
    </div>
  );
}

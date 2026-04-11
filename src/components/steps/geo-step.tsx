import { useState, useRef, useEffect } from "react";
import { usePlanner } from "@/lib/planner-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { GEO_TYPES, type GeoType } from "@/lib/schema";
import { MapPin, Sparkles, ArrowLeft, ArrowRight, AlertTriangle, Building, Radio, Map, Hash, Landmark, Plus, X, Upload, FileText, Database } from "lucide-react";

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
  const perfState = state as any;
  const performanceDMAs: string[] = perfState.performanceDMAs || [];
  const hasPerformanceData = perfState.performanceUploaded;
  const performanceAdvertiserName: string | undefined = perfState.performanceAdvertiserName || undefined;
  const budget = intake.monthlyBudget || 0;
  const [newLoc, setNewLoc] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locations = parseLocations(geo.geoValue);
  const isLowBudget = (geo.geoType === "DMA" && budget < 10000) || (geo.geoType === "Congressional District" && budget < 2500);

  // Auto-populate geo from historical DMAs if geo is empty
  useEffect(() => {
    if (hasPerformanceData && performanceDMAs.length > 0 && !geo.geoType && !geo.geoValue) {
      updateGeo({
        geoType: "DMA",
        geoValue: performanceDMAs.join("; "),
        strategies: [],
      });
    }
  }, [hasPerformanceData, performanceDMAs, geo.geoType, geo.geoValue, updateGeo]);

  const addLocation = () => { if (!newLoc.trim()) return; updateGeo({ geoValue: joinLocations([...locations, newLoc.trim()]) }); setNewLoc(""); };
  const removeLocation = (i: number) => { updateGeo({ geoValue: joinLocations(locations.filter((_, idx) => idx !== i)) }); };

  const handleBulkAdd = () => {
    const lines = bulkText
      .split(/[\n,;]+/)
      .map(l => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    const combined = [...locations, ...lines];
    updateGeo({ geoValue: joinLocations(combined) });
    setBulkText("");
    setBulkMode(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text
        .split(/[\n,;]+/)
        .map(l => l.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean)
        .filter(l => !/^(city|location|address|zip|dma|name)/i.test(l)); // skip headers
      if (lines.length > 0) {
        const combined = [...locations, ...lines];
        updateGeo({ geoValue: joinLocations(combined) });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
        <p className="text-sm text-muted-foreground mt-1">Where should we show ads? Pick a targeting method and add locations. Supports bulk entry for 200+ locations.</p>
      </div>

      {hasPerformanceData && performanceDMAs.length > 0 && geo.geoType === "DMA" && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <Database className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            <strong>{performanceDMAs.length} DMAs</strong> auto-populated from {performanceAdvertiserName || "historical"} campaign data. All values are editable.
          </p>
        </div>
      )}

      <Card className="p-6 space-y-5 card-elevated">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Label className="text-sm font-medium">Targeting Method</Label>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setBulkMode(!bulkMode)}>
              <FileText className="w-3.5 h-3.5 mr-1.5" /> {bulkMode ? "Single Add" : "Bulk Add"}
            </Button>
            <Button size="sm" variant="outline" onClick={suggestGeo}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Suggest
            </Button>
          </div>
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
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground">{locations.length} location{locations.length !== 1 ? "s" : ""} added</p>
                  {locations.length > 10 && (
                    <Button size="sm" variant="ghost" className="text-xs h-6 text-destructive" onClick={() => updateGeo({ geoValue: "" })}>
                      Clear All
                    </Button>
                  )}
                </div>
                <div className="flex gap-1.5 flex-wrap max-h-40 overflow-y-auto">
                  {locations.map((loc, idx) => (
                    <Badge key={idx} variant="secondary" className="flex items-center gap-1 text-xs py-1 px-2">
                      <MapPin className="w-3 h-3" /> {loc}
                      <button onClick={() => removeLocation(idx)} className="ml-0.5 hover:text-destructive"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {bulkMode ? (
              <div className="space-y-3">
                <Textarea
                  placeholder={`Paste locations, one per line or separated by commas:\n${GEO_PLACEHOLDERS[geo.geoType]}\n...`}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  rows={6}
                  className="font-mono text-xs"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleBulkAdd} disabled={!bulkText.trim()}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add {bulkText.split(/[\n,;]+/).filter(l => l.trim()).length} Locations
                  </Button>
                  <input ref={fileInputRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFileUpload} />
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-3.5 h-3.5 mr-1" /> Upload CSV
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input placeholder={GEO_PLACEHOLDERS[geo.geoType]} value={newLoc}
                  onChange={e => setNewLoc(e.target.value)} onKeyDown={e => e.key === "Enter" && addLocation()} />
                <Button size="sm" variant="outline" onClick={addLocation} disabled={!newLoc.trim()}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>
            )}
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

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown, Clock, Info } from "lucide-react";
import { type Channel, OOH_VERTICALS, OOH_TYPES, DAYPARTS } from "@/lib/schema";

const PRICING_MODELS = ["CPM", "CPC", "CPV", "CPA", "Flat Fee", "Custom"] as const;

const DIGITAL_DAYPARTS = [
  "Morning (6a–10a)",
  "Midday (10a–2p)",
  "Afternoon (2p–6p)",
  "Evening (6p–10p)",
  "Late Night (10p–2a)",
  "Overnight (2a–6a)",
] as const;

const BROADCAST_CHANNELS: Channel[] = ["Linear", "Radio", "Audio", "CTV"];

export interface PricingRow {
  id: string;
  model: string;
  rate: number;
  label: string;
  source?: string;
}

export interface DaypartRate {
  daypart: string;
  rate: number;
  source?: string;
}

export interface PublisherEntry {
  id: string;
  name: string;
  rate: number;
  source?: string;
}

export interface ChannelConfig {
  pricing: PricingRow[];
  daypartRates: DaypartRate[];
  publishers: PublisherEntry[];
  notes: string;
  oohVerticals?: string[];
  oohTypes?: string[];
}

const uid = () => Math.random().toString(36).slice(2, 9);

const EMPTY_CONFIG: ChannelConfig = {
  pricing: [{ id: uid(), model: "CPM", rate: 0, label: "" }],
  daypartRates: [],
  publishers: [],
  notes: "",
};

interface Props {
  channel: Channel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ChannelConfig;
  onSave: (channel: Channel, config: ChannelConfig) => void;
}

function SourceTag({ source }: { source?: string }) {
  if (!source) return null;
  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
      <Info className="w-3 h-3" />
      {source}
    </span>
  );
}

export function getConfigSummary(cfg: ChannelConfig): string | null {
  const parts: string[] = [];
  const primary = cfg.pricing.find((p) => p.rate > 0);
  if (primary) parts.push(`${primary.model}: $${primary.rate.toFixed(2)}`);
  const pubCount = cfg.publishers.filter((p) => p.name.trim()).length;
  if (pubCount) parts.push(`${pubCount} publisher${pubCount > 1 ? "s" : ""}`);
  const dpCount = cfg.daypartRates.filter((d) => d.rate > 0).length;
  if (dpCount) parts.push(`${dpCount} daypart${dpCount > 1 ? "s" : ""}`);
  if (cfg.oohVerticals?.length) parts.push(`${cfg.oohVerticals.length} vertical${cfg.oohVerticals.length > 1 ? "s" : ""}`);
  return parts.length ? parts.join(" · ") : null;
}

export default function ChannelConfigModal({ channel, open, onOpenChange, config, onSave }: Props) {
  const [local, setLocal] = useState<ChannelConfig>(config);

  useEffect(() => {
    if (open) setLocal(config.pricing.length ? config : { ...EMPTY_CONFIG, pricing: [{ id: uid(), model: "CPM", rate: 0, label: "" }] });
  }, [open, config]);

  if (!channel) return null;

  const isOOH = channel === "OOH" || channel === "DOOH";
  const isBroadcast = BROADCAST_CHANNELS.includes(channel);
  const dayparts = isBroadcast ? DAYPARTS : DIGITAL_DAYPARTS;

  const updatePricing = (id: string, patch: Partial<PricingRow>) =>
    setLocal((p) => ({ ...p, pricing: p.pricing.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

  const addPricing = () =>
    setLocal((p) => ({ ...p, pricing: [...p.pricing, { id: uid(), model: "CPM", rate: 0, label: "" }] }));

  const removePricing = (id: string) =>
    setLocal((p) => ({ ...p, pricing: p.pricing.filter((r) => r.id !== id) }));

  const updatePublisher = (id: string, patch: Partial<PublisherEntry>) =>
    setLocal((p) => ({ ...p, publishers: p.publishers.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

  const addPublisher = () =>
    setLocal((p) => ({ ...p, publishers: [...p.publishers, { id: uid(), name: "", rate: 0 }] }));

  const removePublisher = (id: string) =>
    setLocal((p) => ({ ...p, publishers: p.publishers.filter((r) => r.id !== id) }));

  const toggleDaypart = (dp: string) =>
    setLocal((p) => {
      const exists = p.daypartRates.find((d) => d.daypart === dp);
      if (exists) return { ...p, daypartRates: p.daypartRates.filter((d) => d.daypart !== dp) };
      return { ...p, daypartRates: [...p.daypartRates, { daypart: dp, rate: 0 }] };
    });

  const updateDaypartRate = (dp: string, rate: number) =>
    setLocal((p) => ({ ...p, daypartRates: p.daypartRates.map((d) => (d.daypart === dp ? { ...d, rate } : d)) }));

  const toggleOOHVertical = (v: string) =>
    setLocal((p) => {
      const verts = p.oohVerticals || [];
      return { ...p, oohVerticals: verts.includes(v) ? verts.filter((x) => x !== v) : [...verts, v] };
    });

  const toggleOOHType = (t: string) =>
    setLocal((p) => {
      const types = p.oohTypes || [];
      return { ...p, oohTypes: types.includes(t) ? types.filter((x) => x !== t) : [...types, t] };
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Configure {channel}</DialogTitle>
          <DialogDescription>Set pricing, publishers, and daypart rates for this channel.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Pricing tiers */}
          <section className="space-y-3">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Pricing</Label>
            {local.pricing.map((row) => (
              <div key={row.id} className="flex items-start gap-2">
                <Select value={row.model} onValueChange={(v) => updatePricing(row.id, { model: v })}>
                  <SelectTrigger className="w-28 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICING_MODELS.map((m) => (
                      <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Rate"
                    className="h-9 text-xs"
                    value={row.rate || ""}
                    onChange={(e) => updatePricing(row.id, { rate: parseFloat(e.target.value) || 0 })}
                  />
                  <SourceTag source={row.source} />
                </div>
                <Input
                  placeholder="Label (optional)"
                  className="w-36 h-9 text-xs"
                  value={row.label}
                  onChange={(e) => updatePricing(row.id, { label: e.target.value })}
                />
                {local.pricing.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removePricing(row.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={addPricing}>
              <Plus className="w-3.5 h-3.5" /> Add Rate
            </Button>
          </section>

          {/* Daypart pricing */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs w-full justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Daypart Pricing
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-2">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {dayparts.map((dp) => {
                  const active = local.daypartRates.some((d) => d.daypart === dp);
                  return (
                    <Badge
                      key={dp}
                      variant={active ? "default" : "outline"}
                      className="cursor-pointer text-[10px]"
                      onClick={() => toggleDaypart(dp)}
                    >
                      {dp}
                    </Badge>
                  );
                })}
              </div>
              {local.daypartRates.map((d) => (
                <div key={d.daypart} className="flex items-center gap-2">
                  <span className="text-xs w-44 truncate">{d.daypart}</span>
                  <Input
                    type="number"
                    step="0.01"
                    className="h-8 text-xs w-28"
                    placeholder="Rate"
                    value={d.rate || ""}
                    onChange={(e) => updateDaypartRate(d.daypart, parseFloat(e.target.value) || 0)}
                  />
                  <SourceTag source={d.source} />
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Publishers */}
          <section className="space-y-3">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              {isBroadcast ? "Networks" : "Publishers / Inventory"}
            </Label>
            {local.publishers.map((pub) => (
              <div key={pub.id} className="flex items-start gap-2">
                <Input
                  placeholder="Name (e.g., ESPN, NYTimes.com)"
                  className="h-9 text-xs flex-1"
                  value={pub.name}
                  onChange={(e) => updatePublisher(pub.id, { name: e.target.value })}
                />
                <div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Rate"
                    className="h-9 text-xs w-28"
                    value={pub.rate || ""}
                    onChange={(e) => updatePublisher(pub.id, { rate: parseFloat(e.target.value) || 0 })}
                  />
                  <SourceTag source={pub.source} />
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removePublisher(pub.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={addPublisher}>
              <Plus className="w-3.5 h-3.5" /> Add {isBroadcast ? "Network" : "Publisher"}
            </Button>
          </section>

          {/* OOH Verticals & Types */}
          {isOOH && (
            <section className="space-y-3">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Verticals</Label>
              <div className="flex flex-wrap gap-1.5">
                {OOH_VERTICALS.map((v) => {
                  const active = local.oohVerticals?.includes(v);
                  return (
                    <Badge
                      key={v}
                      variant={active ? "default" : "outline"}
                      className="cursor-pointer text-[10px]"
                      onClick={() => toggleOOHVertical(v)}
                    >
                      {v}
                    </Badge>
                  );
                })}
              </div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Placement Types</Label>
              <div className="flex flex-wrap gap-1.5">
                {OOH_TYPES.map((t) => {
                  const active = local.oohTypes?.includes(t);
                  return (
                    <Badge
                      key={t}
                      variant={active ? "default" : "outline"}
                      className="cursor-pointer text-[10px]"
                      onClick={() => toggleOOHType(t)}
                    >
                      {t}
                    </Badge>
                  );
                })}
              </div>
            </section>
          )}

          {/* Notes */}
          <section className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Notes / Assumptions</Label>
            <Textarea
              placeholder="Add planning notes, assumptions, or special instructions…"
              className="text-xs min-h-[60px]"
              value={local.notes}
              onChange={(e) => setLocal((p) => ({ ...p, notes: e.target.value }))}
            />
          </section>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => { onSave(channel, local); onOpenChange(false); }}>
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

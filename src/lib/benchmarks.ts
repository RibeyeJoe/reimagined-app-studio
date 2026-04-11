import type {
  Goal, Channel, ChannelMetadata, ChannelGroup,
  ChannelPreset, BudgetRule
} from "./schema";

export const CHANNEL_META: ChannelMetadata[] = [
  { channel: "Search", group: "Demand Capture", availability: "Available now", minSpendRange: { low: 500, high: 1500 }, minSpendNote: "Search works at almost any budget" },
  { channel: "Social", group: "Demand Create", availability: "Available now", minSpendRange: { low: 500, high: 1500 }, minSpendNote: "Social ads start delivering at $500/mo" },
  { channel: "Display", group: "Support", availability: "Available now", minSpendRange: { low: 500, high: 1500 }, minSpendNote: "Display retargeting effective at $500/mo" },
  { channel: "OLV", group: "Demand Create", availability: "Available now", minSpendRange: { low: 1000, high: 3000 }, minSpendNote: "Online video needs $1,000+ for meaningful reach" },
  { channel: "CTV", group: "Demand Create", availability: "Available now", minSpendRange: { low: 2500, high: 5000 }, minSpendNote: "CTV works best at $2,500-$5,000+/mo depending on geo" },
  { channel: "YouTube/YouTubeTV", group: "Demand Create", availability: "Available now", minSpendRange: { low: 1000, high: 3000 }, minSpendNote: "YouTube delivers results starting at $1,000/mo" },
  { channel: "Amazon/Prime Video/Twitch", group: "Demand Create", availability: "Requires integration", minSpendRange: { low: 2500, high: 5000 }, minSpendNote: "Amazon ecosystem requires $2,500+ and DSP access" },
  { channel: "Linear", group: "Demand Create", availability: "Sold by rep", minSpendRange: { low: 5000, high: 15000 }, minSpendNote: "Linear TV typically needs $5,000+/mo minimum buy" },
  { channel: "Radio", group: "Demand Create", availability: "Sold by rep", minSpendRange: { low: 2000, high: 5000 }, minSpendNote: "Radio spots start at $2,000/mo in most markets" },
  { channel: "Audio", group: "Demand Create", availability: "Available now", minSpendRange: { low: 1000, high: 3000 }, minSpendNote: "Streaming audio ads start at $1,000/mo" },
  { channel: "DOOH", group: "Demand Create", availability: "Available now", minSpendRange: { low: 1500, high: 4000 }, minSpendNote: "Digital out-of-home starts at $1,500/mo" },
  { channel: "OOH", group: "Demand Create", availability: "Sold by rep", minSpendRange: { low: 2000, high: 8000 }, minSpendNote: "Traditional OOH (billboards, transit) starts at $2,000/mo" },
  { channel: "Email", group: "Support", availability: "Available now", minSpendRange: { low: 200, high: 500 }, minSpendNote: "Email campaigns effective at low budgets" },
  { channel: "Netflix", group: "Demand Create", availability: "Requires integration", minSpendRange: { low: 10000, high: 25000 }, minSpendNote: "Netflix via partner requires significant investment" },
];

export function getChannelMeta(channel: Channel): ChannelMetadata | undefined {
  return CHANNEL_META.find(m => m.channel === channel);
}

export function getChannelsByGroup(group: ChannelGroup): ChannelMetadata[] {
  return CHANNEL_META.filter(m => m.group === group);
}

export function getChannelHint(channel: Channel, budget: number, hasServices: boolean): string | null {
  const meta = getChannelMeta(channel);
  if (!meta) return null;
  if (meta.availability === "Requires integration") return "Selectable for planning; activation may require integration.";
  if (meta.availability === "Sold by rep") return "Selectable for planning; activation coordinated by your rep.";
  if (budget > 0 && budget < meta.minSpendRange.low) return `Budget is below recommended minimum ($${meta.minSpendRange.low.toLocaleString()}+). Still selectable for planning.`;
  if (channel === "Search" && !hasServices) return "Adding keywords/services will improve targeting.";
  return null;
}

export const CHANNEL_PRESETS: ChannelPreset[] = [
  {
    id: "local-lead-gen", name: "Local Lead Gen",
    description: "Maximize qualified leads from search and social",
    channels: { Search: 30, Social: 20, Display: 10, Email: 10, "YouTube/YouTubeTV": 10, Radio: 5, Linear: 5, Audio: 5, CTV: 5 },
    rationale: "Prioritizes high-intent search and social channels that drive the most qualified leads for local businesses.",
  },
  {
    id: "foot-traffic", name: "Foot Traffic",
    description: "Drive store visits and local foot traffic",
    channels: { Social: 15, Search: 15, DOOH: 10, OOH: 10, Radio: 10, CTV: 10, Display: 10, Linear: 5, Audio: 5, "Amazon/Prime Video/Twitch": 5, OLV: 5 },
    rationale: "Combines proximity-targeted social, DOOH, OOH, radio, and local media to drive physical visits.",
  },
  {
    id: "brand-demand", name: "Brand + Demand",
    description: "Build brand awareness while capturing demand",
    channels: { CTV: 12, Linear: 8, "YouTube/YouTubeTV": 10, Social: 10, Search: 15, Display: 10, OLV: 5, Audio: 5, Radio: 8, OOH: 5, DOOH: 5, "Amazon/Prime Video/Twitch": 4, Email: 3 },
    rationale: "Balances upper-funnel brand building with lower-funnel performance channels.",
  },
  {
    id: "conquest", name: "Conquest",
    description: "Win market share from competitors",
    channels: { Search: 20, Social: 15, Display: 10, OLV: 10, CTV: 10, "YouTube/YouTubeTV": 10, "Amazon/Prime Video/Twitch": 5, Linear: 5, Radio: 5, Audio: 5, OOH: 3, DOOH: 2 },
    rationale: "Aggressive competitive targeting across search and social, supported by traditional media.",
  },
  {
    id: "ooh-dominant", name: "OOH Dominant",
    description: "Heavy out-of-home with digital support",
    channels: { OOH: 25, DOOH: 20, Social: 15, Search: 10, Display: 10, Radio: 5, CTV: 5, Audio: 5, Email: 5 },
    rationale: "Maximizes physical presence with billboards, transit, and digital screens.",
  },
];

export const DEFAULT_CHANNEL_MIX: Record<string, Record<string, number>> = {
  Awareness: { CTV: 18, Social: 12, Display: 12, OLV: 10, "YouTube/YouTubeTV": 10, Linear: 8, Radio: 5, Audio: 5, DOOH: 5, OOH: 5, Search: 5, Email: 3, Netflix: 2 },
  Consideration: { Social: 18, Search: 15, "YouTube/YouTubeTV": 12, Display: 10, OLV: 10, CTV: 8, Email: 5, Audio: 5, DOOH: 5, OOH: 4, Radio: 4, Linear: 2, Netflix: 2 },
  Leads: { Search: 28, Social: 18, Display: 10, Email: 10, "YouTube/YouTubeTV": 10, CTV: 5, OLV: 5, Radio: 5, Audio: 4, DOOH: 3, OOH: 2 },
  "Foot Traffic": { Social: 12, Search: 12, DOOH: 12, OOH: 12, Radio: 12, CTV: 8, Display: 8, Linear: 5, Audio: 5, "Amazon/Prime Video/Twitch": 5, OLV: 5, Email: 4 },
  Conquest: { Search: 18, Social: 14, Display: 10, OLV: 10, CTV: 8, "YouTube/YouTubeTV": 8, "Amazon/Prime Video/Twitch": 5, Linear: 5, Radio: 8, Audio: 5, OOH: 5, DOOH: 4 },
};

export const GOAL_KPI_MAP: Record<string, string[]> = {
  Awareness: ["Impressions", "Reach", "Frequency", "CPM", "Brand Lift", "Share of Voice"],
  Consideration: ["Clicks", "CTR", "CPC", "Video Views", "Engagement Rate", "Site Visits"],
  Leads: ["Conversions", "CPL", "Form Fills", "Phone Calls", "Cost per Acquisition", "Lead Quality Score"],
  "Foot Traffic": ["Store Visits", "Cost per Visit", "Walk-in Rate", "Direction Requests", "Check-ins"],
  Conquest: ["Market Share", "Competitive SOV", "New Customer Acquisition", "Brand Switch Rate", "Conquest Leads"],
};

export const BUDGET_RULES: BudgetRule[] = [
  { condition: "DMA with low budget", geoType: "DMA", minBudget: 3000, message: "DMA-wide coverage typically needs $3,000+/mo." },
  { condition: "Large radius with low budget", geoType: "Radius", minBudget: 2000, radiusMin: 25, message: "A 25+ mile radius with this budget may spread spend too thin." },
  { condition: "Congressional District with low budget", geoType: "Congressional District", minBudget: 2500, message: "Congressional district targeting typically needs $2,500+/mo." },
];

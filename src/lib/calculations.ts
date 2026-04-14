/**
 * Ribeye Omni Planner – Core Calculation Engine
 *
 * Reach curve model:  R = rMax × (1 − e^(−w / λ))
 *   w = media weight in k-impressions: budget ÷ CPM
 *
 * Sources: Nielsen NTI, Nielsen Audio, Meta R&F API, Google Reach Planner,
 *          comScore, MRI-Simmons Gold Survey 2024, Lumen Research 2023,
 *          Kantar Amplified Intelligence 2024.
 *
 * Channel keys match the app's Channel type from schema.ts.
 */

import type { Channel, ChannelAllocation, ShareOfVoice } from "./schema";

// ─── Reach curve parameters per channel ──────────────────────────────────────
interface ReachParam {
  rMax: number;
  lambda: number | null; // null = list/circulation-based
}

export const REACH_PARAMS: Record<string, ReachParam> = {
  Linear:                     { rMax: 0.85, lambda: 110 },
  Radio:                      { rMax: 0.75, lambda: 200 },
  Search:                     { rMax: 0.72, lambda: 90  },
  Social:                     { rMax: 0.82, lambda: 88  },
  Display:                    { rMax: 0.70, lambda: 95  },
  OLV:                        { rMax: 0.75, lambda: 90  },
  CTV:                        { rMax: 0.62, lambda: 72  },
  "YouTube/YouTubeTV":        { rMax: 0.70, lambda: 80  },
  "Amazon/Prime Video/Twitch":{ rMax: 0.55, lambda: 70  },
  Audio:                      { rMax: 0.65, lambda: 180 },
  Email:                      { rMax: 0.95, lambda: null },
  DOOH:                       { rMax: 0.68, lambda: 85  },
  OOH:                        { rMax: 0.78, lambda: 95  },
  Netflix:                    { rMax: 0.58, lambda: 68  },
};

// ─── Default CPMs ────────────────────────────────────────────────────────────
export const DEFAULT_CPMS: Record<string, number> = {
  Linear: 4.85, Radio: 3.20, Search: 12.00, Social: 9.50,
  Display: 5.50, OLV: 14.00, CTV: 26.00,
  "YouTube/YouTubeTV": 20.00, "Amazon/Prime Video/Twitch": 25.00,
  Audio: 10.00, Email: 0.50, DOOH: 15.00, OOH: 5.00,
  Netflix: 35.00,
};

// ─── Attention weights (impression quality vs Linear TV = 1.00) ──────────────
export const ATTENTION_WEIGHTS: Record<string, number> = {
  Linear: 1.00, Radio: 0.55, Search: 1.45, Social: 0.65,
  Display: 0.42, OLV: 0.72, CTV: 1.08,
  "YouTube/YouTubeTV": 0.80, "Amazon/Prime Video/Twitch": 0.75,
  Audio: 0.58, Email: 1.85, DOOH: 0.60, OOH: 0.48,
  Netflix: 1.05,
};

// Average cross-channel audience correlation (A25-54, MRI-Simmons 2024)
const RHO_BAR = 0.38;

// Universe estimates by demo (000s) — Nielsen Universe Estimates 2024
export const UNIVERSE: Record<string, number> = {
  "Adults 18-34": 72000, "Adults 18-49": 135000, "Adults 25-54": 98000,
  "Adults 35-64": 88000, "Adults 55+": 65000, "Women 18-49": 67000, "Men 18-49": 68000,
};

// ─── Geo universe lookup (Adults 25-54, 000s) ────────────────────────────────
// Source: Nielsen DMA Audience Estimates 2024
export const GEO_UNIVERSE: Record<string, number> = {
  "National": 98000,
  "New York": 4820, "Los Angeles": 3610, "Chicago": 2140,
  "Philadelphia": 1580, "Dallas-Ft. Worth": 1920,
  "San Francisco-Oakland": 1410, "Washington DC (Hagerstown)": 1680,
  "Houston": 1730, "Atlanta": 1640, "Boston (Manchester)": 1290,
  "Seattle-Tacoma": 1080, "Phoenix (Prescott)": 1480,
  "Tampa-St. Pete": 1010, "Minneapolis-St. Paul": 940,
  "Miami-Ft. Lauderdale": 1120, "Denver": 870,
  "Orlando-Daytona Beach": 920, "Cleveland-Akron": 790,
  "Sacramento-Stockton": 790, "St. Louis": 730,
  "Portland, OR": 710, "Baltimore": 740, "San Diego": 710,
  "Indianapolis": 650, "Charlotte": 760, "Nashville": 660,
  "Hartford-New Haven": 600, "Kansas City": 630,
  "Columbus, OH": 590, "San Antonio": 680,
  "Salt Lake City": 580, "Austin": 680, "Cincinnati": 580,
  "Milwaukee": 510, "Las Vegas": 580,
  "West Palm Beach-Ft. Pierce": 510, "Grand Rapids-Kalamazoo": 480,
  "Birmingham (Ann-Tusc)": 460, "Oklahoma City": 470,
};

export function geoUniverse(geoSelection?: string | string[] | null): number {
  if (!geoSelection || geoSelection === "National") return GEO_UNIVERSE["National"];
  if (Array.isArray(geoSelection)) {
    return geoSelection.reduce((sum, dma) => sum + (GEO_UNIVERSE[dma] || 300), 0);
  }
  return GEO_UNIVERSE[geoSelection] || 300;
}

// ─── Audience segment penetration (fraction of Adults 25-54) ─────────────────
// Source: MRI-Simmons Gold Survey 2024
export const AUDIENCE_SEGMENTS: Record<string, { fraction: number }> = {
  "All Adults":              { fraction: 1.000 },
  "Auto Intenders":          { fraction: 0.121 },
  "Luxury Auto":             { fraction: 0.041 },
  "Truck/SUV Buyers":        { fraction: 0.068 },
  "In-Market: Mortgage":     { fraction: 0.052 },
  "In-Market: Credit Card":  { fraction: 0.148 },
  "High HHI ($150k+)":       { fraction: 0.187 },
  "Dog Owners":              { fraction: 0.381 },
  "Cat Owners":              { fraction: 0.259 },
  "Pet Owners (any)":        { fraction: 0.481 },
  "Health-Conscious":        { fraction: 0.312 },
  "Organic Buyers":          { fraction: 0.228 },
  "QSR Visitors (wkly)":     { fraction: 0.441 },
  "Pizza Buyers":            { fraction: 0.389 },
  "Homeowners":              { fraction: 0.612 },
  "Home Improvement":        { fraction: 0.241 },
  "Frequent Travelers":      { fraction: 0.198 },
  "In-Market: Travel":       { fraction: 0.163 },
  "Parents (HH w/ kids)":    { fraction: 0.318 },
  "New Parents":             { fraction: 0.048 },
  "College Students":        { fraction: 0.091 },
  "Democrats":               { fraction: 0.312 },
  "Republicans":             { fraction: 0.289 },
  "Independent Voters":      { fraction: 0.289 },
  "Hispanic/Latino":         { fraction: 0.192 },
  "African American":        { fraction: 0.128 },
  "Asian American":          { fraction: 0.062 },
};

export function audienceFraction(segmentName?: string | null): number {
  if (!segmentName || segmentName === "All Adults") return 1.0;
  return (AUDIENCE_SEGMENTS[segmentName] || { fraction: 1.0 }).fraction;
}

/**
 * Returns the in-scope universe in thousands.
 * Chains geo reduction THEN audience reduction.
 * National (98M) → Denver (870k) → Denver Auto Intenders (105k)
 */
export function getUniverse(geo: string | string[] | null = "National", audience: string | null = "All Adults"): number {
  const geoSize = geoUniverse(geo);
  const segFrac = audienceFraction(audience);
  return Math.max(Math.round(geoSize * segFrac), 1);
}

// ─── 1. Per-channel reach from budget ────────────────────────────────────────
export function channelReach(channelName: string, budget: number): number {
  const params = REACH_PARAMS[channelName];
  if (!params) return 0;
  if (!params.lambda) return params.rMax; // Email/Print: list-based placeholder
  const cpm = DEFAULT_CPMS[channelName] || 15;
  const w = budget / cpm; // media weight in k-imps
  return Math.min(params.rMax * (1 - Math.exp(-w / params.lambda)), params.rMax);
}

// ─── 2. Cross-channel deduplicated reach ─────────────────────────────────────
export function deduplicatedReach(channelReaches: number[]): number {
  const active = channelReaches.filter(r => r > 0);
  const n = active.length;
  if (n === 0) return 0;
  if (n === 1) return active[0];

  // Independence model: assumes no audience overlap
  let independenceReach = 1;
  for (const r of active) independenceReach *= (1 - r);
  independenceReach = 1 - independenceReach;

  // Perfect correlation model: reach = max of any single channel
  const maxReach = Math.max(...active);

  // Blend using average cross-channel correlation (RHO_BAR)
  // At rho=0 → independence (highest reach), at rho=1 → max single channel
  const blended = independenceReach * (1 - RHO_BAR) + maxReach * RHO_BAR;

  return Math.min(Math.max(blended, 0), 0.95);
}

// ─── 3. Confidence interval on deduplicated reach ────────────────────────────
export interface ReachCI { low: number; mid: number; high: number }

export function reachCI(deduplicatedReachFraction: number): ReachCI {
  return {
    low:  +(deduplicatedReachFraction * 0.88 * 100).toFixed(1),
    mid:  +(deduplicatedReachFraction * 100).toFixed(1),
    high: +(Math.min(deduplicatedReachFraction * 1.12, 0.97) * 100).toFixed(1),
  };
}

// ─── 4. Effective reach at frequency threshold k ─────────────────────────────
export function effectiveReach(totalReach: number, k: number): number {
  const multipliers: Record<number, number> = { 1: 1.00, 2: 0.77, 3: 0.55, 4: 0.32, 5: 0.19, 6: 0.08, 7: 0.02 };
  return totalReach * (multipliers[k] ?? 0.01);
}

// ─── 5. Average frequency ────────────────────────────────────────────────────
export function avgFrequency(totalGrossImpressions: number, deduplicatedReachFraction: number, universeSize_thousands: number): number {
  const reachedPersons = deduplicatedReachFraction * universeSize_thousands * 1000;
  return reachedPersons > 0 ? totalGrossImpressions / reachedPersons : 0;
}

// ─── 6. Share of voice by channel ────────────────────────────────────────────
export function shareOfVoice(channels: Array<{ name: string; budget: number }>): Array<{ name: string; sov: number; awi: number }> {
  const awiByChannel = channels.map(ch => {
    const cpm = DEFAULT_CPMS[ch.name] || 15;
    const impressions = (ch.budget / cpm) * 1000;
    return { name: ch.name, awi: impressions * (ATTENTION_WEIGHTS[ch.name] || 0.5) };
  });
  const totalAWI = awiByChannel.reduce((s, c) => s + c.awi, 0);
  return awiByChannel.map(c => ({
    name: c.name,
    sov: totalAWI > 0 ? +(c.awi / totalAWI * 100).toFixed(1) : 0,
    awi: c.awi,
  }));
}

// ─── 7. Reach curve data for chart (single channel) ─────────────────────────
export function reachCurveData(channelName: string, currentBudget: number, points = 40): Array<{ budget: number; reach: number }> {
  const maxBudget = Math.max(currentBudget * 2, 1000);
  return Array.from({ length: points + 1 }, (_, i) => {
    const budget = (maxBudget / points) * i;
    return { budget, reach: +(channelReach(channelName, budget) * 100).toFixed(2) };
  });
}

// ─── 8. Holistic reach curve data ────────────────────────────────────────────
export function holisticReachCurveData(channels: Array<{ name: string; budget: number }>, points = 40): Array<{ budget: number; reach: number }> {
  const totalBudget = channels.reduce((s, c) => s + c.budget, 0);
  if (totalBudget === 0) return [{ budget: 0, reach: 0 }];
  const shares = channels.map(c => ({ name: c.name, share: c.budget / totalBudget }));
  const maxBudget = totalBudget * 2;

  return Array.from({ length: points + 1 }, (_, i) => {
    const budget = (maxBudget / points) * i;
    const reaches = shares.map(ch => channelReach(ch.name, budget * ch.share));
    return { budget, reach: +(deduplicatedReach(reaches) * 100).toFixed(2) };
  });
}

// ─── 9. Per-channel metrics from allocation ──────────────────────────────────
export interface ChannelMetrics {
  impressions: number;
  reach: number;    // absolute count using universe
  reachPct: number; // 0-100 fraction of universe
  frequency: number;
  cpm: number;
  attentionWeight: number;
  awi: number;
}

export function channelMetrics(channelName: string, budget: number, universeThousands: number, customCpm?: number): ChannelMetrics {
  const cpm = customCpm ?? DEFAULT_CPMS[channelName] ?? 15;
  const impressions = Math.round((budget / cpm) * 1000);
  const reachFraction = channelReach(channelName, budget);
  // Cap reach count: you can't reach more unique people than you have impressions
  const modelReachCount = Math.round(reachFraction * universeThousands * 1000);
  const reachCount = Math.min(modelReachCount, impressions);
  const actualReachPct = reachCount / (universeThousands * 1000);
  const freq = reachCount > 0 ? +(impressions / reachCount).toFixed(1) : 0;
  const aw = ATTENTION_WEIGHTS[channelName] || 0.5;
  return {
    impressions,
    reach: reachCount,
    reachPct: +(actualReachPct * 100).toFixed(2),
    frequency: freq,
    cpm,
    attentionWeight: aw,
    awi: Math.round(impressions * aw),
  };
}

// ─── 10. Full plan output ────────────────────────────────────────────────────
export interface PlanCalculation {
  totalDedupReachPct: number;
  reachCI: ReachCI;
  effectiveReach2plus: number;
  effectiveReach3plus: number;
  avgFrequency: number;
  totalImpressions: number;
  totalReach: number; // absolute deduplicated reach count
  totalAWI: number;
  naiveSumReachPct: number;
  shareOfVoice: Array<{ name: string; sov: number; awi: number }>;
  channels: Array<{ name: string; budget: number; metrics: ChannelMetrics }>;
  universe: number;
  universeLabel: string;
  totalDedupReachPersons: number;
}

export function calculatePlan(
  allocations: ChannelAllocation[],
  targetDemo = "Adults 25-54",
  geo: string | string[] | null = "National",
  audience: string | null = "All Adults",
  customCpms?: Record<string, number>,
): PlanCalculation {
  const universe = getUniverse(geo, audience);
  const enabled = allocations.filter(a => a.enabled && a.budget > 0);

  const channelOutputs = enabled.map(ch => ({
    name: ch.channel,
    budget: ch.budget,
    metrics: channelMetrics(ch.channel, ch.budget, universe, customCpms?.[ch.channel]),
  }));

  const reaches = channelOutputs.map(c => c.metrics.reachPct / 100);
  const dedupReach = deduplicatedReach(reaches);
  const totalImpressions = channelOutputs.reduce((s, c) => s + c.metrics.impressions, 0);
  const totalAWI = channelOutputs.reduce((s, c) => s + c.metrics.awi, 0);
  const totalReachCount = Math.min(Math.round(dedupReach * universe * 1000), totalImpressions);
  // Actual dedup reach fraction based on capped count
  const actualDedupFraction = totalReachCount / (universe * 1000);
  const ci = reachCI(actualDedupFraction);

  const sovInput = channelOutputs.map(c => ({ name: c.name, budget: c.budget }));

  const geoLabel = (() => {
    if (!geo || geo === "National") return "U.S.";
    if (Array.isArray(geo)) {
      if (geo.length <= 3) return geo.join(", ");
      // Detect if entries look like ZIP codes (all digits, 5 chars)
      const areZips = geo.every(g => /^\d{5}$/.test(g));
      return areZips ? `${geo.length} ZIP codes` : `${geo.length} DMAs`;
    }
    // Single string that may contain semicolons/commas
    const parts = geo.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    if (parts.length <= 3) return parts.join(", ");
    const areZips = parts.every(g => /^\d{5}$/.test(g));
    return areZips ? `${parts.length} ZIP codes` : `${parts.length} DMAs`;
  })();
  const audienceLabel = !audience || audience === "All Adults" ? targetDemo : audience;

  return {
    totalDedupReachPct: ci.mid,
    reachCI: ci,
    effectiveReach2plus: +(effectiveReach(actualDedupFraction, 2) * 100).toFixed(1),
    effectiveReach3plus: +(effectiveReach(actualDedupFraction, 3) * 100).toFixed(1),
    avgFrequency: totalReachCount > 0 ? +(totalImpressions / totalReachCount).toFixed(1) : 0,
    totalImpressions: Math.round(totalImpressions),
    totalReach: totalReachCount,
    totalAWI: Math.round(totalAWI),
    naiveSumReachPct: +(reaches.reduce((a, b) => a + b, 0) * 100).toFixed(1),
    shareOfVoice: shareOfVoice(sovInput),
    channels: channelOutputs,
    universe,
    universeLabel: `${universe.toLocaleString()}k ${audienceLabel} in ${geoLabel}`,
    totalDedupReachPersons: totalReachCount,
  };
}

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

import type { Channel, ChannelAllocation, ShareOfVoice, Daypart } from "./schema";

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
  Email:                      { rMax: 0.95, lambda: 45 },
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
// Women ≈ 51%, Men ≈ 49% of each age band.
export const UNIVERSE: Record<string, number> = {
  "Adults 18+": 210000, "Adults 18-34": 72000, "Adults 18-49": 135000,
  "Adults 25-54": 98000, "Adults 35-64": 88000, "Adults 55+": 65000, "Adults 65+": 42000,
  "Women 18+": 107100, "Women 18-34": 36720, "Women 18-49": 68850,
  "Women 25-54": 49980, "Women 35-64": 44880, "Women 55+": 33150, "Women 65+": 21420,
  "Men 18+": 102900, "Men 18-34": 35280, "Men 18-49": 66150,
  "Men 25-54": 48020, "Men 35-64": 43120, "Men 55+": 31850, "Men 65+": 20580,
};

// Demo population as a fraction of A25-54 (used to scale geo universe by selected demo)
const A2554 = 98000;
const DEMO_TO_A2554_RATIO: Record<string, number> = Object.fromEntries(
  Object.entries(UNIVERSE).map(([k, v]) => [k, v / A2554])
);

export function demoScale(demo?: string | null): number {
  if (!demo) return 1.0;
  return DEMO_TO_A2554_RATIO[demo] ?? 1.0;
}

// ─── Geo universe lookup (Adults 25-54, 000s) ────────────────────────────────
// Source: Nielsen DMA Audience Estimates 2024. Top markets exact; remainder estimated.
export const GEO_UNIVERSE: Record<string, number> = {
  "National": 98000,
  // Top 50 markets (verified)
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
  // Additional 200K+ markets
  "Pittsburgh": 540, "Raleigh-Durham": 560, "Greenville-Spartanburg-Asheville": 510,
  "Jacksonville": 480, "Memphis": 430, "Louisville": 430,
  "Buffalo": 380, "New Orleans": 420, "Providence-New Bedford": 390,
  "Wilkes Barre-Scranton": 320, "Fresno-Visalia": 410,
  "Albuquerque-Santa Fe": 380, "Albany-Schenectady-Troy": 320,
  "Little Rock-Pine Bluff": 290, "Richmond-Petersburg": 380,
  "Mobile-Pensacola": 360, "Tulsa": 370, "Knoxville": 340,
  "Lexington": 280, "Dayton": 300, "Charleston-Huntington": 270,
  "Wichita-Hutchinson": 280, "Roanoke-Lynchburg": 280,
  "Flint-Saginaw-Bay City": 260, "Green Bay-Appleton": 270,
  "Tucson (Sierra Vista)": 320, "Honolulu": 300, "Des Moines-Ames": 290,
  "Omaha": 320, "Spokane": 270, "Toledo": 250,
  "Portland-Auburn, ME": 280, "Springfield, MO": 260,
  "Madison": 260, "Syracuse": 280, "Columbia, SC": 290,
  "Huntsville-Decatur (Florence)": 270, "Chattanooga": 240,
  "Shreveport": 220, "Burlington-Plattsburgh": 220, "South Bend-Elkhart": 220,
  "El Paso (Las Cruces)": 280, "Jackson, MS": 230,
  "Savannah": 220, "Greensboro-High Point-Winston-Salem": 460,
  "Harrisburg-Lancaster-Lebanon-York": 430,
  "Norfolk-Portsmouth-Newport News": 480,
  "Greenville-New Bern-Washington": 240,
  "Charleston, SC": 250, "Boise": 260, "Reno": 220,
  "Fort Myers-Naples": 320, "Champaign-Springfield-Decatur": 220,
  "Lincoln-Hastings-Kearney": 200, "Davenport-Rock Island-Moline": 220,
  "Cedar Rapids-Waterloo-Iowa City-Dubuque": 240, "Lansing": 220,
  "Colorado Springs-Pueblo": 250, "Sioux Falls (Mitchell)": 200,
  "Eugene": 200, "Baton Rouge": 280, "Lafayette, LA": 220,
};

// Common DMA aliases / abbreviations → canonical key
const DMA_ALIASES: Record<string, string> = {
  "dc": "Washington DC (Hagerstown)",
  "washington": "Washington DC (Hagerstown)",
  "washington dc": "Washington DC (Hagerstown)",
  "sf": "San Francisco-Oakland",
  "bay area": "San Francisco-Oakland",
  "san francisco": "San Francisco-Oakland",
  "dfw": "Dallas-Ft. Worth",
  "dallas": "Dallas-Ft. Worth",
  "msp": "Minneapolis-St. Paul",
  "twin cities": "Minneapolis-St. Paul",
  "minneapolis": "Minneapolis-St. Paul",
  "west palm": "West Palm Beach-Ft. Pierce",
  "west palm beach": "West Palm Beach-Ft. Pierce",
  "nyc": "New York",
  "ny": "New York",
  "la": "Los Angeles",
  "chi": "Chicago",
  "philly": "Philadelphia",
  "atl": "Atlanta",
  "boston": "Boston (Manchester)",
  "phoenix": "Phoenix (Prescott)",
  "tampa": "Tampa-St. Pete",
  "miami": "Miami-Ft. Lauderdale",
  "orlando": "Orlando-Daytona Beach",
  "cleveland": "Cleveland-Akron",
  "sacramento": "Sacramento-Stockton",
  "stockton": "Sacramento-Stockton",
  "portland": "Portland, OR",
  "raleigh": "Raleigh-Durham",
  "durham": "Raleigh-Durham",
  "winston-salem": "Greensboro-High Point-Winston-Salem",
  "greensboro": "Greensboro-High Point-Winston-Salem",
  "norfolk": "Norfolk-Portsmouth-Newport News",
  "virginia beach": "Norfolk-Portsmouth-Newport News",
  "el paso": "El Paso (Las Cruces)",
  "honolulu": "Honolulu",
  "tucson": "Tucson (Sierra Vista)",
  "providence": "Providence-New Bedford",
  "scranton": "Wilkes Barre-Scranton",
  "fresno": "Fresno-Visalia",
  "albuquerque": "Albuquerque-Santa Fe",
  "richmond": "Richmond-Petersburg",
  "harrisburg": "Harrisburg-Lancaster-Lebanon-York",
  "lancaster": "Harrisburg-Lancaster-Lebanon-York",
  "york": "Harrisburg-Lancaster-Lebanon-York",
  "ft myers": "Fort Myers-Naples",
  "fort myers": "Fort Myers-Naples",
  "naples": "Fort Myers-Naples",
};

const STATE_ABBR_RE =
  /,?\s*\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b\.?/gi;

const STATE_NAMES_RE =
  /,\s*(?:alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming|district of columbia)\b/gi;

function normalizeDMA(s: string): string {
  return s
    .toLowerCase()
    .replace(STATE_ABBR_RE, "")
    .replace(STATE_NAMES_RE, "")
    .replace(/\bdma\b/gi, "")
    .replace(/\bmarket\b/gi, "")
    .replace(/[.()/]/g, " ")
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolve a user-entered DMA string to a GEO_UNIVERSE population (in 000s).
 * Order: exact key → alias → fuzzy substring (highest pop wins) → 300 fallback.
 */
export interface DMAResult {
  population: number;
  matched: boolean;
  matchedKey: string | null;
}

export function resolveDMA(input: string): DMAResult {
  if (!input) return { population: 300, matched: false, matchedKey: null };

  // Exact match
  if (GEO_UNIVERSE[input] != null) {
    return { population: GEO_UNIVERSE[input], matched: true, matchedKey: input };
  }

  const norm = normalizeDMA(input);
  if (!norm) return { population: 300, matched: false, matchedKey: null };

  // Alias hit (exact normalized)
  if (DMA_ALIASES[norm] && GEO_UNIVERSE[DMA_ALIASES[norm]] != null) {
    return { population: GEO_UNIVERSE[DMA_ALIASES[norm]], matched: true, matchedKey: DMA_ALIASES[norm] };
  }

  // Substring fuzzy match against all keys; pick the highest-population match
  let bestPop = 0;
  let bestKey: string | null = null;
  for (const [key, pop] of Object.entries(GEO_UNIVERSE)) {
    if (key === "National") continue;
    const normKey = normalizeDMA(key);
    if (normKey === norm || normKey.includes(norm) || norm.includes(normKey)) {
      if (pop > bestPop) { bestPop = pop; bestKey = key; }
    }
  }
  if (bestPop > 0) return { population: bestPop, matched: true, matchedKey: bestKey };

  // Token-overlap fallback: any alias whose key contains the input as a token
  for (const [aliasKey, canonical] of Object.entries(DMA_ALIASES)) {
    if (norm.includes(aliasKey) || aliasKey.includes(norm)) {
      const pop = GEO_UNIVERSE[canonical];
      if (pop && pop > bestPop) { bestPop = pop; bestKey = canonical; }
    }
  }
  if (bestPop > 0) return { population: bestPop, matched: true, matchedKey: bestKey };
  return { population: 300, matched: false, matchedKey: null };
}

export function geoUniverse(geoSelection?: string | string[] | null): { total: number; unmatched: string[] } {
  if (!geoSelection || geoSelection === "National") {
    return { total: GEO_UNIVERSE["National"], unmatched: [] };
  }
  const entries = Array.isArray(geoSelection) ? geoSelection : [geoSelection];
  let total = 0;
  const unmatched: string[] = [];
  for (const entry of entries) {
    const result = resolveDMA(entry);
    total += result.population;
    if (!result.matched) unmatched.push(entry);
  }
  return { total, unmatched };
}

export function getUnmatchedDMAs(geo: string | string[] | null): string[] {
  if (!geo) return [];
  return geoUniverse(geo).unmatched;
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
  "General Market":          { fraction: 1.000 },
};

export function audienceFraction(segmentName?: string | null): number {
  if (!segmentName || segmentName === "All Adults" || segmentName === "General Market") return 1.0;
  return (AUDIENCE_SEGMENTS[segmentName] || { fraction: 1.0 }).fraction;
}

/**
 * Returns the in-scope universe in thousands.
 * Chains geo reduction → demo scale → audience reduction → ethnic overlay.
 */
export function getUniverse(
  geo: string | string[] | null = "National",
  audience: string | null = "All Adults",
  demo: string = "Adults 25-54",
  ethnicOverlay: string | null = null,
): number {
  const geoSize = geoUniverse(geo).total;
  const dScale = demoScale(demo);
  const segFrac = audienceFraction(audience);
  const ethFrac = audienceFraction(ethnicOverlay);
  return Math.max(Math.round(geoSize * dScale * segFrac * ethFrac), 1);
}

// ─── 1. Per-channel reach from budget ────────────────────────────────────────
export function channelReach(channelName: string, budget: number): number {
  const params = REACH_PARAMS[channelName];
  if (!params) return 0;
  if (!params.lambda) return 0; // No lambda = no reach model available
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

  let independenceReach = 1;
  for (const r of active) independenceReach *= (1 - r);
  independenceReach = 1 - independenceReach;

  const maxReach = Math.max(...active);
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

// ─── Daypart-aware impression calculation ────────────────────────────────────
/**
 * For Linear/Radio with a daypart split, compute a weighted-average effective CPM:
 *   effCPM = budget / sum(budget_dp / cpm_dp)
 * This drives both impressions and the Source-of-truth CPM shown in the breakdown.
 *
 * `daypartBudgetSplit` is { daypart -> percentage 0-100 }.
 * `daypartRates` is { daypart -> CPM }. Falls back to flat CPM if no usable splits.
 */
export interface DaypartLine {
  daypart: string;
  pct: number;
  budget: number;
  cpm: number;
  impressions: number;
}

export function computeDaypartLines(
  totalBudget: number,
  daypartBudgetSplit: Record<string, number> | undefined,
  daypartRates: Record<string, number> | undefined,
  fallbackCpm: number,
): DaypartLine[] {
  if (!daypartBudgetSplit || !daypartRates) return [];
  const entries = Object.entries(daypartBudgetSplit).filter(([, pct]) => pct > 0);
  if (entries.length === 0) return [];
  const totalPct = entries.reduce((s, [, p]) => s + p, 0);
  if (totalPct <= 0) return [];
  return entries.map(([dp, pct]) => {
    const normPct = (pct / totalPct) * 100;
    const budget = (totalBudget * pct) / totalPct;
    const cpm = daypartRates[dp] && daypartRates[dp] > 0 ? daypartRates[dp] : fallbackCpm;
    const impressions = Math.round((budget / cpm) * 1000);
    return { daypart: dp, pct: +normPct.toFixed(1), budget: Math.round(budget), cpm, impressions };
  });
}

export function effectiveCpmFromDayparts(lines: DaypartLine[], fallback: number): number {
  if (lines.length === 0) return fallback;
  const totalBudget = lines.reduce((s, l) => s + l.budget, 0);
  const totalImps = lines.reduce((s, l) => s + l.impressions, 0);
  if (totalImps === 0) return fallback;
  return +((totalBudget / totalImps) * 1000).toFixed(2);
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
  daypartLines?: DaypartLine[];
}

export function channelMetrics(
  channelName: string,
  budget: number,
  universeThousands: number,
  customCpm?: number,
  daypartBudgetSplit?: Record<string, number>,
  daypartRates?: Record<string, number>,
): ChannelMetrics {
  const flatCpm = customCpm ?? DEFAULT_CPMS[channelName] ?? 15;

  // Daypart-aware impression model (only if both splits + rates are provided)
  const daypartLines = computeDaypartLines(budget, daypartBudgetSplit, daypartRates, flatCpm);
  const effCpm = effectiveCpmFromDayparts(daypartLines, flatCpm);

  const impressions =
    daypartLines.length > 0
      ? daypartLines.reduce((s, l) => s + l.impressions, 0)
      : Math.round((budget / flatCpm) * 1000);

  const reachFraction = channelReach(channelName, budget);
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
    cpm: effCpm,
    attentionWeight: aw,
    awi: Math.round(impressions * aw),
    daypartLines: daypartLines.length > 0 ? daypartLines : undefined,
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
  totalReach: number;
  totalAWI: number;
  naiveSumReachPct: number;
  shareOfVoice: Array<{ name: string; sov: number; awi: number }>;
  channels: Array<{ name: string; budget: number; metrics: ChannelMetrics }>;
  universe: number;
  universeLabel: string;
  totalDedupReachPersons: number;
}

export interface CalcOptions {
  customCpms?: Record<string, number>;
  daypartBudgetSplits?: Record<string, Record<string, number>>; // channel -> daypart -> pct
  daypartRates?: Record<string, Record<string, number>>;        // channel -> daypart -> cpm
  ethnicOverlay?: string | null;
}

export function calculatePlan(
  allocations: ChannelAllocation[],
  targetDemo = "Adults 25-54",
  geo: string | string[] | null = "National",
  audience: string | null = "All Adults",
  customCpmsOrOptions?: Record<string, number> | CalcOptions,
): PlanCalculation {
  // Backward compat: the 5th arg used to be a plain customCpms record.
  const opts: CalcOptions =
    customCpmsOrOptions && typeof customCpmsOrOptions === "object" &&
    ("daypartBudgetSplits" in customCpmsOrOptions ||
      "daypartRates" in customCpmsOrOptions ||
      "customCpms" in customCpmsOrOptions ||
      "ethnicOverlay" in customCpmsOrOptions)
      ? (customCpmsOrOptions as CalcOptions)
      : { customCpms: customCpmsOrOptions as Record<string, number> | undefined };

  const universe = getUniverse(geo, audience, targetDemo, opts.ethnicOverlay ?? null);
  const enabled = allocations.filter(a => a.enabled && a.budget > 0);

  const channelOutputs = enabled.map(ch => ({
    name: ch.channel,
    budget: ch.budget,
    metrics: channelMetrics(
      ch.channel,
      ch.budget,
      universe,
      opts.customCpms?.[ch.channel],
      opts.daypartBudgetSplits?.[ch.channel],
      opts.daypartRates?.[ch.channel],
    ),
  }));

  const reaches = channelOutputs.map(c => c.metrics.reachPct / 100);
  const dedupReach = deduplicatedReach(reaches);
  const totalImpressions = channelOutputs.reduce((s, c) => s + c.metrics.impressions, 0);
  const totalAWI = channelOutputs.reduce((s, c) => s + c.metrics.awi, 0);
  const totalReachCount = Math.min(Math.round(dedupReach * universe * 1000), totalImpressions);
  const actualDedupFraction = totalReachCount / (universe * 1000);
  const ci = reachCI(actualDedupFraction);

  const sovInput = channelOutputs.map(c => ({ name: c.name, budget: c.budget }));

  const geoLabel = (() => {
    if (!geo || geo === "National") return "U.S.";
    if (Array.isArray(geo)) {
      if (geo.length <= 3) return geo.join(", ");
      const areZips = geo.every(g => /^\d{5}$/.test(g));
      return areZips ? `${geo.length} ZIP codes` : `${geo.length} DMAs`;
    }
    const parts = geo.split(";").map(s => s.trim()).filter(Boolean);
    if (parts.length <= 3) return parts.join(", ");
    const areZips = parts.every(g => /^\d{5}$/.test(g));
    return areZips ? `${parts.length} ZIP codes` : `${parts.length} DMAs`;
  })();

  // Build audience label: prefer ethnic overlay + demo, else audience or demo
  const audienceLabel = (() => {
    const eth = opts.ethnicOverlay && opts.ethnicOverlay !== "General Market" ? opts.ethnicOverlay : null;
    if (eth) return `${eth} ${targetDemo}`;
    if (audience && audience !== "All Adults" && audience !== "General Market") return audience;
    return targetDemo;
  })();

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

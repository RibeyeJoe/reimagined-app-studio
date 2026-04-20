/**
 * Default media channel configurations — McDonald's-grade test data.
 * Pre-populates the Media Channels page so the tool is usable for demos.
 */
import type { ChannelConfig } from "@/components/channel-config-modal";

const uid = () => Math.random().toString(36).slice(2, 9);

export const DEFAULT_CONFIGS: Record<string, ChannelConfig> = {
  Search: {
    pricing: [
      { id: uid(), model: "CPC", rate: 2.85, label: "Non-Brand" },
      { id: uid(), model: "CPC", rate: 1.20, label: "Brand" },
      { id: uid(), model: "CPM", rate: 12.00, label: "Display Network" },
    ],
    daypartRates: [],
    publishers: [
      { id: uid(), name: "Google Ads", rate: 2.85 },
      { id: uid(), name: "Microsoft Ads (Bing)", rate: 1.95 },
    ],
    notes: "QSR vertical avg CPC $2.50-$3.50. Brand terms convert 4x higher.",
  },
  Social: {
    pricing: [
      { id: uid(), model: "CPM", rate: 9.50, label: "Prospecting" },
      { id: uid(), model: "CPM", rate: 14.00, label: "Retargeting" },
      { id: uid(), model: "CPC", rate: 0.85, label: "Link Clicks" },
    ],
    daypartRates: [],
    publishers: [
      { id: uid(), name: "Meta (Facebook/Instagram)", rate: 9.50 },
      { id: uid(), name: "TikTok", rate: 7.00 },
      { id: uid(), name: "Snapchat", rate: 6.50 },
      { id: uid(), name: "LinkedIn", rate: 35.00 },
      { id: uid(), name: "Pinterest", rate: 5.00 },
      { id: uid(), name: "X (Twitter)", rate: 8.00 },
    ],
    notes: "Meta drives ~70% of social performance for QSR. TikTok strong for 18-34.",
  },
  Display: {
    pricing: [
      { id: uid(), model: "CPM", rate: 5.50, label: "Open Exchange" },
      { id: uid(), model: "CPM", rate: 8.00, label: "PMP Deals" },
      { id: uid(), model: "CPM", rate: 12.00, label: "Direct / Guaranteed" },
    ],
    daypartRates: [],
    publishers: [
      { id: uid(), name: "Google DV360", rate: 5.50 },
      { id: uid(), name: "The Trade Desk", rate: 6.00 },
      { id: uid(), name: "Xandr", rate: 5.00 },
      { id: uid(), name: "Yahoo DSP", rate: 5.50 },
    ],
    notes: "Retargeting display CPAs typically 40-60% lower than prospecting.",
  },
  OLV: {
    pricing: [
      { id: uid(), model: "CPM", rate: 14.00, label: "Pre-Roll 15s" },
      { id: uid(), model: "CPM", rate: 18.00, label: "Pre-Roll 30s" },
      { id: uid(), model: "CPV", rate: 0.04, label: "Completed View" },
    ],
    daypartRates: [],
    publishers: [
      { id: uid(), name: "DV360 Video", rate: 14.00 },
      { id: uid(), name: "The Trade Desk Video", rate: 15.00 },
      { id: uid(), name: "Hulu", rate: 28.00 },
    ],
    notes: "15s pre-roll outperforms 30s for QSR on completion rate (82% vs 65%).",
  },
  CTV: {
    pricing: [
      { id: uid(), model: "CPM", rate: 26.00, label: "Programmatic" },
      { id: uid(), model: "CPM", rate: 35.00, label: "Premium / Direct" },
      { id: uid(), model: "CPM", rate: 22.00, label: "FAST Channels" },
    ],
    daypartRates: [
      { daypart: "Prime (7p-11p)", rate: 32.00 },
      { daypart: "Daytime", rate: 20.00 },
      { daypart: "Late Night", rate: 18.00 },
      { daypart: "Weekend", rate: 28.00 },
    ],
    publishers: [
      { id: uid(), name: "Roku", rate: 26.00 },
      { id: uid(), name: "Samsung TV+", rate: 22.00 },
      { id: uid(), name: "LG Channels", rate: 20.00 },
      { id: uid(), name: "Vizio", rate: 18.00 },
      { id: uid(), name: "Pluto TV", rate: 15.00 },
      { id: uid(), name: "Tubi", rate: 16.00 },
    ],
    notes: "CTV completion rates avg 95%+ for QSR. Prime daypart drives best recall.",
  },
  "YouTube/YouTubeTV": {
    pricing: [
      { id: uid(), model: "CPV", rate: 0.06, label: "TrueView In-Stream" },
      { id: uid(), model: "CPM", rate: 20.00, label: "Bumper Ads (6s)" },
      { id: uid(), model: "CPM", rate: 24.00, label: "YouTube TV" },
    ],
    daypartRates: [],
    publishers: [
      { id: uid(), name: "YouTube", rate: 20.00 },
      { id: uid(), name: "YouTube TV", rate: 24.00 },
      { id: uid(), name: "YouTube Shorts", rate: 8.00 },
    ],
    notes: "YouTube Shorts CPMs ~60% lower than in-stream. Strong for 18-34 reach.",
  },
  "Amazon/Prime Video/Twitch": {
    pricing: [
      { id: uid(), model: "CPM", rate: 25.00, label: "Prime Video Ads" },
      { id: uid(), model: "CPM", rate: 30.00, label: "Thursday Night Football" },
      { id: uid(), model: "CPM", rate: 12.00, label: "Twitch" },
      { id: uid(), model: "CPM", rate: 15.00, label: "Fire TV" },
    ],
    daypartRates: [],
    publishers: [
      { id: uid(), name: "Amazon DSP", rate: 25.00 },
      { id: uid(), name: "Twitch", rate: 12.00 },
      { id: uid(), name: "IMDb TV / Freevee", rate: 18.00 },
    ],
    notes: "Amazon 1P purchase data enables closed-loop attribution for QSR delivery.",
  },
  Linear: {
    pricing: [
      { id: uid(), model: "CPM", rate: 4.85, label: "Broadcast :30" },
      { id: uid(), model: "CPM", rate: 3.50, label: "Cable :30" },
      { id: uid(), model: "CPM", rate: 6.50, label: "Broadcast :15" },
    ],
    daypartRates: [
      { daypart: "Morning Drive (6a-10a)", rate: 5.50 },
      { daypart: "Midday (10a-3p)", rate: 3.00 },
      { daypart: "Prime (7p-11p)", rate: 12.00 },
      { daypart: "Late Night (11p-2a)", rate: 2.50 },
      { daypart: "Weekend", rate: 4.50 },
    ],
    publishers: [
      { id: uid(), name: "ABC / Local Affiliate", rate: 5.50 },
      { id: uid(), name: "NBC / Local Affiliate", rate: 5.50 },
      { id: uid(), name: "CBS / Local Affiliate", rate: 5.00 },
      { id: uid(), name: "FOX / Local Affiliate", rate: 4.50 },
      { id: uid(), name: "ESPN", rate: 15.00 },
      { id: uid(), name: "CNN", rate: 8.00 },
      { id: uid(), name: "Fox News", rate: 6.00 },
    ],
    notes: "Linear delivers broadest 35+ reach. Prime 3-4x cost but highest recall. McDonald's historically strong in morning drive + prime.",
  },
  Radio: {
    pricing: [
      { id: uid(), model: "CPM", rate: 3.20, label: ":30 Spot" },
      { id: uid(), model: "CPM", rate: 4.50, label: ":60 Spot" },
      { id: uid(), model: "Flat Fee", rate: 500, label: "Live Read / Endorsement" },
    ],
    daypartRates: [
      { daypart: "Morning Drive (6a-10a)", rate: 5.50 },
      { daypart: "Midday (10a-3p)", rate: 2.50 },
      { daypart: "Afternoon Drive (3p-7p)", rate: 4.50 },
      { daypart: "Weekend", rate: 2.00 },
    ],
    publishers: [
      { id: uid(), name: "iHeart Media", rate: 3.50 },
      { id: uid(), name: "Cumulus", rate: 3.00 },
      { id: uid(), name: "Audacy", rate: 3.20 },
      { id: uid(), name: "Townsquare Media", rate: 2.80 },
    ],
    notes: "Morning and afternoon drive deliver highest reach for QSR. Live reads outperform produced spots 2:1 on recall.",
  },
  Audio: {
    pricing: [
      { id: uid(), model: "CPM", rate: 10.00, label: "Streaming Audio :30" },
      { id: uid(), model: "CPM", rate: 15.00, label: "Podcast Host-Read" },
      { id: uid(), model: "CPM", rate: 25.00, label: "Podcast Baked-In" },
    ],
    daypartRates: [],
    publishers: [
      { id: uid(), name: "Spotify", rate: 10.00 },
      { id: uid(), name: "Pandora", rate: 8.00 },
      { id: uid(), name: "iHeart Digital", rate: 9.00 },
      { id: uid(), name: "SiriusXM / Stitcher", rate: 12.00 },
      { id: uid(), name: "Amazon Music", rate: 11.00 },
    ],
    notes: "Spotify 18-34 reach unmatched in audio. Podcast host-reads drive 2.5x higher brand recall vs produced.",
  },
  DOOH: {
    pricing: [
      { id: uid(), model: "CPM", rate: 15.00, label: "Programmatic DOOH" },
      { id: uid(), model: "CPM", rate: 22.00, label: "Premium / Times Square-class" },
      { id: uid(), model: "CPM", rate: 10.00, label: "Place-based (Gyms, Gas)" },
    ],
    daypartRates: [
      { daypart: "Morning Drive (6a-10a)", rate: 18.00 },
      { daypart: "Midday (10a-3p)", rate: 15.00 },
      { daypart: "Afternoon Drive (3p-7p)", rate: 18.00 },
    ],
    publishers: [
      { id: uid(), name: "Vistar Media", rate: 15.00 },
      { id: uid(), name: "Place Exchange", rate: 14.00 },
      { id: uid(), name: "Broadsign", rate: 12.00 },
      { id: uid(), name: "VIOOH", rate: 16.00 },
    ],
    notes: "Programmatic DOOH enables dayparting and weather triggers. QSR benefits from lunch/dinner daypart targeting.",
    oohVerticals: ["Transit", "Retail", "Outdoor", "Airport"],
    oohTypes: ["Digital Kiosk", "Gas Station", "Mall", "Arena/Stadium"],
  },
  OOH: {
    pricing: [
      { id: uid(), model: "CPM", rate: 5.00, label: "Bulletins (14x48)" },
      { id: uid(), model: "CPM", rate: 3.50, label: "Posters (Junior/30-Sheet)" },
      { id: uid(), model: "Flat Fee", rate: 1500, label: "Bus Wrap (per unit/mo)" },
      { id: uid(), model: "Flat Fee", rate: 800, label: "Bus Shelter (per unit/mo)" },
    ],
    daypartRates: [],
    publishers: [
      { id: uid(), name: "Lamar Advertising", rate: 5.00 },
      { id: uid(), name: "Clear Channel Outdoor", rate: 5.50 },
      { id: uid(), name: "Outfront Media", rate: 4.50 },
      { id: uid(), name: "JCDecaux", rate: 6.00 },
    ],
    notes: "Billboards within 1-mile of McDonald's locations drive highest store visit lift. 4-week minimum flights recommended.",
    oohVerticals: ["Transit", "Retail", "Outdoor"],
    oohTypes: ["Billboard", "Bus Shelter", "Bus Wrap", "Gas Station"],
  },
  Email: {
    pricing: [
      { id: uid(), model: "CPM", rate: 0.50, label: "CRM / Owned List" },
      { id: uid(), model: "CPM", rate: 8.00, label: "3rd Party / Sponsored" },
      { id: uid(), model: "CPC", rate: 0.15, label: "Newsletter Sponsorship" },
    ],
    daypartRates: [],
    publishers: [
      { id: uid(), name: "Owned CRM (Mailchimp/Braze)", rate: 0.50 },
      { id: uid(), name: "LiveIntent", rate: 8.00 },
      { id: uid(), name: "PowerInbox", rate: 7.00 },
    ],
    notes: "Owned list email has highest ROI of any channel ($36:1 avg). Tues/Thurs 10am-12pm optimal send times for QSR.",
  },
  Netflix: {
    pricing: [
      { id: uid(), model: "CPM", rate: 35.00, label: "Standard with Ads" },
      { id: uid(), model: "CPM", rate: 45.00, label: "Premium Placement" },
    ],
    daypartRates: [
      { daypart: "Prime (7p-11p)", rate: 42.00 },
      { daypart: "Weekend", rate: 38.00 },
    ],
    publishers: [
      { id: uid(), name: "Netflix (via Microsoft)", rate: 35.00 },
    ],
    notes: "Netflix ad tier reaches affluent 18-49. $10K minimum campaign spend. Limited targeting but high attention.",
  },
};

/**
 * Extract the primary CPM from a channel config.
 * Finds the first CPM-model pricing entry; falls back to null.
 */
export function getConfigCPM(config: ChannelConfig | undefined): number | null {
  if (!config) return null;
  const cpmEntry = config.pricing.find(p => p.model === "CPM" && p.rate > 0);
  return cpmEntry?.rate ?? null;
}

/**
 * Build a { daypart -> CPM } map from a channel config's daypartRates.
 * Returns null if the config has no usable daypart rates.
 */
export function getDaypartRateMap(config: ChannelConfig | undefined): Record<string, number> | null {
  if (!config?.daypartRates?.length) return null;
  const map: Record<string, number> = {};
  for (const dp of config.daypartRates) {
    if (dp.rate > 0) map[dp.daypart] = dp.rate;
  }
  return Object.keys(map).length > 0 ? map : null;
}

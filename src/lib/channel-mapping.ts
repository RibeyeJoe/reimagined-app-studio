import { CHANNELS, type Channel, type HistoricalPerformance } from "./schema";

const NORMALIZED_PLANNER_CHANNELS: Array<{ key: string; channel: Channel }> = CHANNELS.map((channel) => ({
  key: normalizeChannelKey(channel),
  channel,
}));

const HISTORICAL_CHANNEL_ALIASES: Record<string, Channel[]> = {
  search: ["Search"],
  paidsearch: ["Search"],
  sem: ["Search"],
  social: ["Social"],
  paidsocial: ["Social"],
  socialmedia: ["Social"],
  display: ["Display"],
  programmaticdisplay: ["Display"],
  banner: ["Display"],
  olv: ["OLV"],
  onlinevideo: ["OLV"],
  digitalvideo: ["OLV"],
  video: ["OLV"],
  ctv: ["CTV"],
  ott: ["CTV"],
  connectedtv: ["CTV"],
  streamingtv: ["CTV"],
  youtube: ["YouTube/YouTubeTV"],
  youtubetv: ["YouTube/YouTubeTV"],
  amazon: ["Amazon/Prime Video/Twitch"],
  primevideo: ["Amazon/Prime Video/Twitch"],
  twitch: ["Amazon/Prime Video/Twitch"],
  lineartv: ["Linear"],
  linear: ["Linear"],
  broadcasttv: ["Linear"],
  radio: ["Radio"],
  terrestrialradio: ["Radio"],
  audio: ["Audio"],
  streamingaudio: ["Audio"],
  podcast: ["Audio"],
  dooh: ["DOOH"],
  digitaloutofhome: ["DOOH"],
  ooh: ["OOH"],
  outofhome: ["OOH"],
  billboard: ["OOH"],
  billboards: ["OOH"],
  email: ["Email"],
  crm: ["Email"],
  netflix: ["Netflix"],
};

export function normalizeChannelKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function mapRawChannelToPlannerChannels(rawChannel: string): Channel[] {
  const normalized = normalizeChannelKey(rawChannel);
  const exactMatch = NORMALIZED_PLANNER_CHANNELS.find((item) => item.key === normalized);

  if (exactMatch) return [exactMatch.channel];

  return HISTORICAL_CHANNEL_ALIASES[normalized] || [];
}

export function expandHistoricalChannels(rawChannels: string[]): Channel[] {
  return [...new Set(rawChannels.flatMap((channel) => mapRawChannelToPlannerChannels(channel)))];
}

export function matchesHistoricalPlannerChannel(channel: string, historicalChannel: string) {
  const normalizedChannel = normalizeChannelKey(channel);
  const mappedHistorical = mapRawChannelToPlannerChannels(historicalChannel);

  return mappedHistorical.some((item) => normalizeChannelKey(item) === normalizedChannel)
    || normalizeChannelKey(historicalChannel) === normalizedChannel;
}

export function mapHistoricalInsightsToPerformance(
  channels: Array<{ channel: string; totalImpressions?: number; totalReach?: number }>
): HistoricalPerformance[] {
  const aggregated = new Map<Channel, HistoricalPerformance>();

  channels.forEach((entry) => {
    const plannerChannel = mapRawChannelToPlannerChannels(entry.channel)[0];
    if (!plannerChannel) return;

    const current = aggregated.get(plannerChannel) || {
      channel: plannerChannel,
      period: "Historical",
      impressions: 0,
      reach: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      cpm: 0,
      cpc: 0,
      ctr: 0,
      convRate: 0,
    };

    current.impressions += Number(entry.totalImpressions) || 0;
    current.reach += Number(entry.totalReach) || 0;
    aggregated.set(plannerChannel, current);
  });

  return [...aggregated.values()].sort((a, b) => b.impressions - a.impressions);
}
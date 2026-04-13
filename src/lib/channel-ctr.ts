/**
 * CTR and conversion rate benchmarks by channel.
 * Used to derive click and lead estimates from impressions.
 */

export const CHANNEL_CTR: Record<string, number> = {
  Search: 0.035,
  Social: 0.009,
  Display: 0.0035,
  OLV: 0.006,
  CTV: 0.0025,
  "YouTube/YouTubeTV": 0.008,
  "Amazon/Prime Video/Twitch": 0.007,
  Linear: 0,
  Radio: 0,
  Audio: 0.004,
  DOOH: 0,
  OOH: 0,
  Email: 0.025,
  Netflix: 0.0015,
};

export const CHANNEL_CONV_RATE: Record<string, number> = {
  Search: 0.03,
  Social: 0.015,
  Display: 0.01,
  OLV: 0.01,
  CTV: 0.005,
  "YouTube/YouTubeTV": 0.01,
  "Amazon/Prime Video/Twitch": 0.01,
  Linear: 0,
  Radio: 0,
  Audio: 0.005,
  DOOH: 0,
  OOH: 0,
  Email: 0.02,
  Netflix: 0.005,
};

// Utility for parsing uploaded performance CSV data and interacting with the performance API

export interface ParsedPerformanceRow {
  advertiser_code: string;
  advertiser_name: string | null;
  campaign_day: string;
  line_item_name: string;
  flight_start: string | null;
  flight_end: string | null;
  booked_impressions: number;
  creative_name: string | null;
  creative_duration: number | null;
  digital_channel: string;
  publisher: string | null;
  device_type: string | null;
  genre: string | null;
  dma: string | null;
  zip: string | null;
  daypart: string | null;
  day_of_week: string | null;
  hour_of_day: number | null;
  impressions: number;
  reach: number;
  frequency: number;
  vcr: number;
  acr: number;
  goal: string | null;
  upload_batch_id: string;
}

function parseDate(val: string): string | null {
  if (!val) return null;
  // Handle MM/DD/YYYY format
  const parts = val.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
  }
  return val;
}

function extractAdvertiserCode(lineItemName: string): string {
  // Format: Ribeye|MNTX|Fringe|...|MCD12601391SD|MCD|VID|...
  const parts = lineItemName.split("|");
  if (parts.length > 5) return parts[5].toUpperCase();
  return "UNKNOWN";
}

function extractGoal(lineItemName: string): string | null {
  const parts = lineItemName.split("|");
  if (parts.length > 8) return parts[8] || null;
  return null;
}

export function parsePerformanceCSV(csvText: string, batchId: string): ParsedPerformanceRow[] {
  const lines = csvText.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.trim().replace(/^"|"$/g, ""));

  const colIdx = (name: string) => headers.indexOf(name);

  const rows: ParsedPerformanceRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    try {
      const vals = parseCSVLine(lines[i]).map(v => v.trim().replace(/^"|"$/g, ""));
      const lineItemName = vals[colIdx("LINE_ITEM_NAME")] || "";
      const advertiserCode = extractAdvertiserCode(lineItemName);

      rows.push({
        advertiser_code: advertiserCode,
        advertiser_name: null,
        campaign_day: parseDate(vals[colIdx("DAY")] || "") || "1970-01-01",
        line_item_name: lineItemName,
        flight_start: parseDate(vals[colIdx("LINE_ITEM_START_DATE")] || ""),
        flight_end: parseDate(vals[colIdx("LINE_ITEM_END_DATE")] || ""),
        booked_impressions: Number(vals[colIdx("LINE_ITEM_BOOKED_IMPRESSIONS")]) || 0,
        creative_name: vals[colIdx("CREATIVE_NAME_MAPPED")] || null,
        creative_duration: Number(vals[colIdx("CREATIVE_DURATION")]) || null,
        digital_channel: vals[colIdx("DIGITAL_CHANNEL")] || "Unknown",
        publisher: vals[colIdx("PUBLISHER_NAME_MAPPED")] || null,
        device_type: vals[colIdx("DEVICE_TYPE")] || null,
        genre: vals[colIdx("GENRE")] || null,
        dma: vals[colIdx("DMA")] || null,
        zip: vals[colIdx("ZIP")] || null,
        daypart: vals[colIdx("DAYPART")] || null,
        day_of_week: vals[colIdx("DAY_OF_WEEK")] || null,
        hour_of_day: vals[colIdx("HOUR_OF_DAY")] ? Number(vals[colIdx("HOUR_OF_DAY")]) : null,
        impressions: Number(vals[colIdx("IMPRESSIONS")]) || 0,
        reach: Number(vals[colIdx("REACH")]) || 0,
        frequency: Number(vals[colIdx("FREQUENCY")]) || 0,
        vcr: Number(vals[colIdx("VCR")]) || 0,
        acr: Number(vals[colIdx("ACR")]) || 0,
        goal: extractGoal(lineItemName),
        upload_batch_id: batchId,
      });
    } catch {
      // Skip malformed rows
    }
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function getUniqueAdvertisers(rows: ParsedPerformanceRow[]): string[] {
  return [...new Set(rows.map(r => r.advertiser_code))].filter(a => a !== "UNKNOWN");
}

export interface AdvertiserInsights {
  found: boolean;
  message?: string;
  advertiserCode?: string;
  dateRange?: { min: string; max: string };
  lookbackDays?: number;
  totalRows?: number;
  channels?: {
    channel: string;
    totalImpressions: number;
    totalReach: number;
    avgFrequency: number;
    avgVCR: number;
    avgACR: number;
    rows: number;
    topPublishers: string[];
    dayparts: string[];
    dmaCount: number;
  }[];
  topDMAs?: { dma: string; impressions: number; reach: number; count: number }[];
  dayparts?: { daypart: string; impressions: number; avgVCR: number; rows: number }[];
  recommendations?: string[];
  totalImpressions?: number;
  totalReach?: number;
}

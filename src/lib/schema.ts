// Ribeye Omni Planner – shared types

export const STEPS = ["intake", "goals", "geo", "audiences", "channels", "review"] as const;
export type StepId = typeof STEPS[number];

export const GOALS = ["Awareness", "Consideration", "Leads", "Foot Traffic", "Conquest"] as const;
export type Goal = typeof GOALS[number];

export const CTA_TYPES = ["Call", "Form", "Booking", "Order"] as const;
export type CTAType = typeof CTA_TYPES[number];

export const CHANNELS = [
  "Search", "Social", "Display", "OLV", "CTV", "YouTube/YouTubeTV",
  "Amazon/Prime Video/Twitch", "Linear", "Radio", "Audio", "DOOH", "OOH",
  "Email", "Netflix"
] as const;
export type Channel = typeof CHANNELS[number];

export const CHANNEL_GROUPS = ["Demand Capture", "Demand Create", "Support"] as const;
export type ChannelGroup = typeof CHANNEL_GROUPS[number];

export const AVAILABILITY_TAGS = ["Available now", "Requires integration", "Sold by rep"] as const;
export type AvailabilityTag = typeof AVAILABILITY_TAGS[number];

export const GEO_TYPES = ["City", "DMA", "ZIP List", "Radius", "Congressional District"] as const;
export type GeoType = typeof GEO_TYPES[number];

export const CONFIDENCE_LEVELS = ["High", "Medium", "Low"] as const;
export type ConfidenceLevel = typeof CONFIDENCE_LEVELS[number];

export const AUDIENCE_TIERS = ["High Intent", "Mid Intent", "Reach"] as const;
export type AudienceTier = typeof AUDIENCE_TIERS[number];

export const IO_STATUSES = ["draft", "sent", "signed", "live"] as const;
export type IOStatus = typeof IO_STATUSES[number];

// OOH / DOOH verticals and types
export const OOH_VERTICALS = ["Transit", "Retail", "Outdoor", "Airport", "Sports & Entertainment", "Healthcare", "Office"] as const;
export type OOHVertical = typeof OOH_VERTICALS[number];

export const OOH_TYPES = [
  "Billboard", "Bus Shelter", "Gas Station", "Restaurant", "Grocery Store",
  "Mall", "Subway", "Bus Wrap", "Digital Kiosk", "Taxi Top", "Airport Screen",
  "Arena/Stadium", "Elevator", "Gym", "Laundromat", "Pharmacy",
] as const;
export type OOHType = typeof OOH_TYPES[number];

// Dayparts for Linear / Radio
export const DAYPARTS = [
  "Morning Drive (6a-10a)", "Midday (10a-3p)", "Afternoon Drive (3p-7p)",
  "Prime (7p-11p)", "Late Night (11p-2a)", "Overnight (2a-6a)", "Weekend",
] as const;
export type Daypart = typeof DAYPARTS[number];

// Flighting presets
export const FLIGHTING_PRESETS = [
  "Next Week", "Next 2 Weeks", "Next Month", "Next Quarter", "Custom",
] as const;
export type FlightingPreset = typeof FLIGHTING_PRESETS[number];

export interface ChannelMetadata {
  channel: Channel;
  group: ChannelGroup;
  availability: AvailabilityTag;
  minSpendRange: { low: number; high: number };
  minSpendNote: string;
  disabledReason?: string;
}

export interface DetectedLocation {
  city?: string;
  state?: string;
  zip?: string;
  raw?: string;
}

export interface DetectedInfo {
  vertical: string;
  services: string[];
  ctaType: CTAType;
  suggestedGoal?: Goal;
  businessName?: string;
  locations?: DetectedLocation[];
  confidence?: ConfidenceLevel;
}

export interface IntakeState {
  websiteUrl: string;
  businessName: string;
  locations: string;
  monthlyBudget: number;
  detected: DetectedInfo | null;
  analyzed: boolean;
  flightStart: string;
  flightEnd: string;
}

export type PlanningPath = "new" | "existing";
export type ChannelMixMode = "improve" | "expand";

export interface GoalsState {
  goal: Goal | null;
  kpis: string[];
  channelMixMode: ChannelMixMode;
}

export interface GeoStrategy {
  type: "Core" | "Growth Ring" | "Conquest Zone";
  description: string;
}

export interface GeoState {
  geoType: GeoType | null;
  geoValue: string;
  strategies: GeoStrategy[];
}

export interface AudienceItem {
  name: string;
  tier: AudienceTier;
}

export interface AudiencesState {
  audiences: AudienceItem[];
  conquestEnabled: boolean;
}

export interface ChannelAllocation {
  channel: Channel;
  enabled: boolean;
  percentage: number;
  budget: number;
  oohVerticals?: OOHVertical[];
  oohTypes?: OOHType[];
  dayparts?: Daypart[];
}

export interface ChannelsState {
  allocations: ChannelAllocation[];
  locked: boolean;
  activePreset: string | null;
}

export interface ExpectedRange {
  metric: string;
  low: number;
  high: number;
  unit: string;
  confidence: ConfidenceLevel;
}

export interface Requirement {
  label: string;
  met: boolean;
}

export interface ShareOfVoice {
  channel: Channel;
  estimatedSOV: number;
  marketAverage: number;
  competitive: "Leading" | "Competitive" | "Below Average";
}

export interface HistoricalPerformance {
  channel: Channel;
  period: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  cpm: number;
  cpc: number;
  ctr: number;
  convRate: number;
}

export interface PlanOption {
  name: "Conservative" | "Balanced" | "Aggressive";
  summary: string;
  bestFor: string;
  goal: Goal;
  kpis: string[];
  geoSummary: string;
  audienceSummary: string;
  allocations: ChannelAllocation[];
  expectedRanges: ExpectedRange[];
  confidence: ConfidenceLevel;
  rationale: string[];
  requirements: Requirement[];
  totalBudget: number;
  shareOfVoice?: ShareOfVoice[];
}

export interface RecommendationSection {
  whatWeRecommend: string[];
  whyThisWorks: string[];
  whatWeNeedFromClient: string[];
  confidence: ConfidenceLevel;
}

export interface NarrativeOutput {
  whyThisWorks: string[];
  whatWellMeasure: string[];
  whatWeNeedFromYou: string[];
  recommendedOption: string;
}

export interface QuickStartState {
  budget: number | null;
  goal: Goal | null;
  websiteUrl: string;
}

export interface ChannelPreset {
  id: string;
  name: string;
  description: string;
  channels: Record<string, number>;
  rationale: string;
}

export interface BudgetRule {
  condition: string;
  geoType?: GeoType;
  minBudget: number;
  radiusMin?: number;
  message: string;
}

export interface PlannerState {
  currentStep: StepId;
  planningPath: PlanningPath;
  intake: IntakeState;
  goals: GoalsState;
  geo: GeoState;
  audiences: AudiencesState;
  channels: ChannelsState;
  options: PlanOption[];
  savedPlans: SavedPlan[];
  recommendations: RecommendationSection | null;
  quickStart: QuickStartState;
  historicalData: HistoricalPerformance[];
  performanceUploaded: boolean;
  performanceAdvertisers: string[];
  performanceAdvertiserCode: string | null;
  performanceAdvertiserName: string | null;
  performanceDMAs: string[];
  performanceZIPs: string[];
  performanceChannels: string[];
}

export interface SavedPlan {
  id: string;
  name: string;
  createdAt: string;
  option: PlanOption;
  intake: IntakeState;
}

export interface CopilotSection {
  id: string;
  title: string;
  content: string;
  recommendations: string[];
  confidence: ConfidenceLevel;
}

export interface BenchmarkEntry {
  vertical: string;
  goal: Goal;
  channel: Channel;
  cpm: { low: number; high: number };
  cpc: { low: number; high: number };
  ctr: { low: number; high: number };
  convRate: { low: number; high: number };
  confidence: ConfidenceLevel;
}

export interface Publisher {
  name: string;
  description?: string;
  url?: string;
}

export interface ChannelPricing {
  model?: string;
  rate?: number;
  rateLabel?: string;
  notes?: string;
}

export interface DeviceTarget {
  name: string;
  enabled: boolean;
}

export interface SavedSessionRow {
  id: number;
  name: string;
  state: any;
  createdAt: string;
  updatedAt: string;
}

export interface InsertionOrderRow {
  id: number;
  ioNumber: string;
  sessionId?: number;
  clientName: string;
  businessName: string;
  status: string;
  planName: string;
  planOption: any;
  intakeData: any;
  geoData?: any;
  audiencesData?: any;
  totalBudget: number;
  flightStart?: string;
  flightEnd?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaChannelRow {
  id: number;
  channel: string;
  publishers: any;
  pricing: any;
  devices: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationRow {
  id: number;
  name: string;
  slug: string;
  category: string;
  status: string;
  apiKey?: string;
  apiEndpoint?: string;
  config: any;
  lastChecked?: string;
  lastError?: string;
  errorHistory: any;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationError {
  message: string;
  timestamp: string;
  code?: string;
}

export interface TemplateRow {
  id: number;
  name: string;
  description?: string;
  isDefault: number;
  slideConfig: any;
  branding: any;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateBranding {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  companyName?: string;
  tagline?: string;
  footerText?: string;
}

export interface SlideConfig {
  includeTitleSlide?: boolean;
  includeOverview?: boolean;
  includeChannelMix?: boolean;
  includeKPIs?: boolean;
  includeTimeline?: boolean;
  includeInvestment?: boolean;
  includeNextSteps?: boolean;
  customSlides?: { title: string; body: string }[];
}

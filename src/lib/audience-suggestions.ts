// Audience suggestion engine — platform-agnostic, media-buyer-ready labels
import type { AudienceTier, Goal } from "@/lib/schema";

interface VerticalAudiences {
  "High Intent": string[];
  "Mid Intent": string[];
  "Reach": string[];
}

interface ConquestOverlay {
  "High Intent": string[];
  "Mid Intent": string[];
  "Reach": string[];
}

// Known competitor sets by vertical keyword
const COMPETITOR_MAP: Record<string, Record<string, string[]>> = {
  qsr: {
    "mcdonald's": ["Burger King", "Wendy's", "Chick-fil-A", "Taco Bell"],
    "burger king": ["McDonald's", "Wendy's", "Chick-fil-A", "Five Guys"],
    "wendy's": ["McDonald's", "Burger King", "Chick-fil-A", "Arby's"],
    "chick-fil-a": ["McDonald's", "Popeyes", "Raising Cane's", "Zaxby's"],
    "taco bell": ["McDonald's", "Chipotle", "Del Taco", "Qdoba"],
    "chipotle": ["Taco Bell", "Qdoba", "Moe's", "Panera Bread"],
    "subway": ["Jimmy John's", "Jersey Mike's", "Firehouse Subs", "Panera Bread"],
    "starbucks": ["Dunkin'", "Peet's Coffee", "Dutch Bros", "Tim Hortons"],
    "dunkin'": ["Starbucks", "Peet's Coffee", "Dutch Bros", "Tim Hortons"],
    "domino's": ["Pizza Hut", "Papa John's", "Little Caesars", "Papa Murphy's"],
    "pizza hut": ["Domino's", "Papa John's", "Little Caesars", "Papa Murphy's"],
    _default: ["Top Competitor A", "Top Competitor B", "Top Competitor C"],
  },
  automotive: {
    toyota: ["Honda", "Ford", "Chevrolet", "Hyundai"],
    honda: ["Toyota", "Nissan", "Hyundai", "Mazda"],
    ford: ["Chevrolet", "Toyota", "Ram", "GMC"],
    chevrolet: ["Ford", "Toyota", "Ram", "Honda"],
    bmw: ["Mercedes-Benz", "Audi", "Lexus", "Tesla"],
    tesla: ["BMW", "Mercedes-Benz", "Rivian", "Polestar"],
    _default: ["Top Competing Brand A", "Top Competing Brand B", "Top Competing Brand C"],
  },
  healthcare: {
    _default: ["Competing Health System A", "Competing Health System B", "Competing Urgent Care"],
  },
  "home services": {
    _default: ["Competing Service Provider A", "Competing Service Provider B", "Local Competitor C"],
  },
  retail: {
    walmart: ["Target", "Amazon", "Costco", "Kroger"],
    target: ["Walmart", "Amazon", "Costco", "Kohl's"],
    "home depot": ["Lowe's", "Menards", "Ace Hardware", "True Value"],
    "lowe's": ["Home Depot", "Menards", "Ace Hardware", "True Value"],
    _default: ["Top Retail Competitor A", "Top Retail Competitor B", "Top Retail Competitor C"],
  },
};

function getCompetitors(verticalKey: string, businessName: string): string[] {
  const vertMap = COMPETITOR_MAP[verticalKey] || COMPETITOR_MAP._default;
  if (!vertMap) return ["Top Competitor A", "Top Competitor B", "Top Competitor C"];
  const key = businessName.toLowerCase();
  return vertMap[key] || vertMap._default || ["Top Competitor A", "Top Competitor B", "Top Competitor C"];
}

// ---------- Vertical audience tables ----------

const VERTICAL_AUDIENCES: Record<string, Record<string, VerticalAudiences>> = {
  qsr: {
    default: {
      "High Intent": [
        "In-Market: Restaurants & Dining",
        "Custom Intent: Fast Food, Burger Delivery, Drive-Thru Near Me",
        "Recent Brand Searchers",
        "Mobile App Users: Food Delivery & Ordering",
        "Past Purchasers / Loyalty Members",
      ],
      "Mid Intent": [
        "Affinity: Fast Food Enthusiasts",
        "Behavioral: Frequent Restaurant Visitors",
        "Mobile Coupon & Deal Seekers",
        "Food & Cooking Content Viewers",
        "Families with Children (Ages 6-17)",
        "Lunchtime Daypart Commuters",
      ],
      "Reach": [
        "Adults 18-49",
        "Adults 25-54, HHI $50K+",
        "Parents with Kids in Household",
        "Sports & Entertainment Viewers",
        "Adults 18+ Within 5-Mile Radius",
        "Morning Drive Commuters (Radio/Audio)",
        "Primetime TV Viewers (Linear/CTV)",
      ],
    },
    Awareness: {
      "High Intent": [
        "In-Market: Restaurants & Dining",
        "Custom Intent: Fast Food Near Me, Quick Service",
        "Recent Brand Searchers",
        "Mobile App Users: Food Delivery & Ordering",
        "Past Purchasers / Loyalty Members",
      ],
      "Mid Intent": [
        "Affinity: Fast Food Enthusiasts",
        "Food & Cooking Content Viewers",
        "Families with Children (Ages 6-17)",
        "Sports Fans & Event Attendees",
        "Social Media Foodies & Trend Followers",
        "Mobile Coupon & Deal Seekers",
      ],
      "Reach": [
        "Adults 18-49",
        "Adults 18-34 (Gen Z & Young Millennials)",
        "Parents with Kids in Household",
        "Primetime TV Viewers (Linear/CTV)",
        "Sports & Entertainment Viewers",
        "Morning Drive Commuters (Radio/Audio)",
        "Adults 25-54, HHI $50K+",
      ],
    },
  },

  automotive: {
    default: {
      "High Intent": [
        "In-Market: New Vehicle Shoppers",
        "Custom Intent: Car Lease Deals, Trade-In Value, Test Drive",
        "Recent Dealership Website Visitors",
        "Auto Loan Pre-Qualified Shoppers",
        "Vehicle Lease Expiring (Next 90 Days)",
      ],
      "Mid Intent": [
        "Affinity: Auto Enthusiasts",
        "Behavioral: Frequent Auto Review Readers",
        "In-Market: Auto Parts & Accessories",
        "Families Researching SUVs & Minivans",
        "New Movers (Last 60 Days)",
        "Commuters (25+ Mile Daily Drive)",
      ],
      "Reach": [
        "Adults 25-54",
        "Adults 25-54, HHI $75K+",
        "Primetime TV Viewers (Linear/CTV)",
        "Sports & Live Event Viewers",
        "Weekend Drive-Time Listeners (Radio/Audio)",
        "Adults 35-64 Homeowners",
      ],
    },
    Leads: {
      "High Intent": [
        "In-Market: New Vehicle Shoppers",
        "Custom Intent: [Brand] Lease Deals, [Brand] Price, Test Drive Near Me",
        "Recent Dealership Website Visitors",
        "Auto Loan Pre-Qualified Shoppers",
        "Vehicle Lease Expiring (Next 90 Days)",
        "Service Customers Due for Upgrade",
      ],
      "Mid Intent": [
        "Affinity: Auto Enthusiasts",
        "Behavioral: Auto Review & Comparison Readers",
        "Families Researching SUVs & Minivans",
        "New Movers (Last 60 Days)",
        "Commuters (25+ Mile Daily Drive)",
        "First-Time Car Buyers (Ages 18-25)",
      ],
      "Reach": [
        "Adults 25-54, HHI $75K+",
        "Adults 35-64 Homeowners",
        "Weekend Drive-Time Listeners (Radio/Audio)",
        "Primetime TV Viewers (Linear/CTV)",
        "Sports & Live Event Viewers",
        "Morning News Viewers",
      ],
    },
  },

  healthcare: {
    default: {
      "High Intent": [
        "In-Market: Healthcare Services",
        "Custom Intent: Doctor Near Me, Urgent Care, Specialist Appointment",
        "Recent Health System Website Visitors",
        "Health Insurance Open Enrollment Shoppers",
        "Patients Due for Annual Wellness Visit",
      ],
      "Mid Intent": [
        "Affinity: Health & Wellness Enthusiasts",
        "Behavioral: Health Content Readers",
        "New Movers (Last 90 Days)",
        "Expectant & New Parents",
        "Adults Managing Chronic Conditions",
        "Fitness & Nutrition Enthusiasts",
      ],
      "Reach": [
        "Adults 25-64",
        "Adults 35-64, HHI $50K+",
        "Women 25-54",
        "Parents with Kids in Household",
        "Morning News Viewers",
        "Primetime TV Viewers (Linear/CTV)",
        "Adults 18+ Within 10-Mile Radius",
      ],
    },
    Leads: {
      "High Intent": [
        "In-Market: Healthcare Services & Providers",
        "Custom Intent: Find a Doctor, Schedule Appointment, Specialist Near Me",
        "Recent Health System Website Visitors",
        "Health Insurance Open Enrollment Shoppers",
        "Patients Due for Annual Wellness Visit",
        "Emergency Room & Urgent Care Searchers",
      ],
      "Mid Intent": [
        "Affinity: Health & Wellness Enthusiasts",
        "Behavioral: Prescription & Pharmacy Visitors",
        "New Movers (Last 90 Days)",
        "Expectant & New Parents",
        "Adults Managing Chronic Conditions",
        "Medicare-Eligible Adults (Ages 64+)",
      ],
      "Reach": [
        "Adults 25-64",
        "Women 25-54",
        "Adults 35-64, HHI $50K+",
        "Parents with Kids in Household",
        "Adults 18+ Within 10-Mile Radius",
        "Morning News Viewers",
      ],
    },
  },

  "home services": {
    default: {
      "High Intent": [
        "In-Market: Home Repair & Maintenance",
        "Custom Intent: Plumber Near Me, HVAC Repair, Roof Replacement",
        "Recent Service Request / Website Visitors",
        "Homeowners with Aging Systems (10+ Year Homes)",
        "Emergency Service Searchers",
      ],
      "Mid Intent": [
        "Affinity: Home Improvement & DIY",
        "Behavioral: Home & Garden Content Viewers",
        "New Homeowners (Last 6 Months)",
        "Homeowners in Extreme Weather Markets",
        "Adults Planning Home Renovations",
        "Recent Home Insurance Shoppers",
      ],
      "Reach": [
        "Adults 30-64 Homeowners",
        "Adults 35-64, HHI $75K+",
        "Parents with Kids in Household",
        "Weekend Home Improvement Shoppers",
        "Morning Drive Commuters (Radio/Audio)",
        "Local News Viewers",
      ],
    },
    Leads: {
      "High Intent": [
        "In-Market: Home Repair & Maintenance Services",
        "Custom Intent: [Service] Near Me, Emergency [Service], [Service] Cost",
        "Recent Service Request / Website Visitors",
        "Homeowners with Aging Systems (10+ Year Homes)",
        "Emergency Service Searchers",
        "Past Customers Due for Seasonal Service",
      ],
      "Mid Intent": [
        "Affinity: Home Improvement & DIY",
        "New Homeowners (Last 6 Months)",
        "Homeowners in Extreme Weather Markets",
        "Adults Planning Home Renovations",
        "Recent Home Insurance Shoppers",
        "Seasonal Trigger: Pre-Summer / Pre-Winter",
      ],
      "Reach": [
        "Adults 30-64 Homeowners",
        "Adults 35-64, HHI $75K+",
        "Weekend Home Improvement Shoppers",
        "Morning Drive Commuters (Radio/Audio)",
        "Local News & Weather Viewers",
        "Adults 25+ Within 15-Mile Radius",
      ],
    },
  },

  retail: {
    default: {
      "High Intent": [
        "In-Market: Retail Shoppers (Category-Specific)",
        "Custom Intent: [Product] Deals, [Product] Near Me, Buy [Product] Online",
        "Recent Website / App Visitors",
        "Cart Abandoners (Last 14 Days)",
        "Loyalty Program Members",
      ],
      "Mid Intent": [
        "Affinity: Bargain Shoppers & Deal Seekers",
        "Behavioral: Frequent In-Store Visitors",
        "Seasonal Shoppers (Holiday / Back-to-School / Spring)",
        "Mobile Commerce & App Shoppers",
        "Product Review & Comparison Readers",
        "Social Commerce & Influencer Followers",
      ],
      "Reach": [
        "Adults 18-49",
        "Adults 25-54, HHI $50K+",
        "Women 25-54",
        "Parents with Kids in Household",
        "Primetime TV Viewers (Linear/CTV)",
        "Weekend Shoppers",
        "Adults 18+ Within 10-Mile Radius",
      ],
    },
  },
};

// Conquest overlays by vertical
function getConquestOverlay(verticalKey: string, competitors: string[]): ConquestOverlay {
  const compList = competitors.slice(0, 3).join(" / ");
  const compListShort = competitors.slice(0, 4).join(", ");
  return {
    "High Intent": [
      `Competitor Brand Searchers (${compListShort})`,
      "Competitor App Users & Downloaders",
    ],
    "Mid Intent": [
      `Visited ${compList} Locations (Last 30 Days)`,
      "Competitive Switchers & Lapsed Customers",
    ],
    "Reach": [
      "Competitor Share of Voice Targets",
    ],
  };
}

// Generic fallback audiences when vertical is unknown
const GENERIC_AUDIENCES: VerticalAudiences = {
  "High Intent": [
    "In-Market: Category Shoppers",
    "Custom Intent: [Service/Product] Near Me",
    "Recent Website Visitors",
    "Past Customers / CRM Match",
    "High-Intent Search Themes",
  ],
  "Mid Intent": [
    "Affinity: Related Category Enthusiasts",
    "Behavioral: Content Engagers (Category-Relevant)",
    "New Movers (Last 90 Days)",
    "Life Event Triggers (Relevant to Business)",
    "Product / Service Review Readers",
    "Mobile App Users (Category-Relevant)",
  ],
  "Reach": [
    "Adults 25-54",
    "Adults 18-49",
    "Adults 25-54, HHI $50K+",
    "Primetime TV Viewers (Linear/CTV)",
    "Morning Drive Commuters (Radio/Audio)",
    "Adults 18+ Within 10-Mile Radius",
  ],
};

const GENERIC_CONQUEST: ConquestOverlay = {
  "High Intent": [
    "Competitor Brand Searchers",
    "Competitor Website Visitors",
  ],
  "Mid Intent": [
    "Visited Competitor Locations (Last 30 Days)",
    "Competitive Switchers",
  ],
  "Reach": [
    "Competitor Share of Voice Targets",
  ],
};

// ---------- Main export ----------

function resolveVerticalKey(vertical: string): string | null {
  const v = (vertical || "").toLowerCase();
  if (!v) return null;
  if (/health|medical|hospital|clinic|dental|urgent care|physician|wellness|pharma|care system|provider|surgery|orthopedic|cardio/i.test(v)) return "healthcare";
  if (/qsr|quick service|restaurant|food|dining|pizza|burger|coffee|café|cafe|bakery|deli/i.test(v)) return "qsr";
  if (/auto|car|dealer|vehicle|motor|truck|dealership/i.test(v)) return "automotive";
  if (/home service|plumb|hvac|roof|electrician|landscap|pest|cleaning|contractor|handyman/i.test(v)) return "home services";
  if (/retail|store|shop|ecommerce|e-commerce|apparel|fashion|grocery/i.test(v)) return "retail";
  return null;
}

// Brand-aware "Custom Intent" line per vertical. Uses the actual business name
// + detected services so the keyword theme reflects the advertiser, not a template.
function buildCustomIntent(vertKey: string | null, brandName: string, services: string[]): string {
  const brand = (brandName || "").trim();
  const svc = services.filter(Boolean).slice(0, 1)[0] || "";
  const map: Record<string, string[]> = {
    healthcare: [
      brand ? `${brand} Services` : "Hospital Services",
      "Hospital Near Me",
      "Emergency Room Near Me",
      svc ? `${svc} Near Me` : "Doctor Near Me",
    ],
    qsr: [
      brand ? `${brand} Near Me` : "Restaurants Near Me",
      "Order Online",
      "Drive-Thru Near Me",
      svc ? `${svc} Delivery` : "Food Delivery",
    ],
    automotive: [
      brand ? `${brand} Lease Deals` : "Lease Deals",
      brand ? `${brand} Price` : "New Car Price",
      "Test Drive Near Me",
      svc ? `${svc} for Sale` : "SUV for Sale",
    ],
    "home services": [
      brand ? `${brand} Near Me` : "Service Near Me",
      svc ? `${svc} Cost` : "Repair Cost",
      svc ? `Emergency ${svc}` : "Emergency Service",
      "Free Estimate",
    ],
    retail: [
      brand ? `Buy ${brand} Online` : "Buy Online",
      svc ? `${svc} Deals` : "Best Deals",
      svc ? `${svc} Near Me` : "Store Near Me",
      "Free Shipping",
    ],
  };
  const themes = (vertKey && map[vertKey]) || [
    brand ? `${brand} Near Me` : "Service Near Me",
    svc ? `${svc} Near Me` : "Category Near Me",
    brand ? `${brand} Reviews` : "Top Rated",
  ];
  return `Custom Intent: ${themes.join(", ")}`;
}

export interface SuggestedAudiences {
  audiences: { name: string; tier: AudienceTier }[];
}

export function generateAudienceSuggestions(
  vertical: string,
  goal: Goal | null,
  businessName: string,
  conquestEnabled: boolean,
  services: string[] = [],
): SuggestedAudiences {
  const vertKey = resolveVerticalKey(vertical);
  const goalKey = goal || "default";

  // Pick the audience set
  let base: VerticalAudiences;
  if (vertKey && VERTICAL_AUDIENCES[vertKey]) {
    const vertTable = VERTICAL_AUDIENCES[vertKey];
    base = vertTable[goalKey] || vertTable.default;
  } else {
    base = { ...GENERIC_AUDIENCES };
  }

  // Replace placeholders with business-specific terms
  const brandName = businessName || "Brand";
  const primaryService = services[0] || "Service";

  const replacePlaceholders = (label: string): string =>
    label
      .replace(/\[Brand\]/g, brandName)
      .replace(/\[Service\/Product\]/g, primaryService)
      .replace(/\[Service\]/g, primaryService)
      .replace(/\[Product\]/g, primaryService);

  const customIntent = buildCustomIntent(vertKey, businessName, services);

  const result: { name: string; tier: AudienceTier }[] = [];

  for (const tier of ["High Intent", "Mid Intent", "Reach"] as AudienceTier[]) {
    for (const label of base[tier]) {
      const cleaned = replacePlaceholders(label);
      // Replace any pre-existing "Custom Intent: ..." line in High Intent with brand-aware one
      if (tier === "High Intent" && /^Custom Intent:/i.test(cleaned)) {
        result.push({ name: customIntent, tier });
      } else {
        result.push({ name: cleaned, tier });
      }
    }

    if (conquestEnabled) {
      let conquest: ConquestOverlay;
      if (vertKey) {
        const competitors = getCompetitors(vertKey, businessName);
        conquest = getConquestOverlay(vertKey, competitors);
      } else {
        conquest = GENERIC_CONQUEST;
      }
      for (const label of conquest[tier]) {
        result.push({ name: replacePlaceholders(label), tier });
      }
    }
  }

  return { audiences: result };
}

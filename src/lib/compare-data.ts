import type { SoftwareId } from "./catalog";

export const MAX_COMPARE_PRODUCTS = 4;
export const MIN_COMPARE_PRODUCTS = 2;

export type FeatureValue =
  | { kind: "boolean"; value: boolean }
  | { kind: "text"; value: string }
  | { kind: "unavailable" };

export type CompareFeature = {
  id: string;
  categoryId: string;
  label: string;
  order: number;
};

export type CompareFeatureCategory = {
  id: string;
  label: string;
  order: number;
};

export const COMPARE_CATEGORIES: CompareFeatureCategory[] = [
  { id: "pricing", label: "Pricing & fit", order: 1 },
  { id: "gst", label: "GST & compliance", order: 2 },
  { id: "operations", label: "Operations", order: 3 },
  { id: "platform", label: "Platform & access", order: 4 },
];

export const COMPARE_FEATURES: CompareFeature[] = [
  { id: "starting_price", categoryId: "pricing", label: "Starting price (indicative)", order: 1 },
  { id: "best_when", categoryId: "pricing", label: "Best when", order: 2 },
  { id: "gst_returns", categoryId: "gst", label: "GST returns & e-invoicing", order: 1 },
  { id: "gstr2b", categoryId: "gst", label: "GSTR-2B reconciliation support", order: 2 },
  { id: "multi_gstin", categoryId: "gst", label: "Multi-GSTIN / multi-branch", order: 3 },
  { id: "inventory", categoryId: "operations", label: "Inventory & batching", order: 1 },
  { id: "manufacturing", categoryId: "operations", label: "Manufacturing / BOM", order: 2 },
  { id: "payroll", categoryId: "operations", label: "Payroll (PF, ESI, TDS)", order: 3 },
  { id: "deployment", categoryId: "platform", label: "Primary deployment", order: 1 },
  { id: "offline", categoryId: "platform", label: "Works offline on desktop", order: 2 },
  { id: "mobile", categoryId: "platform", label: "Mobile apps", order: 3 },
  { id: "api", categoryId: "platform", label: "API & integrations", order: 4 },
];

/** Editorial feature matrix — confirm live capabilities with each vendor. */
export const COMPARE_MATRIX: Record<SoftwareId, Record<string, FeatureValue>> = {
  tally: {
    starting_price: { kind: "text", value: "from ₹22,500 one-time" },
    best_when: {
      kind: "text",
      value: "Offline inventory, deep stock control, and the workflow most CAs already know.",
    },
    gst_returns: { kind: "boolean", value: true },
    gstr2b: { kind: "boolean", value: true },
    multi_gstin: { kind: "boolean", value: true },
    inventory: { kind: "boolean", value: true },
    manufacturing: { kind: "boolean", value: true },
    payroll: { kind: "boolean", value: true },
    deployment: { kind: "text", value: "On-premise Windows (TallyPrime)" },
    offline: { kind: "boolean", value: true },
    mobile: { kind: "text", value: "Companion apps; core books on desktop" },
    api: { kind: "text", value: "TallyPrime Developer / integrations" },
  },
  zoho: {
    starting_price: { kind: "text", value: "from ₹749/month" },
    best_when: {
      kind: "text",
      value: "Cloud-first teams that want automation, bank feeds, and integrations.",
    },
    gst_returns: { kind: "boolean", value: true },
    gstr2b: { kind: "boolean", value: true },
    multi_gstin: { kind: "boolean", value: true },
    inventory: { kind: "boolean", value: true },
    manufacturing: { kind: "boolean", value: false },
    payroll: { kind: "boolean", value: true },
    deployment: { kind: "text", value: "Cloud (browser & apps)" },
    offline: { kind: "boolean", value: false },
    mobile: { kind: "boolean", value: true },
    api: { kind: "boolean", value: true },
  },
  busy: {
    starting_price: { kind: "text", value: "from ₹7,200/year" },
    best_when: {
      kind: "text",
      value: "Distributors needing multi-GSTIN, multi-branch, and affordable annual licensing.",
    },
    gst_returns: { kind: "boolean", value: true },
    gstr2b: { kind: "boolean", value: true },
    multi_gstin: { kind: "boolean", value: true },
    inventory: { kind: "boolean", value: true },
    manufacturing: { kind: "boolean", value: false },
    payroll: { kind: "boolean", value: true },
    deployment: { kind: "text", value: "On-premise Windows" },
    offline: { kind: "boolean", value: true },
    mobile: { kind: "text", value: "Limited / companion options vary by edition" },
    api: { kind: "boolean", value: false },
  },
  vyapar: {
    starting_price: { kind: "text", value: "from ₹3,600/year" },
    best_when: {
      kind: "text",
      value: "Small traders and shops invoicing and filing GST from a phone.",
    },
    gst_returns: { kind: "boolean", value: true },
    gstr2b: { kind: "boolean", value: false },
    multi_gstin: { kind: "boolean", value: false },
    inventory: { kind: "boolean", value: true },
    manufacturing: { kind: "boolean", value: false },
    payroll: { kind: "boolean", value: false },
    deployment: { kind: "text", value: "Mobile-first with desktop sync" },
    offline: { kind: "boolean", value: true },
    mobile: { kind: "boolean", value: true },
    api: { kind: "boolean", value: false },
  },
  marg: {
    starting_price: { kind: "text", value: "from ₹8,400/year" },
    best_when: {
      kind: "text",
      value: "Pharma, FMCG, and distribution with batch, expiry, and scheme tracking.",
    },
    gst_returns: { kind: "boolean", value: true },
    gstr2b: { kind: "boolean", value: true },
    multi_gstin: { kind: "boolean", value: true },
    inventory: { kind: "boolean", value: true },
    manufacturing: { kind: "boolean", value: false },
    payroll: { kind: "boolean", value: true },
    deployment: { kind: "text", value: "On-premise Windows" },
    offline: { kind: "boolean", value: true },
    mobile: { kind: "boolean", value: false },
    api: { kind: "text", value: "Limited; confirm with vendor" },
  },
  odoo: {
    starting_price: { kind: "text", value: "from ₹2,400/user/month" },
    best_when: {
      kind: "text",
      value: "Growing firms that want a modular ERP they can extend module by module.",
    },
    gst_returns: { kind: "boolean", value: true },
    gstr2b: { kind: "boolean", value: true },
    multi_gstin: { kind: "boolean", value: true },
    inventory: { kind: "boolean", value: true },
    manufacturing: { kind: "boolean", value: true },
    payroll: { kind: "boolean", value: true },
    deployment: { kind: "text", value: "Cloud or self-hosted" },
    offline: { kind: "boolean", value: false },
    mobile: { kind: "boolean", value: true },
    api: { kind: "boolean", value: true },
  },
  easync: {
    starting_price: { kind: "text", value: "from ₹14,999/year" },
    best_when: {
      kind: "text",
      value:
        "Cloud GST books with inventory, audit trail, and multi-entity options on CA-oriented plans.",
    },
    gst_returns: { kind: "boolean", value: true },
    gstr2b: { kind: "text", value: "On CA Special, Entity & Group plans" },
    multi_gstin: { kind: "text", value: "Multiple GSTNs on CA Special plan and above" },
    inventory: { kind: "boolean", value: true },
    manufacturing: { kind: "unavailable" },
    payroll: { kind: "boolean", value: false },
    deployment: { kind: "text", value: "Cloud SaaS (browser)" },
    offline: { kind: "boolean", value: false },
    mobile: { kind: "unavailable" },
    api: { kind: "unavailable" },
  },
};

export type PopularComparison = {
  ids: SoftwareId[];
  slug: string;
  blurb: string;
};

export const POPULAR_COMPARISONS: PopularComparison[] = [
  {
    ids: ["tally", "zoho"],
    slug: "tally-prime-vs-zoho-books",
    blurb: "Offline depth and CA familiarity vs cloud automation and bank feeds.",
  },
  {
    ids: ["busy", "marg"],
    slug: "busy-vs-marg-erp",
    blurb: "Affordable distribution accounting vs batch-heavy pharma and FMCG.",
  },
  {
    ids: ["vyapar", "zoho"],
    slug: "vyapar-vs-zoho-books",
    blurb: "Phone-first invoicing vs a fuller cloud books stack.",
  },
  {
    ids: ["tally", "busy"],
    slug: "tally-prime-vs-busy",
    blurb: "Market-standard desktop books vs value-focused multi-branch Busy.",
  },
  {
    ids: ["zoho", "odoo"],
    slug: "zoho-books-vs-odoo",
    blurb: "Focused accounting vs modular ERP growth path.",
  },
  {
    ids: ["easync", "zoho"],
    slug: "easync-books-vs-zoho-books",
    blurb: "India-focused cloud GST with multi-entity CA tiers vs Zoho's bank feeds and app ecosystem.",
  },
];

export const DEFAULT_COMPARE_IDS: SoftwareId[] = ["tally", "zoho"];

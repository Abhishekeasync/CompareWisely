export type SoftwareId = "tally" | "zoho" | "busy" | "vyapar" | "marg" | "odoo" | "easync";

export type Software = {
  id: SoftwareId;
  name: string;
  mono: string;
  price: string;
  rating: number;
  why: string;
};

export const SOFTWARE: Software[] = [
  {
    id: "tally",
    name: "Tally Prime",
    mono: "T",
    price: "from ₹22,500 one-time",
    rating: 4.6,
    why: "Best when you work offline, carry deep inventory or production, and want the standard your CA already knows.",
  },
  {
    id: "zoho",
    name: "Zoho Books",
    mono: "Z",
    price: "from ₹749/month",
    rating: 4.5,
    why: "Best for cloud-first teams who want automation, bank feeds, mobile access and integrations.",
  },
  {
    id: "busy",
    name: "Busy Accounting",
    mono: "B",
    price: "from ₹7,200/year",
    rating: 4.4,
    why: "Best value for distributors who need multi-GSTIN, multi-branch and affordable annual licensing.",
  },
  {
    id: "vyapar",
    name: "Vyapar",
    mono: "V",
    price: "from ₹3,600/year",
    rating: 4.1,
    why: "Best to start fast as a small trader or shop — invoice and file GST straight from your phone.",
  },
  {
    id: "marg",
    name: "Marg ERP 9+",
    mono: "M",
    price: "from ₹8,400/year",
    rating: 4.2,
    why: "Best for pharma, FMCG and distribution where batch, expiry and scheme tracking matter.",
  },
  {
    id: "odoo",
    name: "Odoo",
    mono: "O",
    price: "from ₹2,400/user/month",
    rating: 4.4,
    why: "Best for growing mid-market firms who want a modular ERP they can extend module by module.",
  },
  {
    id: "easync",
    name: "Easync Books",
    mono: "E",
    price: "from ₹14,999/year",
    rating: 3.4,
    why: "Best for cloud GST books with inventory and audit trail, especially when you need multi-entity or CA-firm workflows on higher plans.",
  },
];

export const SOFTWARE_BY_ID = Object.fromEntries(
  SOFTWARE.map((item) => [item.id, item]),
) as Record<SoftwareId, Software>;

export type SingleKey = "size" | "industry" | "budget";
export type AnswerKey = SingleKey | "must";

export type QuizOption = { value: string; label: string; hint: string };

export type QuizStep = {
  key: AnswerKey;
  title: string;
  question: string;
  hint?: string;
  multi: boolean;
  options: QuizOption[];
};

export const QUIZ_STEPS: QuizStep[] = [
  {
    key: "size",
    title: "Business size & turnover",
    question: "How big is your business?",
    multi: false,
    options: [
      { value: "sole", label: "Sole proprietor", hint: "Just me, turnover under ₹1 crore" },
      { value: "small", label: "Small team", hint: "1–10 staff, ₹1–5 crore" },
      { value: "growing", label: "Growing company", hint: "11–50 staff, ₹5–20 crore" },
      { value: "mid", label: "Mid-market", hint: "50+ staff, ₹20 crore+" },
    ],
  },
  {
    key: "industry",
    title: "Industry & GST structure",
    question: "What do you mainly do?",
    multi: false,
    options: [
      { value: "trading", label: "Trading & retail", hint: "Buy and sell goods, shops, e-commerce" },
      { value: "manufacturing", label: "Manufacturing", hint: "Production, BOM, job work" },
      { value: "services", label: "Services & consulting", hint: "Agencies, professional firms, IT" },
      { value: "distribution", label: "Distribution & wholesale", hint: "Dealers, stockists, batch/expiry goods" },
    ],
  },
  {
    key: "budget",
    title: "Budget & team seats",
    question: "What's your software budget?",
    multi: false,
    options: [
      { value: "low", label: "Keep it minimal", hint: "Under ₹5,000 per year" },
      { value: "mid", label: "Moderate", hint: "₹5,000–25,000 per year" },
      { value: "high", label: "Invest for growth", hint: "₹25,000+ per year" },
      { value: "unsure", label: "Not sure yet", hint: "Show me the value first" },
    ],
  },
  {
    key: "must",
    title: "Must-have features",
    question: "What must it do?",
    hint: "Pick everything that matters — select at least one.",
    multi: true,
    options: [
      { value: "gst", label: "GST & e-invoicing", hint: "GSTR filings, IRN, e-way bills" },
      { value: "inventory", label: "Inventory & batching", hint: "Stock, batch, expiry, godowns" },
      { value: "cloud", label: "Cloud & mobile access", hint: "Work from anywhere, multi-user" },
      { value: "payroll", label: "Payroll", hint: "Salary, PF, ESI, TDS on salary" },
      { value: "multibranch", label: "Multi-branch / multi-GSTIN", hint: "Consolidate several locations" },
      { value: "api", label: "API & integrations", hint: "Connect to other tools" },
    ],
  },
];

export type Answers = {
  size: string | null;
  industry: string | null;
  budget: string | null;
  must: string[];
};

export const EMPTY_ANSWERS: Answers = {
  size: null,
  industry: null,
  budget: null,
  must: [],
};

export type SearchKind = "cmp" | "post" | "upd" | "sw" | "tool";

export type SearchItem = {
  title: string;
  subtitle: string;
  group: string;
  href: string | null;
  kind: SearchKind;
};

export const SEARCH_INDEX: SearchItem[] = [
  { title: "Tally Prime vs Zoho Books", subtitle: "Comparison · flagship", group: "Comparisons", href: "/compare/tally-prime-vs-zoho-books", kind: "cmp" },
  { title: "Busy vs Marg ERP", subtitle: "Comparison · trading", group: "Comparisons", href: null, kind: "cmp" },
  { title: "QuickBooks India vs Vyapar", subtitle: "Comparison · small business", group: "Comparisons", href: null, kind: "cmp" },
  { title: "GSTR-2B reconciliation: Tally vs Zoho vs Busy", subtitle: "Deep-dive · GST · 12 min", group: "Blogs", href: "/blog/gstr-2b-reconciliation", kind: "post" },
  { title: "E-invoicing turnover threshold in 2026", subtitle: "Update · CBIC", group: "Finance updates", href: "/finance-updates", kind: "upd" },
  { title: "Software Directory", subtitle: "Browse verified business software", group: "Quick actions", href: "/software", kind: "tool" },
  { title: "Tally Prime", subtitle: "Accounting & GST · Offline desktop", group: "Software", href: "/software/tally-prime", kind: "sw" },
  { title: "Zoho Books", subtitle: "Cloud accounting · Bank feeds", group: "Software", href: "/software/zoho-books", kind: "sw" },
  { title: "Busy Accounting", subtitle: "Multi-GSTIN & branch distribution", group: "Software", href: "/software/busy-accounting", kind: "sw" },
  { title: "Vyapar", subtitle: "Mobile invoicing & retail billing", group: "Software", href: "/software/vyapar", kind: "sw" },
  { title: "Marg ERP 9+", subtitle: "Pharma & FMCG inventory ERP", group: "Software", href: "/software/marg-erp", kind: "sw" },
  { title: "Odoo", subtitle: "Modular ERP & CRM suite", group: "Software", href: "/software/odoo", kind: "sw" },
  { title: "Easync Books", subtitle: "Cloud GST, inventory & compliance", group: "Software", href: "/software/easync-books", kind: "sw" },
  { title: "Easync Books vs Zoho Books", subtitle: "Comparison · cloud GST", group: "Comparisons", href: "/compare/easync-books-vs-zoho-books", kind: "cmp" },
];

export const PRIMARY_NAV = [
  { href: "/software", label: "Software" },
  { href: "/compare", label: "Compare" },
  { href: "/blog", label: "Blogs" },
  { href: "/finance-updates", label: "Finance Updates" },
] as const;

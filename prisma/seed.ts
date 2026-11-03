import { PrismaClient, Role, PublishStatus, BillingCycle, FeatureDataType, ValueKind, ArticleType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;

async function main() {
  if (!seedAdminPassword) {
    throw new Error("SEED_ADMIN_PASSWORD must be set before running the database seed.");
  }

  console.log("🌱 Starting CompareWisely database seed...");

  // 1. Seed Default Admin User
  const adminPasswordHash = await bcrypt.hash(seedAdminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@comparewisely.com" },
    update: {},
    create: {
      email: "admin@comparewisely.com",
      passwordHash: adminPasswordHash,
      name: "CompareWisely Editorial Lead",
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log("✅ Seeded Admin User:", admin.email);

  // 2. Seed Software Categories
  const catAccounting = await prisma.category.upsert({
    where: { slug: "accounting-compliance" },
    update: {},
    create: {
      name: "Accounting & GST Compliance",
      slug: "accounting-compliance",
      description: "Desktop and cloud accounting software tailored for Indian GST, invoicing, and statutory returns.",
      displayOrder: 1,
    },
  });

  const catDistribution = await prisma.category.upsert({
    where: { slug: "distribution-trade-erp" },
    update: {},
    create: {
      name: "Distribution & Trade ERP",
      slug: "distribution-trade-erp",
      description: "Specialized inventory, batching, expiry, and wholesale supply chain accounting.",
      displayOrder: 2,
    },
  });

  const catCloudERP = await prisma.category.upsert({
    where: { slug: "cloud-business-erp" },
    update: {},
    create: {
      name: "Cloud Business ERP",
      slug: "cloud-business-erp",
      description: "Modern modular cloud suites integrating accounting, CRM, and automated banking.",
      displayOrder: 3,
    },
  });
  console.log("✅ Seeded Categories");

  // 3. Seed Software Products
  const productsData = [
    {
      slug: "tally-prime",
      name: "Tally Prime",
      mono: "T",
      tagline: "The golden standard for Indian on-premise accounting and audit.",
      description: "Best when you work offline, carry deep inventory or production, and want the standard your CA already knows.",
      categoryId: catAccounting.id,
      startingPrice: "from ₹22,500 one-time",
      priceAmount: 22500,
      billingCycle: BillingCycle.ONE_TIME,
      websiteUrl: "https://tallysolutions.com",
      trialUrl: "https://tallysolutions.com/download",
      targetBusinessSize: ["sole", "small", "growing"],
      targetIndustries: ["trading", "manufacturing"],
      pros: ["Offline first with zero latency", "Every Indian CA knows keyboard navigation", "Unmatched inventory batching & BOM"],
      cons: ["No native cloud without remote virtual desktop", "Mobile access is report-only", "Single-user Silver license limited to 1 PC"],
      verificationSourceUrl: "https://tallysolutions.com/pricing",
    },
    {
      slug: "zoho-books",
      name: "Zoho Books",
      mono: "Z",
      tagline: "India's premier cloud accounting suite with automated bank feeds.",
      description: "Best for cloud-first teams who want automation, bank feeds, mobile access and integrations.",
      categoryId: catCloudERP.id,
      startingPrice: "from ₹749/month",
      priceAmount: 749,
      billingCycle: BillingCycle.MONTHLY,
      websiteUrl: "https://www.zoho.com/in/books",
      trialUrl: "https://www.zoho.com/in/books/signup",
      targetBusinessSize: ["sole", "small", "growing", "mid"],
      targetIndustries: ["services", "trading"],
      pros: ["Direct ICICI/HDFC bank feeds", "Exceptional iOS & Android mobile apps", "Seamless GST filing & e-invoicing API integration"],
      cons: ["Requires steady high-speed internet", "High-tier plans needed for advanced inventory", "Heavy customization requires Zoho One"],
      verificationSourceUrl: "https://www.zoho.com/in/books/pricing",
    },
    {
      slug: "busy-accounting",
      name: "Busy Accounting",
      mono: "B",
      tagline: "Affordable desktop power with robust multi-branch and multi-GSTIN capability.",
      description: "Best value for distributors who need multi-GSTIN, multi-branch and affordable annual licensing.",
      categoryId: catDistribution.id,
      startingPrice: "from ₹7,200/year",
      priceAmount: 7200,
      billingCycle: BillingCycle.ANNUAL,
      websiteUrl: "https://busy.in",
      trialUrl: "https://busy.in/free-trial",
      targetBusinessSize: ["small", "growing"],
      targetIndustries: ["trading", "distribution"],
      pros: ["Exceptional multi-branch data synchronization", "Flexible invoice template customization", "Cost-effective multi-user pricing"],
      cons: ["Legacy desktop interface", "Mobile app features are limited", "Requires Windows OS"],
      verificationSourceUrl: "https://busy.in/pricing",
    },
    {
      slug: "vyapar",
      name: "Vyapar",
      mono: "V",
      tagline: "Mobile-first invoicing and billing for retail shops and micro-traders.",
      description: "Best to start fast as a small trader or shop — invoice and file GST straight from your phone.",
      categoryId: catAccounting.id,
      startingPrice: "from ₹3,600/year",
      priceAmount: 3600,
      billingCycle: BillingCycle.ANNUAL,
      websiteUrl: "https://vyaparapp.in",
      trialUrl: "https://vyaparapp.in/download",
      targetBusinessSize: ["sole", "small"],
      targetIndustries: ["trading"],
      pros: ["Dead simple mobile-first billing", "Thermal printer and barcode support", "Affordable for micro-enterprises"],
      cons: ["No complex manufacturing or job-work", "Limited bank reconciliation options", "Not designed for multi-branch consolidation"],
      verificationSourceUrl: "https://vyaparapp.in/pricing",
    },
    {
      slug: "marg-erp",
      name: "Marg ERP 9+",
      mono: "M",
      tagline: "The industry standard ERP for pharma stockists, FMCG, and retail distribution.",
      description: "Best for pharma, FMCG and distribution where batch, expiry and scheme tracking matter.",
      categoryId: catDistribution.id,
      startingPrice: "from ₹8,400/year",
      priceAmount: 8400,
      billingCycle: BillingCycle.ANNUAL,
      websiteUrl: "https://margerp.com",
      trialUrl: "https://margerp.com/free-demo.php",
      targetBusinessSize: ["small", "growing", "mid"],
      targetIndustries: ["distribution", "manufacturing"],
      pros: ["Unrivaled medicine batch, expiry, and drug-license controls", "Trade scheme & discount automation", "Integrated FMCG dispatch features"],
      cons: ["Steep learning curve for non-pharma businesses", "Traditional UI design", "Requires dedicated Windows server for scale"],
      verificationSourceUrl: "https://margerp.com/pricing.php",
    },
    {
      slug: "odoo",
      name: "Odoo",
      mono: "O",
      tagline: "Modular open-source ERP scaleable from billing to global supply chains.",
      description: "Best for growing mid-market firms who want a modular ERP they can extend module by module.",
      categoryId: catCloudERP.id,
      startingPrice: "from ₹2,400/user/month",
      priceAmount: 2400,
      billingCycle: BillingCycle.MONTHLY,
      websiteUrl: "https://www.odoo.com",
      trialUrl: "https://www.odoo.com/trial",
      targetBusinessSize: ["growing", "mid"],
      targetIndustries: ["services", "manufacturing", "distribution"],
      pros: ["Massive app ecosystem (CRM, MRP, HR, POS, eCommerce)", "Highly customizable open architecture", "Modern web & mobile interface"],
      cons: ["Implementation often requires specialized partner agency", "User seats scale costs rapidly", "Indian GST localization requires precise app setup"],
      verificationSourceUrl: "https://www.odoo.com/pricing",
    },
    {
      slug: "easync-books",
      name: "Easync Books",
      mono: "E",
      tagline: "Cloud accounting with GST filings, inventory, and audit trail for Indian businesses.",
      description:
        "Easync Books is a cloud platform for day-to-day sales and purchases, GST compliance, inventory, and financial reporting. Invoicing supports GST, TDS, and discounts; reports include P&L, balance sheet, cash flow, aging, and GST returns (GSTR-1, GSTR-3B). Higher tiers add multi-entity management, GSTR-2B reconciliation, and e-invoicing.",
      categoryId: catCloudERP.id,
      startingPrice: "from ₹14,999/year",
      priceAmount: 14999,
      billingCycle: BillingCycle.ANNUAL,
      websiteUrl: "https://www.easyncbooks.com/",
      trialUrl: "https://www.easyncbooks.com/pricing",
      targetBusinessSize: ["small", "growing"],
      targetIndustries: ["services", "trading", "distribution"],
      pros: [
        "GSTR-1 and GSTR-3B filing included on all paid plans",
        "Inventory, audit trail, and e-way bill on every listed plan",
        "CA Special plan supports up to 25 entities with GSTR-2B reconciliation",
      ],
      cons: [
        "Basic plan limited to 1 entity and 2 users",
        "GSTR-2B reconciliation and multiple GSTINs require CA Special or higher",
        "e-Invoice on Professional plan and above only",
      ],
      verificationSourceUrl: "https://www.easyncbooks.com/pricing",
    },
  ];

  const seededProducts: Record<string, number> = {};

  for (const item of productsData) {
    const prod = await prisma.softwareProduct.upsert({
      where: { slug: item.slug },
      update: {
        // Keep these fields current on re-runs without overwriting admin-managed fields.
        tagline: item.tagline,
        description: item.description,
        websiteUrl: item.websiteUrl,
        trialUrl: item.trialUrl,
        pros: item.pros,
        cons: item.cons,
        status: PublishStatus.PUBLISHED,
        verifiedAt: new Date(),
        verifiedById: admin.id,
      },
      create: {
        slug: item.slug,
        name: item.name,
        mono: item.mono,
        tagline: item.tagline,
        description: item.description,
        categoryId: item.categoryId,
        websiteUrl: item.websiteUrl,
        trialUrl: item.trialUrl,
        targetBusinessSize: item.targetBusinessSize,
        targetIndustries: item.targetIndustries,
        pros: item.pros,
        cons: item.cons,
        status: PublishStatus.PUBLISHED,
        verifiedAt: new Date(),
        verifiedById: admin.id,
      },
    });
    seededProducts[item.slug] = prod.id;
    // Idempotently ensure the starting-price plan exists (nested create inside upsert.create
    // is skipped when the software_product row already exists).
    const existingPlan = await prisma.pricingPlan.findFirst({
      where: { softwareId: prod.id, isStartingPrice: true },
    });
    if (!existingPlan) {
      await prisma.pricingPlan.create({
        data: {
          softwareId: prod.id,
          planName: "Standard Base Plan",
          displayPrice: item.startingPrice,
          priceAmount: item.priceAmount,
          billingCycle: item.billingCycle,
          currency: "INR",
          isStartingPrice: true,
          verificationSourceUrl: item.verificationSourceUrl,
          verifiedAt: new Date(),
        },
      });
    }
  }
  console.log("✅ Seeded 7 Software Products & Pricing Plans");

  // 4. Seed Feature Categories & Features
  const fCats = [
    { slug: "pricing", name: "Pricing & fit", order: 1 },
    { slug: "gst", name: "GST & compliance", order: 2 },
    { slug: "operations", name: "Operations", order: 3 },
    { slug: "platform", name: "Platform & access", order: 4 },
  ];

  const seededFCats: Record<string, number> = {};
  for (const fc of fCats) {
    const rec = await prisma.featureCategory.upsert({
      where: { slug: fc.slug },
      update: {},
      create: { slug: fc.slug, name: fc.name, displayOrder: fc.order },
    });
    seededFCats[fc.slug] = rec.id;
  }

  const features = [
    { code: "starting_price", cat: "pricing", name: "Starting price (indicative)", type: FeatureDataType.TEXT, order: 1, weight: 10 },
    { code: "best_when", cat: "pricing", name: "Best when", type: FeatureDataType.TEXT, order: 2, weight: 8 },
    { code: "gst_returns", cat: "gst", name: "GST returns & e-invoicing", type: FeatureDataType.BOOLEAN, order: 1, weight: 15 },
    { code: "gstr2b", cat: "gst", name: "GSTR-2B reconciliation support", type: FeatureDataType.BOOLEAN, order: 2, weight: 12 },
    { code: "multi_gstin", cat: "gst", name: "Multi-GSTIN / multi-branch", type: FeatureDataType.BOOLEAN, order: 3, weight: 10 },
    { code: "inventory", cat: "operations", name: "Inventory & batching", type: FeatureDataType.BOOLEAN, order: 1, weight: 14 },
    { code: "manufacturing", cat: "operations", name: "Manufacturing / BOM", type: FeatureDataType.BOOLEAN, order: 2, weight: 12 },
    { code: "payroll", cat: "operations", name: "Payroll (PF, ESI, TDS)", type: FeatureDataType.BOOLEAN, order: 3, weight: 8 },
    { code: "deployment", cat: "platform", name: "Primary deployment", type: FeatureDataType.TEXT, order: 1, weight: 9 },
    { code: "offline", cat: "platform", name: "Works offline on desktop", type: FeatureDataType.BOOLEAN, order: 2, weight: 10 },
    { code: "mobile", cat: "platform", name: "Mobile apps", type: FeatureDataType.BOOLEAN, order: 3, weight: 8 },
    { code: "api", cat: "platform", name: "API & integrations", type: FeatureDataType.BOOLEAN, order: 4, weight: 11 },
  ];

  const seededFeatures: Record<string, number> = {};
  for (const f of features) {
    const rec = await prisma.feature.upsert({
      where: { code: f.code },
      update: {},
      create: {
        code: f.code,
        categoryId: seededFCats[f.cat],
        name: f.name,
        dataType: f.type,
        displayOrder: f.order,
        defaultWeight: f.weight,
      },
    });
    seededFeatures[f.code] = rec.id;
  }
  console.log("✅ Seeded Feature Categories & Features");

  // 5. Seed Matrix Values
  const matrix: Record<string, Record<string, { kind: ValueKind; text?: string; bool?: boolean }>> = {
    "tally-prime": {
      starting_price: { kind: ValueKind.YES, text: "from ₹22,500 one-time" },
      best_when: { kind: ValueKind.YES, text: "Offline inventory, deep stock control, and the workflow most CAs already know." },
      gst_returns: { kind: ValueKind.YES, bool: true },
      gstr2b: { kind: ValueKind.YES, bool: true },
      multi_gstin: { kind: ValueKind.YES, bool: true },
      inventory: { kind: ValueKind.YES, bool: true },
      manufacturing: { kind: ValueKind.YES, bool: true },
      payroll: { kind: ValueKind.YES, bool: true },
      deployment: { kind: ValueKind.YES, text: "On-premise Windows (TallyPrime)" },
      offline: { kind: ValueKind.YES, bool: true },
      mobile: { kind: ValueKind.PARTIAL, bool: true },
      api: { kind: ValueKind.PARTIAL, bool: true },
    },
    "zoho-books": {
      starting_price: { kind: ValueKind.YES, text: "from ₹749/month" },
      best_when: { kind: ValueKind.YES, text: "Automated bank feeds, cloud collaboration, client portals and modern APIs." },
      gst_returns: { kind: ValueKind.YES, bool: true },
      gstr2b: { kind: ValueKind.YES, bool: true },
      multi_gstin: { kind: ValueKind.YES, bool: true },
      inventory: { kind: ValueKind.PARTIAL, bool: true },
      manufacturing: { kind: ValueKind.UNAVAILABLE, bool: false },
      payroll: { kind: ValueKind.PAID_ADDON, bool: true },
      deployment: { kind: ValueKind.YES, text: "Cloud SaaS (browser + native apps)" },
      offline: { kind: ValueKind.NO, bool: false },
      mobile: { kind: ValueKind.YES, bool: true },
      api: { kind: ValueKind.YES, bool: true },
    },
    "busy-accounting": {
      starting_price: { kind: ValueKind.YES, text: "from ₹7,200/year" },
      best_when: { kind: ValueKind.YES, text: "Trading and wholesale distribution with heavy multi-branch & multi-GSTIN needs." },
      gst_returns: { kind: ValueKind.YES, bool: true },
      gstr2b: { kind: ValueKind.YES, bool: true },
      multi_gstin: { kind: ValueKind.YES, bool: true },
      inventory: { kind: ValueKind.YES, bool: true },
      manufacturing: { kind: ValueKind.PARTIAL, bool: true },
      payroll: { kind: ValueKind.YES, bool: true },
      deployment: { kind: ValueKind.YES, text: "On-premise Windows with cloud sync" },
      offline: { kind: ValueKind.YES, bool: true },
      mobile: { kind: ValueKind.PARTIAL, bool: true },
      api: { kind: ValueKind.PARTIAL, bool: true },
    },
    "vyapar": {
      starting_price: { kind: ValueKind.YES, text: "from ₹3,600/year" },
      best_when: { kind: ValueKind.YES, text: "Retail shops, micro-traders, and small firms wanting effortless mobile invoicing." },
      gst_returns: { kind: ValueKind.YES, bool: true },
      gstr2b: { kind: ValueKind.PARTIAL, bool: true },
      multi_gstin: { kind: ValueKind.NO, bool: false },
      inventory: { kind: ValueKind.YES, bool: true },
      manufacturing: { kind: ValueKind.NO, bool: false },
      payroll: { kind: ValueKind.NO, bool: false },
      deployment: { kind: ValueKind.YES, text: "Mobile-first (Android/iOS) + Windows" },
      offline: { kind: ValueKind.YES, bool: true },
      mobile: { kind: ValueKind.YES, bool: true },
      api: { kind: ValueKind.NO, bool: false },
    },
    "marg-erp": {
      starting_price: { kind: ValueKind.YES, text: "from ₹8,400/year" },
      best_when: { kind: ValueKind.YES, text: "Pharma distribution, FMCG stockists, batch expiry, and trade discount schemes." },
      gst_returns: { kind: ValueKind.YES, bool: true },
      gstr2b: { kind: ValueKind.YES, bool: true },
      multi_gstin: { kind: ValueKind.YES, bool: true },
      inventory: { kind: ValueKind.YES, bool: true },
      manufacturing: { kind: ValueKind.PARTIAL, bool: true },
      payroll: { kind: ValueKind.YES, bool: true },
      deployment: { kind: ValueKind.YES, text: "On-premise Windows server" },
      offline: { kind: ValueKind.YES, bool: true },
      mobile: { kind: ValueKind.PARTIAL, bool: true },
      api: { kind: ValueKind.PARTIAL, bool: true },
    },
    "odoo": {
      starting_price: { kind: ValueKind.YES, text: "from ₹2,400/user/month" },
      best_when: { kind: ValueKind.YES, text: "Mid-market businesses needing a fully unified suite from CRM to MRP & accounting." },
      gst_returns: { kind: ValueKind.YES, bool: true },
      gstr2b: { kind: ValueKind.PARTIAL, bool: true },
      multi_gstin: { kind: ValueKind.YES, bool: true },
      inventory: { kind: ValueKind.YES, bool: true },
      manufacturing: { kind: ValueKind.YES, bool: true },
      payroll: { kind: ValueKind.YES, bool: true },
      deployment: { kind: ValueKind.YES, text: "Cloud (Odoo.sh) or On-Premise" },
      offline: { kind: ValueKind.PARTIAL, bool: false },
      mobile: { kind: ValueKind.YES, bool: true },
      api: { kind: ValueKind.YES, bool: true },
    },
    "easync-books": {
      starting_price: { kind: ValueKind.YES, text: "from ₹14,999/year" },
      best_when: {
        kind: ValueKind.YES,
        text: "Cloud GST books with inventory, audit trail, and multi-entity workflows for CAs and growing firms.",
      },
      gst_returns: { kind: ValueKind.YES, bool: true },
      gstr2b: {
        kind: ValueKind.PARTIAL,
        bool: true,
        text: "CA Special, Entity & Group plans",
      },
      multi_gstin: {
        kind: ValueKind.PARTIAL,
        bool: true,
        text: "Multiple GSTNs on CA Special plan and above",
      },
      inventory: { kind: ValueKind.YES, bool: true },
      manufacturing: { kind: ValueKind.UNKNOWN },
      payroll: { kind: ValueKind.NO, bool: false },
      deployment: { kind: ValueKind.YES, text: "Cloud SaaS (browser)" },
      offline: { kind: ValueKind.NO, bool: false },
      mobile: {
        kind: ValueKind.UNKNOWN,
        text: "Not documented on vendor website",
      },
      api: { kind: ValueKind.UNKNOWN },
    },
  };

  for (const [pSlug, featuresMap] of Object.entries(matrix)) {
    const sId = seededProducts[pSlug];
    if (!sId) continue;

    for (const [fCode, val] of Object.entries(featuresMap)) {
      const fId = seededFeatures[fCode];
      if (!fId) continue;

      await prisma.productFeatureValue.upsert({
        where: {
          softwareId_featureId: {
            softwareId: sId,
            featureId: fId,
          },
        },
        update: {
          valueKind: val.kind,
          textValue: val.text ?? null,
          booleanValue: val.bool ?? null,
          verifiedAt: new Date(),
        },
        create: {
          softwareId: sId,
          featureId: fId,
          valueKind: val.kind,
          textValue: val.text,
          booleanValue: val.bool,
          verifiedAt: new Date(),
        },
      });
    }
  }
  console.log("✅ Seeded Full Feature Matrix");

  // 6. Seed Curated Comparison Page
  const tallyId = seededProducts["tally-prime"];
  const zohoId = seededProducts["zoho-books"];

  const comparison = await prisma.comparisonPage.upsert({
    where: { slug: "tally-prime-vs-zoho-books" },
    update: {
      isPublished: true,
    },
    create: {
      slug: "tally-prime-vs-zoho-books",
      title: "Tally Prime vs Zoho Books",
      metaTitle: "Tally Prime vs Zoho Books (2026 Comparison) — CompareWisely",
      metaDescription: "Detailed technical comparison of Tally Prime and Zoho Books for Indian businesses. Compare GST filing, offline vs cloud, bank feeds, and pricing.",
      verdictSummary: "Choose Tally Prime if your operations rely on an offline desktop workstation, complex multi-godown stock, and your Chartered Accountant prefers keyboard shortcuts. Choose Zoho Books if your team needs remote cloud access, automated bank reconciliation with Indian banks, and effortless mobile billing.",
      isPublished: true,
      publishedAt: new Date(),
    },
  });
  // Idempotently ensure comparison-product relationships exist (upsert.create skips nested
  // creates if the page row already existed — so we always upsert them explicitly).
  await prisma.comparisonProduct.upsert({
    where: { comparisonPageId_softwareId: { comparisonPageId: comparison.id, softwareId: tallyId } },
    update: { displayOrder: 1 },
    create: { comparisonPageId: comparison.id, softwareId: tallyId, displayOrder: 1 },
  });
  await prisma.comparisonProduct.upsert({
    where: { comparisonPageId_softwareId: { comparisonPageId: comparison.id, softwareId: zohoId } },
    update: { displayOrder: 2 },
    create: { comparisonPageId: comparison.id, softwareId: zohoId, displayOrder: 2 },
  });
  console.log("✅ Seeded Comparison Page:", comparison.slug);

  const easyncId = seededProducts["easync-books"];
  const easyncVsZoho = await prisma.comparisonPage.upsert({
    where: { slug: "easync-books-vs-zoho-books" },
    update: {
      isPublished: true,
    },
    create: {
      slug: "easync-books-vs-zoho-books",
      title: "Easync Books vs Zoho Books",
      metaTitle: "Easync Books vs Zoho Books (2026 Comparison) — CompareWisely",
      metaDescription:
        "Compare Easync Books and Zoho Books for Indian GST filing, inventory, multi-entity CA workflows, e-invoicing, and cloud accounting pricing.",
      verdictSummary:
        "Choose Easync Books if you want India-first cloud books with GST returns included on every paid plan and CA-oriented multi-entity tiers with GSTR-2B reconciliation. Choose Zoho Books if automated bank feeds, a broader integration ecosystem, and mature mobile apps matter more than multi-client entity packaging.",
      isPublished: true,
      publishedAt: new Date(),
    },
  });
  // Idempotently ensure comparison-product relationships exist.
  await prisma.comparisonProduct.upsert({
    where: { comparisonPageId_softwareId: { comparisonPageId: easyncVsZoho.id, softwareId: easyncId } },
    update: { displayOrder: 1 },
    create: { comparisonPageId: easyncVsZoho.id, softwareId: easyncId, displayOrder: 1 },
  });
  await prisma.comparisonProduct.upsert({
    where: { comparisonPageId_softwareId: { comparisonPageId: easyncVsZoho.id, softwareId: zohoId } },
    update: { displayOrder: 2 },
    create: { comparisonPageId: easyncVsZoho.id, softwareId: zohoId, displayOrder: 2 },
  });
  console.log("✅ Seeded Comparison Page:", easyncVsZoho.slug);

  // 7. Seed Editorial Article
  const article = await prisma.article.upsert({
    where: { slug: "gstr-2b-reconciliation" },
    update: {},
    create: {
      articleType: ArticleType.BLOG,
      slug: "gstr-2b-reconciliation",
      title: "GSTR-2B reconciliation: Tally vs Zoho vs Busy",
      excerpt: "How Tally, Zoho and Busy treat purchase reconciliation when 2B and your books disagree.",
      content: `## The GSTR-2B Reconciliation Challenge\n\nUnder Indian GST rules, claiming Input Tax Credit (ITC) requires continuous matching between purchase invoices entered in books and the GSTR-2B auto-generated by the GST portal...\n\n### How Software Handles Discrepancies\n\n1. **Zoho Books**: Connects directly via GSTN API to pull live GSTR-2B...\n2. **Tally Prime**: Generates JSON files and matches invoices locally with high accuracy...\n3. **Busy Accounting**: Provides granular multi-GSTIN reconciliation tables...\n`,
      categoryId: catAccounting.id,
      authorId: admin.id,
      isPublished: true,
      publishedAt: new Date(),
    },
  });
  // Idempotently ensure article tags exist (nested create inside upsert.create is skipped
  // when the article row already exists).
  for (const tagName of ["GST", "Reconciliation", "Compliance"]) {
    await prisma.articleTag.upsert({
      where: { articleId_tagName: { articleId: article.id, tagName } },
      update: {},
      create: { articleId: article.id, tagName },
    });
  }
  console.log("✅ Seeded Editorial Article");

  console.log("🎉 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

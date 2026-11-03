import { prisma } from "@/lib/db";
import type { RecommendationAnswersInput } from "@/lib/validations/recommendation";
import type {
  RecommendationAlternative,
  RecommendationMatch,
  RequirementAuditItem,
  RequirementStatus,
} from "@/lib/types/recommendation";
import type { Prisma } from "@prisma/client";
import { ValueKind } from "@prisma/client";

type ProductWithFeatures = Prisma.SoftwareProductGetPayload<{
  include: {
    category: true;
    pricingPlans: true;
    featureValues: {
      include: { feature: true };
    };
  };
}>;

interface ScoredSoftware {
  product: ProductWithFeatures;
  score: number;
  matchReasons: string[];
  tradeOffs: string[];
  requirementsAudit: RequirementAuditItem[];
  differentiatingFactor: string;
}

/**
 * Evaluates software fit against 6-dimension user constraints using
 * transparent weighted scoring and verified product capabilities.
 */
export async function calculateRecommendation(
  answers: RecommendationAnswersInput
): Promise<RecommendationMatch> {
  const products = await prisma.softwareProduct.findMany({
    where: { status: "PUBLISHED" },
    include: {
      category: true,
      pricingPlans: {
        where: { isStartingPrice: true },
        take: 1,
      },
      featureValues: {
        include: {
          feature: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (products.length === 0) {
    throw new Error("No published software products available for recommendation.");
  }

  const scoredList: ScoredSoftware[] = products.map((product) => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    const matchReasons: string[] = [];
    const tradeOffs: string[] = [];
    const requirementsAudit: RequirementAuditItem[] = [];

    // Helper to add weighted dimension
    function addDimension(weight: number, score: number) {
      totalWeight += weight;
      totalWeightedScore += weight * Math.max(0, Math.min(1, score));
    }

    const targetSizes = (product.targetBusinessSize as string[]) || [];
    const targetIndustries = (product.targetIndustries as string[]) || [];
    const pros = (product.pros as string[]) || [];
    const cons = (product.cons as string[]) || [];

    // Feature lookup map: code -> ProductFeatureValue
    const featureMap = new Map<string, (typeof product.featureValues)[0]>();
    product.featureValues.forEach((fv) => {
      featureMap.set(fv.feature.code, fv);
    });

    // 1. Business Size & Scale (Weight: 14)
    if (targetSizes.includes(answers.businessSize)) {
      addDimension(14, 1.0);
      matchReasons.push(`Engineered specifically for ${answers.businessSize} business size & workflow.`);
    } else {
      // Adjacent compatibility check
      const sizeOrder = ["sole", "small", "growing", "mid"];
      const userIdx = sizeOrder.indexOf(answers.businessSize);
      const minDistance = Math.min(
        ...targetSizes.map((s) => Math.abs(sizeOrder.indexOf(s) - userIdx))
      );
      if (minDistance === 1) {
        addDimension(14, 0.65);
      } else {
        addDimension(14, 0.25);
        tradeOffs.push(`Primarily targets ${targetSizes.join(", ")} operations rather than ${answers.businessSize}.`);
      }
    }

    // 2. Industry Fit (Weight: 15)
    if (targetIndustries.includes(answers.industry)) {
      addDimension(15, 1.0);
      matchReasons.push(`Built-in domain workflows optimized for ${answers.industry} operations.`);
    } else {
      addDimension(15, 0.45);
      tradeOffs.push(`Not specifically specialized for ${answers.industry}; may require custom ledger workflows.`);
    }

    // 3. Budget Alignment (Weight: 12)
    const startingPlan = product.pricingPlans[0];
    const startingPriceVal = Number(startingPlan?.priceAmount || 0);
    if (answers.budget === "low") {
      if (startingPriceVal <= 6000) {
        addDimension(12, 1.0);
        matchReasons.push("Economical pricing fits well within modest software budgets.");
      } else if (startingPriceVal <= 15000) {
        addDimension(12, 0.55);
      } else {
        addDimension(12, 0.2);
        tradeOffs.push(`Starting investment (${startingPlan?.displayPrice || "standard tier"}) may exceed low budget.`);
      }
    } else if (answers.budget === "mid") {
      if (startingPriceVal <= 25000) {
        addDimension(12, 1.0);
        matchReasons.push("Pricing aligns with typical mid-tier software budgets.");
      } else {
        addDimension(12, 0.6);
      }
    } else if (answers.budget === "high") {
      addDimension(12, 1.0);
    } else {
      addDimension(12, 0.85); // Unsure
    }

    // 4. User Seats (Weight: 10)
    if (answers.userSeats === "single") {
      if (product.slug === "vyapar" || product.slug === "tally-prime") {
        addDimension(10, 1.0);
        matchReasons.push("Offers dedicated, cost-effective single-user desktop/mobile licensing.");
      } else {
        addDimension(10, 0.85);
      }
    } else {
      if (product.slug === "vyapar") {
        addDimension(10, 0.35);
        tradeOffs.push("Collaborative multi-user synchronization is limited compared to client-server platforms.");
      } else if (
        product.slug === "zoho-books" ||
        product.slug === "busy-accounting" ||
        product.slug === "odoo" ||
        product.slug === "easync-books"
      ) {
        addDimension(10, 1.0);
        matchReasons.push(`Proven multi-user role management for ${answers.userSeats.replace("_", " ")} users.`);
      } else {
        addDimension(10, 0.75);
      }
    }

    // 5. Monthly Invoicing & Transaction Volume (Weight: 11)
    if (answers.monthlyInvoiceVolume === "1000_plus") {
      if (product.slug === "tally-prime" || product.slug === "busy-accounting" || product.slug === "marg-erp-9-plus") {
        addDimension(11, 1.0);
        matchReasons.push("High-throughput database engine effortlessly handles 1,000+ monthly invoices without lag.");
      } else if (product.slug === "vyapar") {
        addDimension(11, 0.2);
        tradeOffs.push("Not recommended for 1,000+ invoices/month; heavy ledger databases can slow mobile sync.");
      } else {
        addDimension(11, 0.8);
      }
    } else if (answers.monthlyInvoiceVolume === "100_to_1000") {
      if (product.slug === "vyapar") addDimension(11, 0.7);
      else addDimension(11, 1.0);
    } else {
      addDimension(11, 1.0);
    }

    // 6. Banking Complexity (Weight: 8)
    if (answers.bankAccountsCount === "multiple") {
      if (product.slug === "zoho-books") {
        addDimension(8, 1.0);
        matchReasons.push("Direct automated bank feeds with major Indian banks streamline multi-account reconciliation.");
      } else if (product.slug === "tally-prime" || product.slug === "busy-accounting") {
        addDimension(8, 0.75);
        tradeOffs.push("Bank reconciliation requires manual e-statement file import rather than continuous live API feeds.");
      } else {
        addDimension(8, 0.6);
      }
    } else {
      addDimension(8, 0.95);
    }

    // 7. Must-Have Features Audit (Weight: 12 each)
    answers.mustHaveFeatures.forEach((reqKey) => {
      let featureCode = "";
      let featureLabel = "";

      switch (reqKey) {
        case "gst":
          featureCode = "gst_returns";
          featureLabel = "GST Returns & E-Invoicing";
          break;
        case "inventory":
          featureCode = "inventory";
          featureLabel = "Inventory & Batch Tracking";
          break;
        case "cloud":
          featureCode = "deployment";
          featureLabel = "Cloud & Remote Access";
          break;
        case "payroll":
          featureCode = "payroll";
          featureLabel = "Payroll & Statutory Compliance";
          break;
        case "multibranch":
          featureCode = "multi_gstin";
          featureLabel = "Multi-GSTIN / Multi-Branch";
          break;
        case "api":
          featureCode = "api";
          featureLabel = "API & External Integrations";
          break;
        case "offline":
          featureCode = "offline";
          featureLabel = "Offline Desktop Operations";
          break;
        case "bank_feeds":
          featureCode = "gst_returns"; // Handled specifically below
          featureLabel = "Automated Bank Feeds";
          break;
      }

      const fv = featureMap.get(featureCode);
      let status: RequirementStatus = "NOT_MET";
      let note = "";
      let featureScore = 0.0;

      if (reqKey === "bank_feeds") {
        if (product.slug === "zoho-books") {
          status = "MET";
          note = "Direct automated API feeds with Indian banks.";
          featureScore = 1.0;
        } else {
          status = "PARTIAL";
          note = "Manual Excel/CSV statement import only.";
          featureScore = 0.45;
        }
      } else if (reqKey === "cloud") {
        if (product.slug === "zoho-books" || product.slug === "odoo" || product.slug === "easync-books") {
          status = "MET";
          note = "100% native cloud SaaS accessible from any browser.";
          featureScore = 1.0;
        } else if (product.slug === "vyapar") {
          status = "PARTIAL";
          note = "Mobile & desktop sync via Vyapar cloud.";
          featureScore = 0.75;
        } else {
          status = "NOT_MET";
          note = "On-premise desktop; requires third-party RDP/cloud hosting for remote access.";
          featureScore = 0.15;
        }
      } else if (fv) {
        const featureNote = fv.note || fv.textValue || "";
        if (fv.valueKind === ValueKind.YES) {
          status = "MET";
          note = featureNote || "Fully supported natively.";
          featureScore = 1.0;
        } else if (fv.valueKind === ValueKind.PARTIAL) {
          status = "PARTIAL";
          note = featureNote || "Partially supported with configuration limitations.";
          featureScore = 0.5;
        } else if (fv.valueKind === ValueKind.PAID_ADDON) {
          status = "PAID_ADDON";
          note = featureNote || "Requires additional paid module or higher tier.";
          featureScore = 0.65;
        } else {
          status = "NOT_MET";
          note = featureNote || "Not supported.";
          featureScore = 0.0;
        }
      } else {
        status = "UNKNOWN";
        note = "Capability unverified with vendor.";
        featureScore = 0.3;
      }

      // Add to requirement audit
      requirementsAudit.push({
        featureKey: reqKey,
        featureName: featureLabel || reqKey,
        status,
        note,
      });

      addDimension(12, featureScore);
    });

    // Add 1-2 product cons to trade-offs if not already mentioned
    cons.slice(0, 2).forEach((c) => {
      if (!tradeOffs.includes(c)) tradeOffs.push(c);
    });

    // Differentiating factor for alternatives
    const differentiatingFactor =
      pros[0] || product.tagline || "Proven business platform.";

    const finalScore = Math.round((totalWeightedScore / totalWeight) * 100);

    return {
      product,
      score: finalScore,
      matchReasons: matchReasons.slice(0, 4),
      tradeOffs: tradeOffs.slice(0, 3),
      requirementsAudit,
      differentiatingFactor,
    };
  });

  // Sort descending by score
  scoredList.sort((a, b) => b.score - a.score);

  const winner = scoredList[0];
  const runnersUpList = scoredList.slice(1, 3);

  let matchLevel: RecommendationMatch["matchLevel"] = "Moderate Match";
  if (winner.score >= 90) matchLevel = "Exceptional Match";
  else if (winner.score >= 75) matchLevel = "Strong Match";
  else if (winner.score >= 60) matchLevel = "Moderate Match";
  else matchLevel = "Low Match";

  const runnersUp: RecommendationAlternative[] = runnersUpList.map((ru) => ({
    softwareId: ru.product.id,
    softwareSlug: ru.product.slug,
    softwareName: ru.product.name,
    mono: ru.product.mono,
    score: ru.score,
    startingPrice: ru.product.pricingPlans[0]?.displayPrice || null,
    differentiatingFactor: ru.differentiatingFactor,
  }));

  return {
    softwareId: winner.product.id,
    softwareSlug: winner.product.slug,
    softwareName: winner.product.name,
    mono: winner.product.mono,
    tagline: winner.product.tagline,
    overallFitScore: winner.score,
    matchLevel,
    startingPrice: winner.product.pricingPlans[0]?.displayPrice || null,
    verifiedDate: winner.product.verifiedAt
      ? new Date(winner.product.verifiedAt).toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        })
      : null,
    websiteUrl: winner.product.websiteUrl,
    trialUrl: winner.product.trialUrl,
    matchReasons: winner.matchReasons,
    tradeOffs: winner.tradeOffs,
    requirementsAudit: winner.requirementsAudit,
    runnersUp,
  };
}

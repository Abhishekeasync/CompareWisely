import { prisma } from "@/lib/db";
import type { ValueKind } from "@prisma/client";

// Re-export shared types so server-side code can still import from here
export type {
  DynamicMatrixColumn,
  DynamicMatrixCell,
  DynamicMatrixFeature,
  DynamicMatrixCategory,
  DynamicMatrixData,
} from "@/lib/types/comparison";

import type {
  DynamicMatrixColumn,
  DynamicMatrixCell,
  DynamicMatrixFeature,
  DynamicMatrixCategory,
  DynamicMatrixData,
} from "@/lib/types/comparison";

// Mapping legacy short IDs to database slugs
const SLUG_ALIASES: Record<string, string> = {
  tally: "tally-prime",
  zoho: "zoho-books",
  busy: "busy-accounting",
  vyapar: "vyapar",
  marg: "marg-erp",
  odoo: "odoo",
  easync: "easync-books",
};

export function resolveSlug(slugOrAlias: string): string {
  const clean = slugOrAlias.trim().toLowerCase();
  return SLUG_ALIASES[clean] || clean;
}

function cellEquivalenceKey(cell: DynamicMatrixCell | undefined): string {
  if (!cell) return "missing";
  if (cell.valueKind === "UNAVAILABLE" || cell.valueKind === "NO") return "no";
  if (cell.valueKind === "YES") {
    if (cell.textValue) return `text:${cell.textValue.trim().toLowerCase()}`;
    return "yes";
  }
  if (cell.valueKind === "PARTIAL") return "partial";
  if (cell.valueKind === "PAID_ADDON") return "addon";
  if (cell.textValue) return `text:${cell.textValue.trim().toLowerCase()}`;
  return "unknown";
}

export async function getComparisonMatrix(slugsOrAliases: string[]): Promise<DynamicMatrixData> {
  const slugs = Array.from(new Set(slugsOrAliases.map(resolveSlug))).slice(0, 4);

  if (slugs.length === 0) {
    return { columns: [], categories: [], totalFeatures: 0 };
  }

  // 1. Fetch matching software products
  const products = await prisma.softwareProduct.findMany({
    where: {
      slug: { in: slugs },
      status: "PUBLISHED",
    },
    include: {
      pricingPlans: {
        where: { isStartingPrice: true },
        take: 1,
      },
    },
  });

  // Preserve requested order
  const orderedProducts = slugs
    .map((s) => products.find((p) => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  const productIds = orderedProducts.map((p) => p.id);

  // 2. Fetch all feature categories and features
  const featureCategories = await prisma.featureCategory.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      features: {
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  // 3. Fetch product feature values for these products
  const featureValues = await prisma.productFeatureValue.findMany({
    where: {
      softwareId: { in: productIds },
    },
  });

  const valuesMap = new Map<string, DynamicMatrixCell>();
  for (const fv of featureValues) {
    valuesMap.set(`${fv.softwareId}_${fv.featureId}`, {
      valueKind: fv.valueKind,
      textValue: fv.textValue,
      booleanValue: fv.booleanValue,
      note: fv.note,
    });
  }

  // 4. Build columns
  const columns: DynamicMatrixColumn[] = orderedProducts.map((p) => {
    const startingPlan = p.pricingPlans[0];
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      mono: p.mono,
      tagline: p.tagline,
      startingPrice: startingPlan?.displayPrice || "Contact vendor",
      websiteUrl: p.websiteUrl,
      trialUrl: p.trialUrl,
      verifiedAt: p.verifiedAt,
    };
  });

  let totalFeaturesCount = 0;

  // A checkpoint belongs to the products that have a saved value. Show it only
  // when at least one product in this comparison has that value, so a
  // checkpoint added on Busy does not appear in Tally vs Zoho.
  const categories: DynamicMatrixCategory[] = [];

  for (const fc of featureCategories) {
    const features: DynamicMatrixFeature[] = [];

    for (const feat of fc.features) {
      const values: Record<string, DynamicMatrixCell> = {};
      const equivalenceKeys: string[] = [];
      let included = false;

      for (const prod of orderedProducts) {
        const stored = valuesMap.get(`${prod.id}_${feat.id}`);
        if (stored) included = true;
        const cell = stored || {
          valueKind: "UNKNOWN",
          textValue: null,
          booleanValue: null,
          note: null,
        };
        values[prod.slug] = cell;
        equivalenceKeys.push(cellEquivalenceKey(cell));
      }

      if (!included) continue;

      totalFeaturesCount++;
      const isDifferent = orderedProducts.length > 1 && new Set(equivalenceKeys).size > 1;

      features.push({
        id: feat.id,
        code: feat.code,
        name: feat.name,
        description: feat.description,
        dataType: feat.dataType,
        isDifferent,
        values,
      });
    }

    if (features.length === 0) continue;

    categories.push({
      id: fc.id,
      slug: fc.slug,
      name: fc.name,
      displayOrder: fc.displayOrder,
      features,
    });
  }

  return {
    columns,
    categories,
    totalFeatures: totalFeaturesCount,
  };
}

export async function getCuratedComparison(slug: string) {
  const comparison = await prisma.comparisonPage.findUnique({
    where: { slug, isPublished: true },
    include: {
      comparisonProducts: {
        include: {
          software: true,
        },
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  if (!comparison) return null;

  const slugs = comparison.comparisonProducts.map((cp) => cp.software.slug);
  const matrix = await getComparisonMatrix(slugs);

  return {
    page: comparison,
    matrix,
  };
}

export async function getAllCuratedComparisonSlugs() {
  const comparisons = await prisma.comparisonPage.findMany({
    where: { isPublished: true },
    select: { slug: true },
  });
  return comparisons.map((c) => c.slug);
}

import { prisma } from "@/lib/db";
import type { Prisma, PublishStatus } from "@prisma/client";

export interface SoftwareFilterOptions {
  categorySlug?: string;
  businessSize?: string;
  search?: string;
  status?: PublishStatus;
}

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

export async function getSoftwareProducts(options: SoftwareFilterOptions = {}) {
  const { categorySlug, businessSize, search, status = "PUBLISHED" } = options;

  const where: Prisma.SoftwareProductWhereInput = {
    status,
  };

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (search && search.trim() !== "") {
    const term = search.trim();
    where.OR = [
      { name: { contains: term } },
      { tagline: { contains: term } },
      { description: { contains: term } },
    ];
  }

  const products = await prisma.softwareProduct.findMany({
    where,
    orderBy: { id: "asc" },
    include: {
      category: true,
      pricingPlans: {
        orderBy: [{ isStartingPrice: "desc" }, { priceAmount: "asc" }],
      },
      verifiedBy: {
        select: { name: true },
      },
    },
  });

  // In-memory filter for JSON business size if provided
  if (businessSize) {
    return products.filter((p) => {
      if (!p.targetBusinessSize || !Array.isArray(p.targetBusinessSize)) return true;
      return (p.targetBusinessSize as string[]).includes(businessSize);
    });
  }

  return products;
}

export async function getSoftwareBySlug(slug: string) {
  return prisma.softwareProduct.findUnique({
    where: { slug },
    include: {
      category: true,
      pricingPlans: {
        orderBy: [{ isStartingPrice: "desc" }, { priceAmount: "asc" }],
      },
      pricingHistories: {
        orderBy: { recordedAt: "desc" },
        take: 5,
      },
      featureValues: {
        include: {
          feature: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          feature: {
            displayOrder: "asc",
          },
        },
      },
      verifiedBy: {
        select: { name: true },
      },
    },
  });
}

export async function getAllSoftwareSlugs() {
  const products = await prisma.softwareProduct.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return products.map((p) => p.slug);
}

/** Lightweight peers for detail-page compare shortcuts (avoids loading the full catalog). */
export async function getSoftwarePeers(excludeSlug: string, categoryId: number, limit = 3) {
  return prisma.softwareProduct.findMany({
    where: {
      status: "PUBLISHED",
      slug: { not: excludeSlug },
      categoryId,
    },
    orderBy: { id: "asc" },
    take: limit,
    select: { id: true, slug: true, name: true },
  });
}

/** Returns all software products for admin product-pickers (not filtered by status) */
export async function getAllSoftwareForAdmin() {
  return prisma.softwareProduct.findMany({
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    select: { id: true, name: true, slug: true, status: true },
  });
}


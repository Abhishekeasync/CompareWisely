import { prisma } from "../db";
import { serializeForClient } from "../serialize-for-client";
import { CommentStatus } from "@prisma/client";

export async function getAdminDashboardStats() {
  const [
    totalSoftware,
    totalCategories,
    totalComparisons,
    pendingCommentsCount,
    totalSubscribers,
    stalePricingCount,
  ] = await Promise.all([
    prisma.softwareProduct.count(),
    prisma.category.count(),
    prisma.comparisonPage.count(),
    prisma.comment.count({ where: { status: CommentStatus.PENDING } }),
    prisma.newsletterSubscriber.count(),
    prisma.pricingPlan.count({
      where: {
        OR: [
          { verifiedAt: null },
          { verifiedAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        ],
      },
    }),
  ]);

  return {
    totalSoftware,
    totalCategories,
    totalComparisons,
    pendingCommentsCount,
    totalSubscribers,
    stalePricingCount,
  };
}

export async function getAllSoftwareForAdmin() {
  const rows = await prisma.softwareProduct.findMany({
    include: {
      category: true,
      pricingPlans: {
        orderBy: { isStartingPrice: "desc" },
      },
      verifiedBy: {
        select: { id: true, name: true, email: true },
      },
      featureValues: {
        include: {
          feature: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { feature: { displayOrder: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  });

  return serializeForClient(rows);
}

export interface VerifyPricingInput {
  softwareId: number;
  planId?: number;
  newPrice?: string;
  sourceUrl: string;
  userId: number;
}

export async function markPricingVerified(input: VerifyPricingInput) {
  const { softwareId, planId, newPrice, sourceUrl, userId } = input;

  const software = await prisma.softwareProduct.findUnique({
    where: { id: softwareId },
    include: { pricingPlans: true },
  });

  if (!software) {
    throw new Error("Software product not found.");
  }

  const now = new Date();

  // If a specific plan is being updated
  if (planId && newPrice) {
    const plan = software.pricingPlans.find((p) => p.id === planId);
    if (plan) {
      const oldPrice = plan.displayPrice || "N/A";
      await prisma.$transaction([
        prisma.pricingPlan.update({
          where: { id: planId },
          data: {
            displayPrice: newPrice,
            verificationSourceUrl: sourceUrl,
            verifiedAt: now,
          },
        }),
        prisma.pricingHistory.create({
          data: {
            softwareId,
            planName: plan.planName,
            oldPrice,
            newPrice,
            sourceUrl,
            changedById: userId,
            recordedAt: now,
          },
        }),
        prisma.softwareProduct.update({
          where: { id: softwareId },
          data: {
            verifiedAt: now,
            verifiedById: userId,
          },
        }),
        prisma.auditLog.create({
          data: {
            userId,
            action: "VERIFY_PRICING",
            entityName: "PricingPlan",
            entityId: planId,
            changes: {
              software: software.name,
              plan: plan.planName,
              oldPrice,
              newPrice,
              sourceUrl,
            },
          },
        }),
      ]);

      return { success: true };
    }
  }

  // Update software verified timestamp
  await prisma.$transaction([
    prisma.softwareProduct.update({
      where: { id: softwareId },
      data: {
        verifiedAt: now,
        verifiedById: userId,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId,
        action: "VERIFY_SOFTWARE",
        entityName: "SoftwareProduct",
        entityId: softwareId,
        changes: {
          software: software.name,
          sourceUrl,
        },
      },
    }),
  ]);

  return { success: true };
}

export async function getCommentsForAdmin(status?: CommentStatus) {
  return prisma.comment.findMany({
    where: status ? { status } : undefined,
    include: {
      article: {
        select: { id: true, title: true, slug: true },
      },
      moderatedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function moderateComment(
  commentId: number,
  status: CommentStatus,
  userId: number
) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { article: true },
  });

  if (!comment) {
    throw new Error("Comment not found.");
  }

  const updated = await prisma.$transaction([
    prisma.comment.update({
      where: { id: commentId },
      data: {
        status,
        moderatedById: userId,
        moderatedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId,
        action: `COMMENT_${status}`,
        entityName: "Comment",
        entityId: commentId,
        changes: {
          article: comment.article.title,
          authorName: comment.authorName,
          status,
        },
      },
    }),
  ]);

  return updated[0];
}

export async function getAuditLogs(limit = 50) {
  return prisma.auditLog.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getAdminComparisons() {
  return prisma.comparisonPage.findMany({
    include: {
      comparisonProducts: {
        include: {
          software: {
            select: { id: true, name: true, slug: true, mono: true },
          },
        },
        orderBy: { displayOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const comparisons = await prisma.comparisonPage.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        comparisonProducts: {
          orderBy: { displayOrder: "asc" },
          include: {
            software: {
              select: {
                slug: true,
                name: true,
                mono: true,
              },
            },
          },
        },
      },
    });

    const data = comparisons.map((comp) => ({
      slug: comp.slug,
      title: comp.title,
      verdictSummary: comp.verdictSummary,
      products: comp.comparisonProducts.map((cp) => ({
        slug: cp.software.slug,
        name: cp.software.name,
        mono: cp.software.mono,
      })),
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("API /api/v1/compare/popular error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve popular comparisons.",
        },
      },
      { status: 500 },
    );
  }
}

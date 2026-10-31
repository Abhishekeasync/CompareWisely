import { NextRequest, NextResponse } from "next/server";
import { getCuratedComparison } from "@/lib/services/comparison.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const comparison = await getCuratedComparison(slug);

    if (!comparison) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Comparison page '${slug}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error("API /api/v1/compare/[slug] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve comparison page.",
        },
      },
      { status: 500 }
    );
  }
}

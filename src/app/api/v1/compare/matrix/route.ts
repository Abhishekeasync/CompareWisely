import { connection } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { getComparisonMatrix } from "@/lib/services/comparison.service";

export async function GET(request: NextRequest) {
  await connection();
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids") || searchParams.get("products");

    if (!idsParam) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PARAM",
            message: "Please provide 'ids' query parameter (e.g., ?ids=tally-prime,zoho-books).",
          },
        },
        { status: 400 }
      );
    }

    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (ids.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_PRODUCTS",
            message: "Comparison requires at least 2 products.",
          },
        },
        { status: 400 }
      );
    }

    const matrix = await getComparisonMatrix(ids);

    return NextResponse.json({
      success: true,
      data: matrix,
    });
  } catch (error) {
    console.error("API /api/v1/compare/matrix error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to generate comparison matrix.",
        },
      },
      { status: 500 }
    );
  }
}

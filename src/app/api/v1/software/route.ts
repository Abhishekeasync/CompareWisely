import { connection } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { getSoftwareProducts } from "@/lib/services/software.service";

export async function GET(request: NextRequest) {
  await connection();
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category") || undefined;
    const businessSize = searchParams.get("size") || undefined;
    const search = searchParams.get("search") || undefined;

    const products = await getSoftwareProducts({
      categorySlug,
      businessSize,
      search,
    });

    return NextResponse.json({
      success: true,
      data: products,
      meta: {
        total: products.length,
      },
    });
  } catch (error) {
    console.error("API /api/v1/software error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve software catalogue.",
        },
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getAllCategories } from "@/lib/services/software.service";

export async function GET() {
  try {
    const categories = await getAllCategories();
    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("API /api/v1/categories error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve categories.",
        },
      },
      { status: 500 }
    );
  }
}

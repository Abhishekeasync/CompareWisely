import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { getArticleBySlug } from "@/lib/services/content.service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  await connection();

  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Article slug is required.",
          },
        },
        { status: 400 }
      );
    }

    const article = await getArticleBySlug(slug);

    if (!article || !article.isPublished) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Article '${slug}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: article,
    });
  } catch (error: any) {
    console.error("GET /api/v1/articles/[slug] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to retrieve article.",
        },
      },
      { status: 500 }
    );
  }
}

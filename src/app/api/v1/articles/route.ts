import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { getArticles } from "@/lib/services/content.service";
import { ArticleType } from "@prisma/client";

export async function GET(request: NextRequest) {
  await connection();

  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const categorySlug = searchParams.get("category") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    let articleType: ArticleType | undefined = undefined;
    if (typeParam === "BLOG") articleType = ArticleType.BLOG;
    if (typeParam === "FINANCE_UPDATE") articleType = ArticleType.FINANCE_UPDATE;

    const data = await getArticles({
      type: articleType,
      categorySlug,
      tag,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: data.articles,
      meta: {
        total: data.total,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error("GET /api/v1/articles error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to retrieve articles.",
        },
      },
      { status: 500 }
    );
  }
}

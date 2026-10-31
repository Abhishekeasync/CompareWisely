import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { getAllArticlesForAdmin, createArticle } from "@/lib/services/content.service";
import { articleInputSchema } from "@/lib/validations/content";

export async function GET(request: NextRequest) {
  await connection();

  try {
    await requireAuth(["ADMIN", "EDITOR"]);
    const articles = await getAllArticlesForAdmin();

    return NextResponse.json({
      success: true,
      data: articles,
    });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.message,
          message: error.message,
        },
      },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  await connection();

  try {
    const session = await requireAuth(["ADMIN", "EDITOR"]);
    const body = await request.json();

    const parseResult = articleInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Invalid article inputs.",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const article = await createArticle(parseResult.data, session.id);

    return NextResponse.json(
      {
        success: true,
        data: article,
        message: "Article created and published successfully.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.message,
          message: error.message,
        },
      },
      { status }
    );
  }
}

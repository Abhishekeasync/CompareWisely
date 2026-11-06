import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { createComment } from "@/lib/services/content.service";
import { commentSubmitSchema } from "@/lib/validations/content";
import { validationErrorPayload } from "@/lib/validations/feedback";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  await connection();

  try {
    const { slug } = await context.params;
    const body = await request.json();

    const parseResult = commentSubmitSchema.safeParse({
      ...body,
      articleSlug: slug,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: validationErrorPayload(parseResult.error) },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);

    const comment = await createComment(parseResult.data, { ipHash });

    return NextResponse.json(
      {
        success: true,
        data: comment,
        message: "Your comment has been submitted and is pending moderation.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v1/articles/[slug]/comments error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message === "Article not found or not published."
            ? "This article is not open for comments."
            : "We couldn't save your comment. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}

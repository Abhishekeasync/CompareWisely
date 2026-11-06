import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { getCommentsForAdmin, moderateComment } from "@/lib/services/admin.service";
import { CommentStatus } from "@prisma/client";
import { commentModerationSchema } from "@/lib/validations/content";
import { readApiError, validationErrorPayload } from "@/lib/validations/feedback";

export async function GET(request: NextRequest) {
  await connection();

  try {
    await requireAuth(["ADMIN", "EDITOR", "MODERATOR"]);
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") as CommentStatus | null;

    const comments = await getCommentsForAdmin(statusParam || undefined);

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    const failure = readApiError(
      { error: { code: error.message, message: error.message } },
      "Could not load comments."
    );
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.message,
          message: failure.message,
        },
      },
      { status }
    );
  }
}

export async function PATCH(request: NextRequest) {
  await connection();

  try {
    const session = await requireAuth(["ADMIN", "EDITOR", "MODERATOR"]);
    const body = await request.json();
    const parsed = commentModerationSchema.safeParse({
      commentId: Number(body.commentId),
      status: body.status,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: validationErrorPayload(parsed.error) },
        { status: 400 }
      );
    }

    const updated = await moderateComment(parsed.data.commentId, parsed.data.status as CommentStatus, session.id);

    const label =
      parsed.data.status === "APPROVED"
        ? "approved"
        : parsed.data.status === "REJECTED"
          ? "rejected"
          : "moved back to pending";

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Comment ${label}.`,
    });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : error.message === "Comment not found." ? 404 : 500;
    const failure = readApiError(
      { error: { code: error.message, message: error.message } },
      error.message === "Comment not found." ? "That comment could not be found." : "Could not update this comment."
    );
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.message,
          message: failure.message,
        },
      },
      { status }
    );
  }
}

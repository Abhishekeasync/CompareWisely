import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { getCommentsForAdmin, moderateComment } from "@/lib/services/admin.service";
import { CommentStatus } from "@prisma/client";

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

export async function PATCH(request: NextRequest) {
  await connection();

  try {
    const session = await requireAuth(["ADMIN", "EDITOR", "MODERATOR"]);
    const body = await request.json();
    const { commentId, status } = body;

    if (!commentId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Comment ID and target status are required.",
          },
        },
        { status: 400 }
      );
    }

    const updated = await moderateComment(Number(commentId), status as CommentStatus, session.id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Comment marked as ${status}.`,
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

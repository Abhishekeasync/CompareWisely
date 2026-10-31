import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { updateArticle } from "@/lib/services/content.service";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { articleInputSchema } from "@/lib/validations/content";

function errStatus(msg: string) {
  return msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
}

const patchSchema = z.object({
  action: z.enum(["publish", "draft"]),
});

/* ── PATCH /api/v1/admin/articles/[id] ─────────────────── */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connection();

  try {
    await requireAuth(["ADMIN", "EDITOR"]);

    const { id: idStr } = await context.params;
    const id = Number(idStr);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid article id." } },
        { status: 400 }
      );
    }

    const body = await request.json();

    const isListActionOnly =
      (body.action === "publish" || body.action === "draft") &&
      body.title === undefined &&
      body.content === undefined &&
      body.slug === undefined;

    if (isListActionOnly) {
      const parsed = patchSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_FAILED",
              message: "Invalid patch payload.",
              details: parsed.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      const isPublished = parsed.data.action === "publish";

      const updated = await prisma.article.update({
        where: { id },
        data: {
          isPublished,
          publishedAt: isPublished ? new Date() : null,
        },
        select: { id: true, title: true, slug: true, isPublished: true, updatedAt: true },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: isPublished ? "Article published." : "Article saved as draft.",
      });
    }

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

    const updated = await updateArticle(id, parseResult.data);

    return NextResponse.json({
      success: true,
      data: updated,
      message: parseResult.data.isPublished
        ? "Article updated and published."
        : "Article saved as draft.",
    });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "P2025" || err.message === "NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Article not found." } },
        { status: 404 }
      );
    }
    if (err.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "DUPLICATE_SLUG", message: "Another article already uses this URL slug." },
        },
        { status: 409 }
      );
    }
    const message = err.message ?? "Unknown error";
    return NextResponse.json(
      { success: false, error: { code: message, message } },
      { status: errStatus(message) }
    );
  }
}

/* ── DELETE /api/v1/admin/articles/[id] ─────────────────── */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connection();

  try {
    await requireAuth(["ADMIN"]);

    const { id: idStr } = await context.params;
    const id = Number(idStr);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid article id." } },
        { status: 400 }
      );
    }

    await prisma.article.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Article permanently deleted.",
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Article not found." } },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: error.message, message: error.message } },
      { status: errStatus(error.message) }
    );
  }
}

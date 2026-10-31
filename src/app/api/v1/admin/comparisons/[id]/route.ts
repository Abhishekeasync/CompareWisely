import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db";
import { z } from "zod";

function errStatus(msg: string) {
  return msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
}

const patchSchema = z.object({
  action: z.enum(["publish", "draft"]).optional(),
  isPublished: z.boolean().optional(),
  title: z.string().trim().min(5).optional(),
  metaTitle: z.string().trim().max(60).optional(),
  metaDescription: z.string().trim().max(160).optional(),
  verdictSummary: z.string().trim().optional(),
});

/* ── PATCH /api/v1/admin/comparisons/[id] ──────────────── */
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
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid comparison id." } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_FAILED", message: "Invalid patch payload.", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const data = parsed.data;
    let isPublished: boolean | undefined = data.isPublished;
    if (data.action === "publish") isPublished = true;
    if (data.action === "draft") isPublished = false;

    const updated = await prisma.comparisonPage.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle || null }),
        ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription || null }),
        ...(data.verdictSummary !== undefined && { verdictSummary: data.verdictSummary || null }),
        ...(isPublished !== undefined && {
          isPublished,
          publishedAt: isPublished ? new Date() : null,
        }),
      },
      select: { id: true, title: true, slug: true, isPublished: true, updatedAt: true },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: isPublished === true
        ? "Comparison published."
        : isPublished === false
        ? "Comparison saved as draft."
        : "Comparison updated.",
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Comparison page not found." } },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: error.message, message: error.message } },
      { status: errStatus(error.message) }
    );
  }
}

/* ── DELETE /api/v1/admin/comparisons/[id] ─────────────── */
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
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid comparison id." } },
        { status: 400 }
      );
    }

    await prisma.comparisonPage.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Comparison page permanently deleted." });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Comparison page not found." } },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: error.message, message: error.message } },
      { status: errStatus(error.message) }
    );
  }
}

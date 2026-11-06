import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db";
import { comparisonCreateSchema } from "@/lib/validations/comparison";
import { validationErrorPayload } from "@/lib/validations/feedback";

export async function POST(request: NextRequest) {
  await connection();

  try {
    const session = await requireAuth(["ADMIN", "EDITOR"]);
    const body = await request.json();

    const parsed = comparisonCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: validationErrorPayload(parsed.error) },
        { status: 400 }
      );
    }

    const { title, slug, metaTitle, metaDescription, verdictSummary, isPublished, productIds } =
      parsed.data;

    const existing = await prisma.comparisonPage.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SLUG_CONFLICT",
            message: `“${slug}” is already used by another comparison. Choose a different URL slug.`,
            fields: { slug: `“${slug}” is already used. Choose a different URL slug.` },
          },
        },
        { status: 409 }
      );
    }

    const page = await prisma.comparisonPage.create({
      data: {
        title,
        slug,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        verdictSummary: verdictSummary || null,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
        comparisonProducts: {
          create: productIds.map((softwareId, displayOrder) => ({
            softwareId,
            displayOrder,
          })),
        },
      },
      include: {
        comparisonProducts: {
          include: { software: { select: { id: true, name: true, slug: true } } },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: page, message: "Comparison page created successfully." },
      { status: 201 }
    );
  } catch (error: any) {
    const status =
      error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { success: false, error: { code: error.message, message: error.message } },
      { status }
    );
  }
}

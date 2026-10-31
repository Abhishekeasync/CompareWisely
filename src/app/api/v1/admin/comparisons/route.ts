import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db";
import { z } from "zod";

const comparisonCreateSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters."),
  slug: z
    .string()
    .trim()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens."),
  metaTitle: z.string().trim().max(60).optional(),
  metaDescription: z.string().trim().max(160).optional(),
  verdictSummary: z.string().trim().optional(),
  isPublished: z.boolean().default(true),
  /** Array of software product IDs in display order */
  productIds: z
    .array(z.number().int().positive())
    .min(2, "A comparison requires at least 2 products.")
    .max(4, "A comparison can include at most 4 products."),
});

export async function POST(request: NextRequest) {
  await connection();

  try {
    const session = await requireAuth(["ADMIN", "EDITOR"]);
    const body = await request.json();

    const parsed = comparisonCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Invalid comparison inputs.",
            details: parsed.error.flatten(),
          },
        },
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
            message: `A comparison page with slug "${slug}" already exists.`,
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

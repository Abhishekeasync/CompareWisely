import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db";
import { z } from "zod";

const categoryCreateSchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters."),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens."),
  description: z.string().trim().optional(),
});

export async function GET() {
  await connection();

  try {
    await requireAuth(["ADMIN", "EDITOR"]);
    const categories = await prisma.category.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, description: true, displayOrder: true },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    const status =
      error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { success: false, error: { code: error.message, message: error.message } },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  await connection();

  try {
    await requireAuth(["ADMIN", "EDITOR"]);
    const body = await request.json();

    const parsed = categoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Invalid category inputs.",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { name, slug, description } = parsed.data;

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "SLUG_CONFLICT", message: `A category with slug "${slug}" already exists.` } },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: { name, slug, description: description || null },
      select: { id: true, name: true, slug: true, description: true },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    const status =
      error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { success: false, error: { code: error.message, message: error.message } },
      { status }
    );
  }
}

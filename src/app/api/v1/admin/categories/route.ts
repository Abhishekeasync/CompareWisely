import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db";
import { categoryCreateSchema } from "@/lib/validations/content";
import { validationErrorPayload } from "@/lib/validations/feedback";

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
        { success: false, error: validationErrorPayload(parsed.error) },
        { status: 400 }
      );
    }

    const { name, slug, description } = parsed.data;

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "SLUG_CONFLICT", message: `“${slug}” is already used by another category.`, fields: { slug: `“${slug}” is already used. Choose a different URL slug.` } } },
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

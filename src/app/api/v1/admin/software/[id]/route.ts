import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { adminSoftwarePatchSchema } from "@/lib/validations/software";
import { readApiError, validationErrorPayload } from "@/lib/validations/feedback";

function errStatus(msg: string) {
  return msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
}

/* ── PATCH /api/v1/admin/software/[id] ─────────────────── */
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
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid software id." } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = adminSoftwarePatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: validationErrorPayload(parsed.error) },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check slug uniqueness if slug is provided
    if (data.slug) {
      const conflict = await prisma.softwareProduct.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json(
          { success: false, error: { code: "SLUG_CONFLICT", message: `“${data.slug}” is already used by another product. Choose a different URL slug.`, fields: { slug: `“${data.slug}” is already used. Choose a different URL slug.` } } },
          { status: 409 }
        );
      }
    }

    // Resolve status from shorthand action
    let status = data.status;
    if (data.action === "publish") status = "PUBLISHED";
    if (data.action === "draft") status = "DRAFT";
    if (data.action === "archive") status = "ARCHIVED";

    // Handle starting price update if provided
    if (data.startingPrice !== undefined && data.startingPrice !== "") {
      const existingPlan = await prisma.pricingPlan.findFirst({
        where: { softwareId: id, isStartingPrice: true },
      });
      if (existingPlan) {
        await prisma.pricingPlan.update({
          where: { id: existingPlan.id },
          data: { displayPrice: data.startingPrice },
        });
      } else {
        await prisma.pricingPlan.create({
          data: {
            softwareId: id,
            planName: "Starter",
            displayPrice: data.startingPrice,
            isStartingPrice: true,
          },
        });
      }
    }

    // Handle feature checkpoints add / edit / delete
    if (data.featureCheckpoints !== undefined) {
      let defaultFCat = await prisma.featureCategory.findFirst();
      if (!defaultFCat) {
        defaultFCat = await prisma.featureCategory.create({
          data: { name: "General Capabilities", slug: "general-capabilities" },
        });
      }

      const keptFeatureIds: number[] = [];

      for (const cp of data.featureCheckpoints) {
        let featureId = cp.featureId;

        if (!featureId) {
          const baseCode = cp.featureName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .slice(0, 40) || "feature";

          let existingFeature = await prisma.feature.findFirst({
            where: {
              OR: [{ name: cp.featureName }, { code: baseCode }],
            },
          });

          if (!existingFeature) {
            let catId = defaultFCat.id;
            if (cp.categoryName) {
              const catSlug = cp.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              const fCat = await prisma.featureCategory.upsert({
                where: { slug: catSlug },
                update: {},
                create: { name: cp.categoryName, slug: catSlug },
              });
              catId = fCat.id;
            }

            const uniqueCode = `${baseCode}_${Date.now().toString().slice(-4)}`;
            existingFeature = await prisma.feature.create({
              data: {
                name: cp.featureName,
                code: uniqueCode,
                categoryId: catId,
              },
            });
          }

          featureId = existingFeature.id;
        }

        keptFeatureIds.push(featureId);

        await prisma.productFeatureValue.upsert({
          where: {
            softwareId_featureId: {
              softwareId: id,
              featureId,
            },
          },
          update: {
            valueKind: cp.valueKind,
            textValue: cp.textValue || null,
            note: cp.note || null,
            booleanValue: cp.valueKind === "YES",
            verifiedAt: new Date(),
          },
          create: {
            softwareId: id,
            featureId,
            valueKind: cp.valueKind,
            textValue: cp.textValue || null,
            note: cp.note || null,
            booleanValue: cp.valueKind === "YES",
            verifiedAt: new Date(),
          },
        });
      }

      // Delete any checkpoints removed by the user
      await prisma.productFeatureValue.deleteMany({
        where: {
          softwareId: id,
          featureId: { notIn: keptFeatureIds },
        },
      });
    }

    const updated = await prisma.softwareProduct.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.mono !== undefined && { mono: data.mono }),
        ...(data.categoryId !== undefined && { category: { connect: { id: data.categoryId } } }),
        ...(data.tagline !== undefined && { tagline: data.tagline || null }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.websiteUrl !== undefined && { websiteUrl: data.websiteUrl || null }),
        ...(data.trialUrl !== undefined && { trialUrl: data.trialUrl || null }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
        ...(data.pros !== undefined && { pros: data.pros.length > 0 ? data.pros : Prisma.JsonNull }),
        ...(data.cons !== undefined && { cons: data.cons.length > 0 ? data.cons : Prisma.JsonNull }),
        ...(status !== undefined && { status }),
      },
      include: {
        category: true,
        pricingPlans: { orderBy: { isStartingPrice: "desc" } },
        featureValues: {
          include: {
            feature: {
              include: {
                category: true,
              },
            },
          },
          orderBy: { feature: { displayOrder: "asc" } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message:
        status === "PUBLISHED" ? "Product published."
        : status === "DRAFT" ? "Product saved as draft."
        : status === "ARCHIVED" ? "Product archived."
        : "Product updated.",
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Software product not found." } },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: error.message, message: error.message } },
      { status: errStatus(error.message) }
    );
  }
}

/* ── DELETE /api/v1/admin/software/[id] ─────────────────── */
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
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid software id." } },
        { status: 400 }
      );
    }

    await prisma.softwareProduct.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Software product permanently deleted." });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Software product not found." } },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: error.message, message: error.message } },
      { status: errStatus(error.message) }
    );
  }
}

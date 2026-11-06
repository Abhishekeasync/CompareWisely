import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { getAllSoftwareForAdmin } from "@/lib/services/admin.service";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { adminSoftwareWriteSchema } from "@/lib/validations/software";
import { readApiError, validationErrorPayload } from "@/lib/validations/feedback";

export async function GET() {
  await connection();
  try {
    await requireAuth(["ADMIN", "EDITOR"]);
    const software = await getAllSoftwareForAdmin();
    return NextResponse.json({ success: true, data: software });
  } catch (error: any) {
    const failure = readApiError(
      { error: { code: error.message, message: error.message } },
      "Could not load the software catalogue."
    );
    const status = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: { code: error.message, message: failure.message } }, { status });
  }
}

export async function POST(request: NextRequest) {
  await connection();
  try {
    await requireAuth(["ADMIN", "EDITOR"]);
    const body = await request.json();
    const parsed = adminSoftwareWriteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: validationErrorPayload(parsed.error) },
        { status: 400 }
      );
    }

    const {
      name,
      slug,
      mono,
      categoryId,
      tagline,
      description,
      websiteUrl,
      trialUrl,
      logoUrl,
      status,
      pros,
      cons,
      startingPrice,
      startingPlanName,
      featureCheckpoints,
    } = parsed.data;

    const existing = await prisma.softwareProduct.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "SLUG_CONFLICT", message: `“${slug}” is already used by another product. Choose a different URL slug.`, fields: { slug: `“${slug}” is already used. Choose a different URL slug.` } } },
        { status: 409 }
      );
    }

    const computedMono = (mono && mono.trim()) || name.trim().slice(0, 2).toUpperCase();

    const product = await prisma.softwareProduct.create({
      data: {
        name,
        slug,
        mono: computedMono,
        categoryId,
        status,
        tagline: tagline || null,
        description,
        websiteUrl: websiteUrl || null,
        trialUrl: trialUrl || null,
        logoUrl: logoUrl || null,
        pros: pros && pros.length > 0 ? pros : Prisma.JsonNull,
        cons: cons && cons.length > 0 ? cons : Prisma.JsonNull,
        ...(startingPrice
          ? {
              pricingPlans: {
                create: {
                  planName: startingPlanName || "Starter",
                  displayPrice: startingPrice,
                  isStartingPrice: true,
                },
              },
            }
          : {}),
      },
      include: {
        category: true,
        pricingPlans: {
          orderBy: { isStartingPrice: "desc" },
        },
      },
    });

    // Seed feature checkpoints if provided
    if (featureCheckpoints && featureCheckpoints.length > 0) {
      let defaultFCat = await prisma.featureCategory.findFirst();
      if (!defaultFCat) {
        defaultFCat = await prisma.featureCategory.create({
          data: { name: "General Capabilities", slug: "general-capabilities" },
        });
      }

      for (const cp of featureCheckpoints) {
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

        await prisma.productFeatureValue.create({
          data: {
            softwareId: product.id,
            featureId,
            valueKind: cp.valueKind,
            textValue: cp.textValue || null,
            note: cp.note || null,
            booleanValue: cp.valueKind === "YES",
            verifiedAt: new Date(),
          },
        });
      }
    }

    const fullProduct = await prisma.softwareProduct.findUnique({
      where: { id: product.id },
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

    return NextResponse.json({ success: true, data: fullProduct || product, message: "Software product created." }, { status: 201 });
  } catch (error: any) {
    const failure = readApiError(
      { error: { code: error.message, message: error.message } },
      "Could not save this product. Please try again."
    );
    const status = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: { code: error.message, message: failure.message } }, { status });
  }
}

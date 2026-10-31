import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { getAllSoftwareForAdmin } from "@/lib/services/admin.service";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const featureCheckpointCreateSchema = z.object({
  featureId: z.number().optional(),
  featureName: z.string().trim().min(2, "Feature name is required."),
  categoryName: z.string().trim().optional(),
  valueKind: z.enum(["YES", "NO", "PARTIAL", "PAID_ADDON", "UNAVAILABLE", "UNKNOWN"]).default("YES"),
  textValue: z.string().trim().optional().nullable(),
  note: z.string().trim().optional().nullable(),
});

const softwareCreateSchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only."),
  mono: z.string().trim().max(10).optional(),
  categoryId: z.number().int().positive("Category is required."),
  tagline: z.string().trim().max(255).optional(),
  description: z.string().trim().min(10, "Description is required."),
  websiteUrl: z.string().url().or(z.literal("")).optional(),
  trialUrl: z.string().url().or(z.literal("")).optional(),
  logoUrl: z.string().url().or(z.literal("")).optional(),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]).default("PUBLISHED"),
  pros: z.array(z.string().trim()).optional(),
  cons: z.array(z.string().trim()).optional(),
  startingPrice: z.string().trim().optional(),
  startingPlanName: z.string().trim().optional(),
  featureCheckpoints: z.array(featureCheckpointCreateSchema).optional(),
});

export async function GET() {
  await connection();
  try {
    await requireAuth(["ADMIN", "EDITOR"]);
    const software = await getAllSoftwareForAdmin();
    return NextResponse.json({ success: true, data: software });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: { code: error.message, message: error.message } }, { status });
  }
}

export async function POST(request: NextRequest) {
  await connection();
  try {
    await requireAuth(["ADMIN", "EDITOR"]);
    const body = await request.json();
    const parsed = softwareCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_FAILED", message: "Invalid inputs.", details: parsed.error.flatten() } },
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
        { success: false, error: { code: "SLUG_CONFLICT", message: `A product with slug "${slug}" already exists.` } },
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
    const status = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: { code: error.message, message: error.message } }, { status });
  }
}

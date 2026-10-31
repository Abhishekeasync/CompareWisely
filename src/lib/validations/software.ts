import { z } from "zod";

export const pricingPlanInputSchema = z.object({
  id: z.number().int().positive().optional(),
  planName: z.string().trim().min(1, "Plan name is required."),
  priceAmount: z.number().nonnegative().nullable().optional(),
  billingCycle: z.enum(["MONTHLY", "ANNUAL", "ONE_TIME", "CUSTOM"]).default("ANNUAL"),
  currency: z.string().default("INR"),
  isStartingPrice: z.boolean().default(false),
  displayPrice: z.string().trim().min(1, "Display price is required (e.g. 'from ₹749/month')."),
  description: z.string().optional(),
  verificationSourceUrl: z.string().url("Must be a valid URL.").or(z.literal("")).optional(),
  verifiedAt: z.coerce.date().optional(),
});

export const softwareProductSchema = z.object({
  categoryId: z.number().int().positive("Category is required."),
  name: z.string().trim().min(2, "Product name must be at least 2 characters."),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens."),
  mono: z.string().max(10).default(""),
  logoUrl: z.string().url().or(z.literal("")).optional(),
  tagline: z.string().max(255).optional(),
  description: z.string().trim().min(10, "Description must be at least 10 characters."),
  websiteUrl: z.string().url("Must be a valid URL.").optional(),
  trialUrl: z.string().url("Must be a valid trial URL.").optional(),
  targetBusinessSize: z.array(z.string()).default([]),
  targetIndustries: z.array(z.string()).default([]),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
  pricingPlans: z.array(pricingPlanInputSchema).optional(),
});

export const productFeatureValueInputSchema = z.object({
  featureId: z.number().int().positive(),
  valueKind: z.enum(["YES", "NO", "PARTIAL", "PAID_ADDON", "UNAVAILABLE", "UNKNOWN"]),
  textValue: z.string().max(255).optional(),
  booleanValue: z.boolean().optional(),
  note: z.string().optional(),
  verifiedAt: z.coerce.date().optional(),
});

export type PricingPlanInput = z.infer<typeof pricingPlanInputSchema>;
export type SoftwareProductInput = z.infer<typeof softwareProductSchema>;
export type ProductFeatureValueInput = z.infer<typeof productFeatureValueInputSchema>;

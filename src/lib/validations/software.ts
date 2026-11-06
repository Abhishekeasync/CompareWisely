import { z } from "zod";
import { optionalWebAddress, requiredSlug } from "./strings";

const featureCheckpointSchema = z.object({
  id: z.number().int().positive().optional(),
  featureId: z.number().int().positive().optional(),
  featureName: z.string().trim().min(2, "Each checkpoint needs a feature name of at least 2 characters."),
  categoryName: z.string().trim().max(80, "Checkpoint category must be 80 characters or fewer.").optional(),
  valueKind: z.enum(["YES", "NO", "PARTIAL", "PAID_ADDON", "UNAVAILABLE", "UNKNOWN"]).default("YES"),
  textValue: z.string().trim().max(255, "Checkpoint detail must be 255 characters or fewer.").optional().nullable(),
  note: z.string().trim().max(500, "Checkpoint note must be 500 characters or fewer.").optional().nullable(),
});

const listItem = z.string().trim().min(1).max(240, "Each strength or limitation must be 240 characters or fewer.");
const publishStatus = z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]);

const softwareFields = {
  name: z.string().trim().min(2, "Product name must be at least 2 characters.").max(120, "Product name must be 120 characters or fewer."),
  slug: requiredSlug(2),
  mono: z.string().trim().max(10, "Monogram must be 10 characters or fewer.").optional(),
  categoryId: z.number().int().positive("Choose a category."),
  tagline: z.string().trim().max(255, "Tagline must be 255 characters or fewer.").optional(),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters so readers know what the product does.")
    .max(5000, "Description must be 5,000 characters or fewer."),
  websiteUrl: optionalWebAddress("Website must be a full link starting with https://").optional(),
  trialUrl: optionalWebAddress("Trial link must be a full URL starting with https://").optional(),
  logoUrl: optionalWebAddress("Logo must be a full image URL starting with https://, or a site path like /uploads/…", true).optional(),
  status: publishStatus,
  pros: z.array(listItem).max(20, "Add at most 20 strengths.").optional(),
  cons: z.array(listItem).max(20, "Add at most 20 limitations.").optional(),
  startingPrice: z.string().trim().max(80, "Starting price must be 80 characters or fewer.").optional(),
  startingPlanName: z.string().trim().max(80, "Plan name must be 80 characters or fewer.").optional(),
  featureCheckpoints: z.array(featureCheckpointSchema).max(80, "A product can have at most 80 checkpoints.").optional(),
};

export const adminSoftwareWriteSchema = z.object({
  ...softwareFields,
  status: publishStatus.default("PUBLISHED"),
});

export const adminSoftwarePatchSchema = z.object(softwareFields).partial().extend({
  action: z.enum(["publish", "draft", "archive"]).optional(),
});

export const pricingVerifySchema = z.object({
  softwareId: z.number().int().positive("Choose the product to verify."),
  planId: z.number().int().positive("Choose a pricing plan.").optional(),
  newPrice: z
    .string()
    .trim()
    .min(2, "Enter the verified price, for example ₹749/month.")
    .max(80, "Price text must be 80 characters or fewer."),
  sourceUrl: z
    .string()
    .trim()
    .url("Enter the full vendor pricing page, starting with https://."),
});

export const pricingPlanInputSchema = z.object({
  id: z.number().int().positive().optional(),
  planName: z.string().trim().min(1, "Plan name is required.").max(80, "Plan name must be 80 characters or fewer."),
  priceAmount: z.number().nonnegative("Price cannot be negative.").nullable().optional(),
  billingCycle: z.enum(["MONTHLY", "ANNUAL", "ONE_TIME", "CUSTOM"]).default("ANNUAL"),
  currency: z.string().trim().min(3, "Use a 3-letter currency code.").max(3, "Use a 3-letter currency code.").default("INR"),
  isStartingPrice: z.boolean().default(false),
  displayPrice: z.string().trim().min(1, "Display price is required, for example “from ₹749/month”.").max(80, "Display price must be 80 characters or fewer."),
  description: z.string().trim().max(500, "Plan description must be 500 characters or fewer.").optional(),
  verificationSourceUrl: optionalWebAddress("Proof link must be a full URL starting with https://").optional(),
  verifiedAt: z.coerce.date().optional(),
});

export const softwareProductSchema = z.object({
  categoryId: z.number().int().positive("Choose a category."),
  name: z.string().trim().min(2, "Product name must be at least 2 characters.").max(120, "Product name must be 120 characters or fewer."),
  slug: requiredSlug(2),
  mono: z.string().trim().max(10, "Monogram must be 10 characters or fewer.").default(""),
  logoUrl: optionalWebAddress("Logo must be a full image URL starting with https://.", true).optional(),
  tagline: z.string().trim().max(255, "Tagline must be 255 characters or fewer.").optional(),
  description: z.string().trim().min(10, "Description must be at least 10 characters."),
  websiteUrl: optionalWebAddress("Website must be a full link starting with https://.").optional(),
  trialUrl: optionalWebAddress("Trial link must be a full URL starting with https://.").optional(),
  targetBusinessSize: z.array(z.string()).default([]),
  targetIndustries: z.array(z.string()).default([]),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
  pricingPlans: z.array(pricingPlanInputSchema).optional(),
});

export const productFeatureValueInputSchema = z.object({
  featureId: z.number().int().positive("Choose a feature."),
  valueKind: z.enum(["YES", "NO", "PARTIAL", "PAID_ADDON", "UNAVAILABLE", "UNKNOWN"]),
  textValue: z.string().trim().max(255, "Detail must be 255 characters or fewer.").optional(),
  booleanValue: z.boolean().optional(),
  note: z.string().trim().max(500, "Note must be 500 characters or fewer.").optional(),
  verifiedAt: z.coerce.date().optional(),
});

export type PricingPlanInput = z.infer<typeof pricingPlanInputSchema>;
export type SoftwareProductInput = z.infer<typeof softwareProductSchema>;
export type ProductFeatureValueInput = z.infer<typeof productFeatureValueInputSchema>;
export type AdminSoftwareWriteInput = z.infer<typeof adminSoftwareWriteSchema>;
export type PricingVerifyInput = z.infer<typeof pricingVerifySchema>;

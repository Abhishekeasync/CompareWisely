import { z } from "zod";
import { optionalWebAddress, requiredSlug } from "./strings";

export const compareProductIdsSchema = z
  .array(z.string().trim().min(1))
  .min(2, "Select at least two products to compare.")
  .max(4, "You can compare at most four products at once.");

const verdictSummary = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || value.length >= 20, {
    message: "Verdict needs at least 20 characters, or leave it blank.",
  })
  .refine((value) => value.length <= 2000, {
    message: "Verdict must be 2,000 characters or fewer.",
  });

export const comparisonCreateSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(180, "Title must be 180 characters or fewer."),
  slug: requiredSlug(3),
  metaTitle: z.string().trim().max(60, "SEO title must be 60 characters or fewer.").optional(),
  metaDescription: z.string().trim().max(160, "Meta description must be 160 characters or fewer.").optional(),
  verdictSummary: verdictSummary.optional(),
  isPublished: z.boolean().default(true),
  productIds: z
    .array(z.number().int().positive("Choose a valid product."))
    .min(2, "Select at least 2 products to compare.")
    .max(4, "A comparison can include at most 4 products."),
});

export const comparisonPatchSchema = z.object({
  action: z.enum(["publish", "draft"]).optional(),
  isPublished: z.boolean().optional(),
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(180, "Title must be 180 characters or fewer.").optional(),
  metaTitle: z.string().trim().max(60, "SEO title must be 60 characters or fewer.").optional(),
  metaDescription: z.string().trim().max(160, "Meta description must be 160 characters or fewer.").optional(),
  verdictSummary: verdictSummary.optional(),
});

export const comparisonPageSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(180, "Title must be 180 characters or fewer."),
  slug: requiredSlug(3),
  metaTitle: z.string().trim().max(70, "SEO title must be 70 characters or fewer.").optional(),
  metaDescription: z.string().trim().max(160, "Meta description must be 160 characters or fewer.").optional(),
  ogImageUrl: optionalWebAddress("Image URL must be a full link starting with https://.").optional(),
  verdictSummary: z.string().trim().min(20, "Verdict summary needs at least 20 characters.").max(2000, "Verdict must be 2,000 characters or fewer."),
  productIds: z.array(z.number().int().positive()).min(2, "Select at least 2 products.").max(4, "Select at most 4 products."),
  isPublished: z.boolean().default(true),
});

export type CompareProductIdsInput = z.infer<typeof compareProductIdsSchema>;
export type ComparisonPageInput = z.infer<typeof comparisonPageSchema>;

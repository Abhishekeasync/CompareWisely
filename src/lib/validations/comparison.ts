import { z } from "zod";

export const compareProductIdsSchema = z
  .array(z.string().trim().min(1))
  .min(2, "At least two products are required for comparison.")
  .max(4, "A maximum of four products can be compared at once.");

export const comparisonPageSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters."),
  slug: z.string().trim().min(3).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens."),
  metaTitle: z.string().max(70, "SEO title should not exceed 70 characters.").optional(),
  metaDescription: z.string().max(160, "SEO description should not exceed 160 characters.").optional(),
  ogImageUrl: z.string().url().optional(),
  verdictSummary: z.string().min(20, "Verdict summary must provide meaningful context."),
  productIds: z.array(z.number().int().positive()).min(2).max(4),
  isPublished: z.boolean().default(true),
});

export type CompareProductIdsInput = z.infer<typeof compareProductIdsSchema>;
export type ComparisonPageInput = z.infer<typeof comparisonPageSchema>;

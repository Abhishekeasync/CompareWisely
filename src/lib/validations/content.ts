import { z } from "zod";
import { articleMediaUrlSchema } from "./media-url";
import { optionalWebAddress, requiredSlug } from "./strings";

export const articleInputSchema = z.object({
  articleType: z.enum(["BLOG", "FINANCE_UPDATE"], {
    message: "Choose a publication type.",
  }).default("BLOG"),
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(180, "Title must be 180 characters or fewer."),
  slug: requiredSlug(3),
  excerpt: z.string().trim().max(300, "Excerpt must be 300 characters or fewer.").optional(),
  content: z
    .string()
    .trim()
    .min(20, "Write at least a short paragraph (20 characters) for the article body.")
    .max(100000, "Article body is too long to save."),
  imageUrls: z.array(articleMediaUrlSchema).max(3, "You can add up to 3 images.").optional(),
  featuredImageUrl: articleMediaUrlSchema.or(z.literal("")).optional(),
  videoUrl: articleMediaUrlSchema.or(z.literal("")).optional(),
  metaTitle: z.string().trim().max(60, "SEO title must be 60 characters or fewer.").optional(),
  metaDescription: z.string().trim().max(160, "Meta description must be 160 characters or fewer.").optional(),
  canonicalUrl: optionalWebAddress("Canonical URL must be a full link starting with https://.").optional(),
  categoryId: z.number().int().positive("Choose a category.").optional(),
  tags: z.array(z.string().trim().min(1).max(40, "Each tag must be 40 characters or fewer.")).max(12, "Add at most 12 tags.").default([]),
  isPublished: z.boolean().default(true),
});

export const commentSubmitSchema = z.object({
  articleSlug: z.string().trim().min(1, "This article could not be identified. Refresh the page and try again."),
  authorName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(60, "Name must be 60 characters or fewer."),
  authorEmail: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address. It stays private and is never published."),
  content: z
    .string()
    .trim()
    .min(5, "Comment must be at least 5 characters.")
    .max(1000, "Comment must be 1,000 characters or fewer."),
});

export const commentModerationSchema = z.object({
  commentId: z.number().int().positive("Choose a comment to moderate."),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"], {
    message: "Choose pending, approved, or rejected.",
  }),
});

export const categoryCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters.")
    .max(80, "Category name must be 80 characters or fewer."),
  slug: requiredSlug(2),
  description: z.string().trim().max(300, "Description must be 300 characters or fewer.").optional(),
});

export type ArticleInput = z.infer<typeof articleInputSchema>;
export type CommentSubmitInput = z.infer<typeof commentSubmitSchema>;

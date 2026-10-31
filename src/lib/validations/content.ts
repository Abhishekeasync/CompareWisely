import { z } from "zod";
import { articleMediaUrlSchema } from "./media-url";

export const articleInputSchema = z.object({
  articleType: z.enum(["BLOG", "FINANCE_UPDATE"]).default("BLOG"),
  title: z.string().trim().min(5, "Title must be at least 5 characters."),
  slug: z.string().trim().min(3).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().trim().max(300).optional(),
  content: z.string().trim().min(20, "Article content cannot be empty."),
  imageUrls: z.array(articleMediaUrlSchema).max(3).optional(),
  featuredImageUrl: articleMediaUrlSchema.or(z.literal("")).optional(),
  videoUrl: articleMediaUrlSchema.or(z.literal("")).optional(),
  metaTitle: z.string().trim().max(60).optional(),
  metaDescription: z.string().trim().max(160).optional(),
  canonicalUrl: z.string().url().or(z.literal("")).optional(),
  categoryId: z.number().int().positive().optional(),
  tags: z.array(z.string().trim()).default([]),
  isPublished: z.boolean().default(true),
});

export const commentSubmitSchema = z.object({
  articleSlug: z.string().min(1),
  authorName: z.string().trim().min(2, "Name must be at least 2 characters.").max(60),
  authorEmail: z.string().trim().email("Please provide a valid email address."),
  content: z
    .string()
    .trim()
    .min(5, "Comment must be at least 5 characters.")
    .max(1000, "Comment cannot exceed 1000 characters."),
});

export type ArticleInput = z.infer<typeof articleInputSchema>;
export type CommentSubmitInput = z.infer<typeof commentSubmitSchema>;

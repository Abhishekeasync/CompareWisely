import { z } from "zod";

const UPLOADED_ARTICLE_MEDIA_PATH = /^\/uploads\/articles\/[\w.-]+$/;

/** Absolute https URL or a path returned by the admin upload API. */
export function isArticleMediaUrl(value: string): boolean {
  if (value === "") return true;
  if (UPLOADED_ARTICLE_MEDIA_PATH.test(value)) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const articleMediaUrlSchema = z
  .string()
  .trim()
  .refine(isArticleMediaUrl, {
    message: "Use a full https:// link, or an uploaded file path.",
  });

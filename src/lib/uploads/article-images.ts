import { Prisma } from "@prisma/client";
import { isArticleMediaUrl } from "@/lib/validations/media-url";

export const MAX_ARTICLE_IMAGES = 3;

export function normalizeArticleImageUrls(
  imageUrls: unknown,
  featuredImageUrl?: string | null
): string[] {
  const urls: string[] = [];

  if (Array.isArray(imageUrls)) {
    for (const entry of imageUrls) {
      if (typeof entry === "string" && isArticleMediaUrl(entry) && entry !== "") {
        if (!urls.includes(entry)) urls.push(entry);
      }
      if (urls.length >= MAX_ARTICLE_IMAGES) break;
    }
  }

  if (
    urls.length === 0 &&
    featuredImageUrl &&
    isArticleMediaUrl(featuredImageUrl) &&
    featuredImageUrl !== ""
  ) {
    urls.push(featuredImageUrl);
  }

  return urls.slice(0, MAX_ARTICLE_IMAGES);
}

export function articleImageUrlsForStorage(
  imageUrls: string[]
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  const normalized = normalizeArticleImageUrls(imageUrls);
  if (normalized.length === 0) {
    return Prisma.DbNull;
  }
  return normalized;
}

export function featuredImageFromList(imageUrls: string[]): string | null {
  return normalizeArticleImageUrls(imageUrls)[0] ?? null;
}

import { prisma } from "../db";
import { ArticleType, CommentStatus, Prisma } from "@prisma/client";
import type { CommentSubmitInput } from "../validations/content";
import {
  articleImageUrlsForStorage,
  featuredImageFromList,
  normalizeArticleImageUrls,
} from "../uploads/article-images";

export interface GetArticlesOptions {
  type?: ArticleType;
  categorySlug?: string;
  tag?: string;
  /** Matches title, excerpt, category name, and tag names. */
  search?: string;
  limit?: number;
  offset?: number;
  /** Omit full body text for index pages (smaller DB payloads, faster TTFB). */
  listFieldsOnly?: boolean;
}

export async function getArticles(options: GetArticlesOptions = {}) {
  const { type, categorySlug, tag, search, limit = 20, offset = 0, listFieldsOnly = false } = options;

  const whereClause: Prisma.ArticleWhereInput = {
    isPublished: true,
  };

  if (type) {
    whereClause.articleType = type;
  }

  if (categorySlug) {
    whereClause.category = {
      slug: categorySlug,
    };
  }

  if (tag) {
    whereClause.tags = {
      some: {
        tagName: tag,
      },
    };
  }

  const term = search?.trim();
  if (term) {
    whereClause.AND = [
      {
        OR: [
          { title: { contains: term } },
          { excerpt: { contains: term } },
          { category: { name: { contains: term } } },
          { tags: { some: { tagName: { contains: term } } } },
        ],
      },
    ];
  }

  const countPromise = prisma.article.count({ where: whereClause });

  const articlesPromise = listFieldsOnly
    ? prisma.article.findMany({
        where: whereClause,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          publishedAt: true,
          updatedAt: true,
          featuredImageUrl: true,
          category: true,
          author: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          tags: true,
        },
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        take: limit,
        skip: offset,
      })
    : prisma.article.findMany({
        where: whereClause,
        include: {
          category: true,
          author: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          tags: true,
          _count: {
            select: {
              comments: {
                where: { status: CommentStatus.APPROVED },
              },
            },
          },
        },
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        take: limit,
        skip: offset,
      });

  const [articles, total] = await Promise.all([articlesPromise, countPromise]);

  return {
    articles,
    total,
  };
}

export async function getBlogCategories(type: ArticleType = ArticleType.BLOG) {
  return prisma.category.findMany({
    where: {
      articles: {
        some: {
          isPublished: true,
          articleType: type,
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          articles: {
            where: {
              isPublished: true,
              articleType: type,
            },
          },
        },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
}

/** Character length of article bodies, without loading the bodies into the listing. */
export async function getArticleContentLengths(ids: number[]) {
  const lengths = new Map<number, number>();
  if (ids.length === 0) return lengths;

  const rows = await prisma.$queryRaw<Array<{ id: number | bigint; chars: number | bigint }>>(
    Prisma.sql`SELECT id, CHAR_LENGTH(content) AS chars FROM articles WHERE id IN (${Prisma.join(ids)})`
  );

  for (const row of rows) {
    lengths.set(Number(row.id), Number(row.chars));
  }

  return lengths;
}

export async function getArticleBySlug(slug: string) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      category: true,
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      tags: true,
      comments: {
        where: {
          status: CommentStatus.APPROVED,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          authorName: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });

  return article;
}

export async function getAllArticleSlugs(type?: ArticleType) {
  const articles = await prisma.article.findMany({
    where: {
      isPublished: true,
      ...(type ? { articleType: type } : {}),
    },
    select: {
      slug: true,
      articleType: true,
      updatedAt: true,
    },
  });

  return articles;
}

export async function createComment(
  input: CommentSubmitInput,
  options: { ipHash?: string } = {}
) {
  const article = await prisma.article.findUnique({
    where: { slug: input.articleSlug },
    select: { id: true, isPublished: true },
  });

  if (!article || !article.isPublished) {
    throw new Error("Article not found or not published.");
  }

  const comment = await prisma.comment.create({
    data: {
      articleId: article.id,
      authorName: input.authorName,
      authorEmail: input.authorEmail.toLowerCase(),
      content: input.content,
      status: CommentStatus.PENDING,
      ipHash: options.ipHash || null,
    },
    select: {
      id: true,
      authorName: true,
      status: true,
      createdAt: true,
    },
  });

  return comment;
}

export async function getArticleForAdminById(id: number) {
  return prisma.article.findUnique({
    where: { id },
    include: {
      category: true,
      tags: true,
      author: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function getAllArticlesForAdmin() {
  return prisma.article.findMany({
    include: {
      category: true,
      author: {
        select: { id: true, name: true, role: true },
      },
      tags: true,
      _count: {
        select: { comments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createArticle(input: any, authorId: number) {
  const {
    title, slug, excerpt, content, articleType, categoryId, isPublished, tags,
    imageUrls, featuredImageUrl, videoUrl, metaTitle, metaDescription, canonicalUrl,
  } = input;

  const resolvedImages = normalizeArticleImageUrls(imageUrls, featuredImageUrl);

  const article = await prisma.article.create({
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      articleType: articleType || ArticleType.BLOG,
      categoryId: categoryId ? Number(categoryId) : null,
      authorId,
      isPublished: isPublished ?? true,
      publishedAt: isPublished ? new Date() : null,
      imageUrls: articleImageUrlsForStorage(resolvedImages),
      featuredImageUrl: featuredImageFromList(resolvedImages),
      videoUrl: videoUrl || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      tags: {
        create: (tags || []).map((t: string) => ({ tagName: t.trim() })),
      },
    },
    include: {
      category: true,
      tags: true,
    },
  });

  return article;
}

export async function updateArticle(id: number, input: any) {
  const {
    title, slug, excerpt, content, articleType, categoryId, isPublished, tags,
    imageUrls, featuredImageUrl, videoUrl, metaTitle, metaDescription, canonicalUrl,
  } = input;

  const resolvedImages = normalizeArticleImageUrls(imageUrls, featuredImageUrl);

  const existing = await prisma.article.findUnique({
    where: { id },
    select: { publishedAt: true },
  });

  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  // Clear existing tags and recreate if tags provided
  if (tags && Array.isArray(tags)) {
    await prisma.articleTag.deleteMany({
      where: { articleId: id },
    });
  }

  await prisma.article.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      articleType,
      ...(categoryId !== undefined
        ? { categoryId: categoryId ? Number(categoryId) : null }
        : {}),
      isPublished,
      publishedAt: isPublished ? (existing.publishedAt ?? new Date()) : null,
      imageUrls: articleImageUrlsForStorage(resolvedImages),
      featuredImageUrl: featuredImageFromList(resolvedImages),
      videoUrl: videoUrl || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
    },
  });

  if (tags && Array.isArray(tags) && tags.length > 0) {
    await prisma.articleTag.createMany({
      data: tags.map((t: string) => ({ articleId: id, tagName: t.trim() })),
    });
  }

  const updated = await getArticleForAdminById(id);
  if (!updated) {
    throw new Error("NOT_FOUND");
  }

  return updated;
}

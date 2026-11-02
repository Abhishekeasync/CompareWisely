import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { ChevronIcon } from "@/components/icons";
import { BlogSearch } from "@/components/blog/blog-search";
import { ArticleCard, BlogPagination, IssueCluster, splitIssue, type BlogCardModel } from "@/components/blog/blog-magazine";
import { NewsletterSignup } from "@/components/lazy/public-widgets";
import { blogHref, blogPageCount, blogSlice, parseBlogQuery, readingMinutesFromChars } from "@/lib/blog-index";
import { isArticleMediaUrl } from "@/lib/validations/media-url";
import { getArticleContentLengths, getArticles, getBlogCategories } from "@/lib/services/content.service";
import { ArticleType } from "@prisma/client";

export const instant = false;

const BASE = "/finance-updates";
const TITLE = "Statutory & Finance Updates — CompareWisely";
const DESCRIPTION =
  "Official CBIC, GST, and e-invoicing updates affecting Indian business software and accounting compliance.";

type FinancePageProps = {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
  }>;
};

const loadFinanceIndex = cache(async (search: string, category: string | undefined, page: number) => {
  const slice = blogSlice(page);
  const [categories, result] = await Promise.all([
    getBlogCategories(ArticleType.FINANCE_UPDATE),
    getArticles({
      type: ArticleType.FINANCE_UPDATE,
      categorySlug: category,
      search: search || undefined,
      limit: slice.limit,
      offset: slice.offset,
      listFieldsOnly: true,
    }),
  ]);

  const lengths = await getArticleContentLengths(result.articles.map((article) => article.id));

  return {
    categories,
    total: result.total,
    featured: slice.featured,
    articles: result.articles,
    lengths,
  };
});

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://comparewisely.com";
}

function coverUrl(value: string | null | undefined): string | null {
  const url = value?.trim() ?? "";
  if (!url || !isArticleMediaUrl(url)) return null;
  return url;
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CW";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function toCard(
  article: Awaited<ReturnType<typeof loadFinanceIndex>>["articles"][number],
  lengths: Map<number, number>
): BlogCardModel {
  const published = article.publishedAt ?? article.updatedAt;
  const chars = lengths.get(article.id);
  const authorName = article.author?.name || "CompareWisely Editorial";

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt?.trim() || "Read our verification notes and practical implications.",
    category: article.category?.name ?? null,
    authorName,
    initials: initials(authorName),
    dateLabel: published
      ? published.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
      : null,
    dateTime: published ? published.toISOString() : null,
    readingLabel: chars ? `${readingMinutesFromChars(chars)} min read` : null,
    imageUrl: coverUrl(article.featuredImageUrl),
  };
}

export async function generateMetadata({ searchParams }: FinancePageProps): Promise<Metadata> {
  const query = parseBlogQuery(await searchParams);
  const filtered = Boolean(query.search);
  const canonical = blogHref({
    base: BASE,
    category: filtered ? undefined : query.category,
    page: filtered ? undefined : query.page,
  });

  const title = filtered
    ? `Search results for “${query.search}”`
    : query.page > 1
      ? `Statutory & Finance Updates — Page ${query.page}`
      : TITLE;

  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical },
    robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description: DESCRIPTION,
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: DESCRIPTION,
    },
  };
}

export default async function FinanceUpdatesPage({ searchParams }: FinancePageProps) {
  const query = parseBlogQuery(await searchParams);
  const { categories, total, featured, articles, lengths } = await loadFinanceIndex(
    query.search,
    query.category,
    query.page
  );

  const cards = articles.map((article) => toCard(article, lengths));
  const issue = splitIssue(cards, featured);
  const totalPages = blogPageCount(total);
  const activeCategory = categories.find((category) => category.slug === query.category);
  const origin = siteOrigin();
  const href = (options: { search?: string; category?: string; page?: number; hash?: boolean }) =>
    blogHref({ base: BASE, ...options });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "CompareWisely Finance Updates",
    description: DESCRIPTION,
    url: `${origin}${BASE}`,
    blogPost: cards.map((article) => ({
      "@type": "BlogPosting",
      headline: article.title,
      description: article.excerpt,
      url: `${origin}/blog/${article.slug}`,
      datePublished: article.dateTime ?? undefined,
      author: { "@type": "Person", name: article.authorName },
      image: article.imageUrl
        ? article.imageUrl.startsWith("/")
          ? `${origin}${article.imageUrl}`
          : article.imageUrl
        : undefined,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <header className="blog-hero">
        <div className="blog-hero__wash" aria-hidden="true" />
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <ChevronIcon />
            <span>Finance updates</span>
          </nav>
          <p className="eyebrow eyebrow--after">CBIC & statutory</p>
          <h1>Finance & Regulatory Updates</h1>
          <p className="lead">
            Verified compliance updates on Indian GST rules, e-invoicing turnover thresholds, and bank reconciliation mandates.
          </p>
        </div>
      </header>

      <section className="section blog-issue">
        <div className="container">
          {issue.cover ? <IssueCluster cover={issue.cover} /> : null}

          <div className="blog-archive" id="articles">
            <div className="blog-archive__head">
              <h2>From the archive</h2>
              <BlogSearch search={query.search} category={query.category} basePath={BASE} />
            </div>
            <nav className="catalog-filter__options" aria-label="Update categories">
              <Link href={href({ search: query.search })} className="catalog-chip" aria-current={!query.category ? "true" : undefined}>
                All
                {!query.search && !query.category ? <span className="catalog-chip__count">{total}</span> : null}
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={href({ search: query.search, category: category.slug })}
                  className="catalog-chip"
                  aria-current={query.category === category.slug ? "true" : undefined}
                >
                  {category.name}
                  <span className="catalog-chip__count">{category._count.articles}</span>
                </Link>
              ))}
            </nav>
            <p className="tiny muted blog-count">
              {query.search || activeCategory ? (
                <>
                  <b>{total}</b> {total === 1 ? "update" : "updates"}
                  {activeCategory ? <> in {activeCategory.name}</> : null}
                  {query.search ? <> matching “{query.search}”</> : null}
                </>
              ) : (
                <>
                  <b>{total}</b> {total === 1 ? "update" : "updates"}
                </>
              )}
            </p>

            {issue.archive.length > 0 ? (
              <div className="blog-grid">
                {issue.archive.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : total === 0 ? (
              <div className="blog-empty">
                <h2>No updates match that search</h2>
                <p>Try another title, category, or tag. Search looks through titles, descriptions, categories, and tags.</p>
                <Link href={BASE} className="btn">
                  Clear search
                </Link>
              </div>
            ) : !issue.cover ? (
              <div className="blog-empty">
                <h2>That page is past the end of this issue</h2>
                <p>The updates that match are on an earlier page.</p>
                <Link href={href({ search: query.search, category: query.category, hash: true })} className="btn">
                  Back to the first page
                </Link>
              </div>
            ) : null}
          </div>

          <BlogPagination
            page={query.page}
            totalPages={totalPages}
            search={query.search}
            category={query.category}
            basePath={BASE}
          />

          <div className="row gap-12 home-actions" style={{ marginTop: "32px" }}>
            <Link className="btn btn--primary" href="/find-your-best-fit">
              Find Compliant Software
            </Link>
            <Link className="btn" href="/compare">
              Compare GST Capabilities
            </Link>
          </div>

          <NewsletterSignup />
        </div>
      </section>
    </>
  );
}

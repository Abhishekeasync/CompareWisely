import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/page-head";
import { queryStaticParamsSlugs } from "@/lib/db";
import { getArticleBySlug, getAllArticleSlugs } from "@/lib/services/content.service";
import { CommentForm, NewsletterSignup } from "@/components/lazy/public-widgets";
import { ArticleHeroMedia } from "@/components/content/article-hero-media";
import { ArticleType } from "@prisma/client";

export const instant = false;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = await queryStaticParamsSlugs(() => getAllArticleSlugs(ArticleType.BLOG));
  if (articles === "unavailable") {
    return [{ slug: "_placeholder" }];
  }
  if (articles.length === 0) {
    return [{ slug: "_placeholder" }];
  }
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "_placeholder") {
    return { title: "Blog — CompareWisely" };
  }
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: "Article Not Found — CompareWisely" };
  }

  return {
    title: `${article.title} — CompareWisely`,
    description: article.excerpt || `Read our independent technical analysis of ${article.title}.`,
  };
}

export default async function BlogPostPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  if (slug === "_placeholder") {
    notFound();
  }
  const article = await getArticleBySlug(slug);

  if (!article || !article.isPublished) {
    notFound();
  }

  // Parse markdown content sections
  const paragraphs = article.content.split("\n\n").filter(Boolean);

  return (
    <>
      <PageHead
        current={article.title}
        eyebrow={`${article.category?.name || "Editorial"} · ${article.tags.map((t) => t.tagName).join(", ")}`}
        title={article.title}
        lead={article.excerpt || "Detailed technical analysis and verification notes."}
      />
      <section className="section">
        <div className="container" style={{ maxWidth: "840px" }}>
          {/* Article Metadata Bar */}
          <div
            className="row between"
            style={{
              padding: "12px 16px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              marginBottom: "32px",
              fontSize: "0.85rem",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span>
              By <b>{article.author?.name || "CompareWisely Editorial Lead"}</b>
            </span>
            {article.publishedAt ? (
              <span className="muted">
                Published on <b>{new Date(article.publishedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</b>
              </span>
            ) : null}
          </div>

          <ArticleHeroMedia
            featuredImageUrl={article.featuredImageUrl}
            imageUrls={article.imageUrls}
            videoUrl={article.videoUrl}
          />

          {/* Article Body Content */}
          <div className="reading" style={{ fontSize: "1.05rem", lineHeight: 1.8 }}>
            {paragraphs.map((block, idx) => {
              if (block.startsWith("## ")) {
                return (
                  <h2 key={idx} style={{ fontSize: "1.5rem", marginTop: "32px", marginBottom: "16px" }}>
                    {block.replace("## ", "")}
                  </h2>
                );
              }
              if (block.startsWith("### ")) {
                return (
                  <h3 key={idx} style={{ fontSize: "1.25rem", marginTop: "24px", marginBottom: "12px" }}>
                    {block.replace("### ", "")}
                  </h3>
                );
              }
              if (block.startsWith("1. ") || block.startsWith("- ")) {
                const items = block.split("\n").map((line) => line.replace(/^(\d+\.|\-)\s+/, ""));
                return (
                  <ul key={idx} className="stack gap-8" style={{ paddingLeft: "24px", margin: "16px 0" }}>
                    {items.map((item, itemIdx) => (
                      <li key={itemIdx}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={idx} style={{ marginBottom: "20px" }}>
                  {block}
                </p>
              );
            })}
          </div>

          {/* Contextual Recommendation Callout */}
          <div
            className="panel card--pad"
            style={{
              padding: "24px",
              margin: "40px 0",
              borderLeft: "4px solid var(--primary-text)",
              background: "var(--surface-2)",
            }}
          >
            <span className="eyebrow" style={{ color: "var(--primary-text)" }}>
              Need Software for This Workflow?
            </span>
            <p style={{ margin: "8px 0 16px", fontSize: "0.95rem" }}>
              Take our 6-step questionnaire to get an objective recommendation calibrated to your transaction volume, GST requirements, and budget.
            </p>
            <div className="row gap-12" style={{ flexWrap: "wrap" }}>
              <Link className="btn btn--primary" href="/find-your-best-fit">
                Take Best-Fit Quiz
              </Link>
              <Link className="btn" href="/compare">
                Interactive Comparison Workspace
              </Link>
            </div>
          </div>

          {/* Approved Comments List */}
          <div style={{ marginTop: "48px" }}>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "16px" }}>
              Professional Discussion ({article.comments.length})
            </h3>

            {article.comments.length === 0 ? (
              <p className="tiny muted">
                No comments published yet. Be the first Chartered Accountant or finance professional to share your thoughts below.
              </p>
            ) : (
              <div className="stack gap-16">
                {article.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="panel card--pad"
                    style={{ padding: "16px 20px", background: "var(--surface)" }}
                  >
                    <div className="row between" style={{ marginBottom: "8px" }}>
                      <b style={{ fontSize: "0.95rem" }}>{comment.authorName}</b>
                      <span className="tiny muted">
                        {new Date(comment.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.9rem", color: "var(--fg)", margin: 0, whiteSpace: "pre-line" }}>
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Form */}
            <CommentForm articleSlug={article.slug} />
          </div>

          {/* Newsletter Signup */}
          <NewsletterSignup />
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronIcon } from "@/components/icons";
import { PageHead } from "@/components/page-head";
import { getArticles } from "@/lib/services/content.service";
import { ArticleType } from "@prisma/client";
import { NewsletterSignup } from "@/components/lazy/public-widgets";

export const instant = false;

export const metadata: Metadata = {
  title: "Editorial Blog & Technical Guides — CompareWisely",
  description:
    "Independent analysis, GST compliance breakdowns, and accounting software architectural comparisons for Indian finance teams.",
};

export default async function BlogPage() {
  const { articles, total } = await getArticles({ type: ArticleType.BLOG, listFieldsOnly: true });

  return (
    <>
      <PageHead
        current="Blog"
        eyebrow="Independent Editorial"
        title="Software & Compliance Guides"
        lead="Rigorous, CA-verified breakdowns of Indian GST, e-invoicing, bank feeds, and enterprise accounting software architectures."
      />
      <section className="section">
        <div className="container">
          <div className="row between" style={{ alignItems: "center", marginBottom: "24px" }}>
            <span className="tiny muted">
              Showing <b>{articles.length}</b> of <b>{total}</b> technical guides
            </span>
          </div>

          <div className="story-grid">
            {articles.map((article, idx) => (
              <Link key={article.id} className="story-card" href={`/blog/${article.slug}`}>
                <span className="path-card__index">{String(idx + 1).padStart(2, "0")}</span>
                <span className="eyebrow">
                  {article.category?.name || "Compliance"} · {article.tags.map((t) => t.tagName).join(" / ")}
                </span>
                <span>
                  <b>{article.title}</b>
                  <p>{article.excerpt || "Read our technical analysis and practical implications."}</p>
                </span>
                <span className="path-card__go">
                  Read guide
                  <ChevronIcon />
                </span>
              </Link>
            ))}
          </div>

          <NewsletterSignup />
        </div>
      </section>
    </>
  );
}

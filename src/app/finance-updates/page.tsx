import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { getArticles } from "@/lib/services/content.service";
import { ArticleType } from "@prisma/client";
import { NewsletterSignup } from "@/components/lazy/public-widgets";

export const instant = false;

export const metadata: Metadata = {
  title: "Statutory & Finance Updates — CompareWisely",
  description: "Official CBIC, GST, and e-invoicing updates affecting Indian business software and accounting compliance.",
};

export default async function FinanceUpdatesPage() {
  const { articles } = await getArticles({ type: ArticleType.FINANCE_UPDATE, listFieldsOnly: true });

  return (
    <>
      <PageHead
        current="Finance updates"
        eyebrow="CBIC &amp; Statutory"
        title="Finance &amp; Regulatory Updates"
        lead="Verified compliance updates on Indian GST rules, e-invoicing turnover thresholds, and bank reconciliation mandates."
      />
      <section className="section">
        <div className="container">
          <div className="story-grid">
            {articles.length > 0 ? (
              articles.map((article, idx) => (
                <article key={article.id} className="story-card">
                  <span className="path-card__index">{String(idx + 1).padStart(2, "0")}</span>
                  <span className="eyebrow">
                    {article.category?.name || "Statutory"} · {article.tags.map((t) => t.tagName).join(" / ")}
                  </span>
                  <span>
                    <b>{article.title}</b>
                    <p>{article.excerpt || "Read our verification notes and practical implications."}</p>
                  </span>
                  {article.publishedAt ? (
                    <span className="tiny muted" style={{ marginTop: "12px" }}>
                      Updated: {new Date(article.publishedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  ) : null}
                </article>
              ))
            ) : (
              <article className="story-card">
                <span className="path-card__index">01</span>
                <span className="eyebrow">Statutory Notice</span>
                <span>
                  <b>E-invoicing Turnover Threshold &amp; IRN Generation</b>
                  <p>
                    Verify all turnover criteria with official CBIC circulars before altering your invoicing workflows.
                    Software like Tally Prime, Zoho Books, and Busy Accounting offer direct API-based e-invoicing.
                  </p>
                </span>
              </article>
            )}
          </div>

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

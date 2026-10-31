import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/page-head";
import { Money } from "@/components/money";
import { queryStaticParamsSlugs } from "@/lib/db";
import {
  getAllCuratedComparisonSlugs,
  getCuratedComparison,
} from "@/lib/services/comparison.service";

interface Props {
  params: Promise<{ slug: string }>;
}

export const instant = false;

export async function generateStaticParams() {
  const slugs = await queryStaticParamsSlugs(() => getAllCuratedComparisonSlugs());
  if (slugs === "unavailable") {
    return [{ slug: "_placeholder" }];
  }
  if (slugs.length === 0) {
    return [{ slug: "_placeholder" }];
  }
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "_placeholder") {
    return { title: "Compare — CompareWisely" };
  }
  const data = await getCuratedComparison(slug);

  if (!data) {
    return { title: "Comparison Not Found — CompareWisely" };
  }

  const { page } = data;
  return {
    title: page.metaTitle || `${page.title} (2026 Comparison) — CompareWisely`,
    description:
      page.metaDescription ||
      page.verdictSummary ||
      `Compare ${page.title} side-by-side with verified pricing and GST capabilities.`,
    alternates: {
      canonical: `/compare/${page.slug}`,
    },
    openGraph: {
      title: page.title,
      description: page.verdictSummary || "",
      type: "website",
    },
  };
}

export default async function DynamicCuratedComparePage({ params }: Props) {
  const { slug } = await params;
  if (slug === "_placeholder") {
    notFound();
  }
  const data = await getCuratedComparison(slug);

  if (!data) {
    notFound();
  }

  const { page, matrix } = data;
  const productSlugs = matrix.columns.map((c) => c.slug).join(",");

  return (
    <>
      <PageHead
        current={page.title}
        eyebrow="Head-to-Head Comparison"
        title={page.title}
        lead={page.verdictSummary || "Side-by-side technical evaluation with verified capabilities."}
      />

      <section className="section" style={{ paddingTop: "12px" }}>
        <div className="container">
          {/* Editorial Verdict Banner */}
          {page.verdictSummary ? (
            <div
              style={{
                border: "1px solid var(--border)",
                borderLeft: "4px solid var(--primary-text)",
                background: "var(--surface)",
                padding: "20px 24px",
                marginBottom: "36px",
              }}
            >
              <span className="eyebrow" style={{ marginBottom: "6px" }}>The Independent Verdict</span>
              <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6, color: "var(--fg)" }}>
                {page.verdictSummary}
              </p>
            </div>
          ) : null}

          {/* Interactive Workspace CTA */}
          <div
            className="row between"
            style={{
              padding: "12px 16px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              marginBottom: "24px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <span className="tiny muted">
              Comparing <b>{matrix.columns.length}</b> verified software products
            </span>
            <Link
              href={`/compare?products=${productSlugs}`}
              className="btn btn--sm btn--fill-surface"
            >
              Open in Interactive Tool (Add / Reorder) →
            </Link>
          </div>

          {/* Side-by-Side Matrix Table */}
          <div
            className="compare-matrix-wrap"
            style={{
              overflowX: "auto",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              marginBottom: "36px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", background: "var(--bg)" }}>
                  <th style={{ padding: "16px 20px", width: "260px", minWidth: "200px" }}>
                    <span className="eyebrow">Features & Specs</span>
                  </th>
                  {matrix.columns.map((col) => (
                    <th key={col.slug} style={{ padding: "16px 20px", minWidth: "220px" }}>
                      <div className="row gap-10" style={{ marginBottom: "6px" }}>
                        <span className={`swlogo ${col.slug.split("-")[0]}`}>
                          {col.mono || col.name[0]}
                        </span>
                        <div>
                          <b style={{ fontSize: "1.05rem" }}>
                            <Link href={`/software/${col.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                              {col.name}
                            </Link>
                          </b>
                        </div>
                      </div>
                      <div className="tiny muted">
                        <Money value={col.startingPrice} />
                      </div>
                      <div className="row gap-8" style={{ marginTop: "8px" }}>
                        {col.trialUrl ? (
                          <a
                            href={col.trialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn--primary btn--sm"
                            style={{ fontSize: "0.72rem", padding: "0 10px", minHeight: "30px" }}
                          >
                            Try Demo ↗
                          </a>
                        ) : null}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.categories.map((cat) => (
                  <tr key={`cat-${cat.id}`}>
                    <td
                      colSpan={matrix.columns.length + 1}
                      style={{
                        padding: 0,
                      }}
                    >
                      <div
                        style={{
                          background: "var(--bg)",
                          padding: "10px 20px",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "var(--fg-soft)",
                          borderBottom: "1px solid var(--border)",
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        {cat.name}
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                          {cat.features.map((feat) => (
                            <tr
                              key={feat.id}
                              style={{
                                borderBottom: "1px solid var(--border)",
                                background: feat.isDifferent ? "color-mix(in srgb, var(--primary-soft) 30%, transparent)" : "transparent",
                              }}
                            >
                              <td
                                style={{
                                  padding: "14px 20px",
                                  width: "260px",
                                  minWidth: "200px",
                                  fontSize: "0.9rem",
                                  fontWeight: 550,
                                }}
                              >
                                {feat.name}
                                {feat.isDifferent ? (
                                  <span
                                    style={{
                                      display: "inline-block",
                                      marginLeft: "8px",
                                      fontSize: "0.68rem",
                                      color: "var(--primary-text)",
                                      fontWeight: 700,
                                    }}
                                  >
                                    [Differs]
                                  </span>
                                ) : null}
                              </td>
                              {matrix.columns.map((col) => {
                                const cell = feat.values[col.slug];
                                let badgeText = "—";
                                let badgeColor = "var(--muted)";
                                let badgeBg = "transparent";

                                if (cell?.valueKind === "YES") {
                                  badgeText = cell.textValue || "Yes";
                                  badgeColor = "#16a34a";
                                  badgeBg = "rgba(22, 163, 74, 0.1)";
                                } else if (cell?.valueKind === "NO" || cell?.valueKind === "UNAVAILABLE") {
                                  badgeText = "No";
                                  badgeColor = "#dc2626";
                                  badgeBg = "rgba(220, 38, 38, 0.08)";
                                } else if (cell?.valueKind === "PARTIAL") {
                                  badgeText = cell.textValue || "Partial";
                                  badgeColor = "#d97706";
                                  badgeBg = "rgba(217, 119, 6, 0.1)";
                                } else if (cell?.valueKind === "PAID_ADDON") {
                                  badgeText = "Paid Add-on";
                                  badgeColor = "var(--primary-text)";
                                  badgeBg = "var(--primary-soft)";
                                } else if (cell?.textValue) {
                                  badgeText = cell.textValue;
                                }

                                return (
                                  <td
                                    key={col.slug}
                                    style={{
                                      padding: "14px 20px",
                                      minWidth: "220px",
                                      fontSize: "0.88rem",
                                      verticalAlign: "middle",
                                    }}
                                  >
                                    <span
                                      style={{
                                        display: "inline-block",
                                        padding: "3px 8px",
                                        borderRadius: "2px",
                                        fontWeight: 600,
                                        color: badgeColor,
                                        background: badgeBg,
                                      }}
                                    >
                                      {badgeText}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Actions */}
          <div className="row gap-16" style={{ flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
            <p className="tiny muted" style={{ margin: 0 }}>
              Feature capabilities are verified against live vendor documentation. Last verified on{" "}
              <b>October 2026</b>.
            </p>
            <div className="row gap-12">
              <Link href="/find-your-best-fit" className="btn btn--primary">
                Find Your Best Fit
              </Link>
              <Link href="/software" className="btn">
                Browse All Software
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/page-head";
import { Money } from "@/components/money";
import { queryStaticParamsSlugs } from "@/lib/db";
import { getAllSoftwareSlugs, getSoftwareBySlug, getSoftwarePeers } from "@/lib/services/software.service";

interface Props {
  params: Promise<{ slug: string }>;
}

export const instant = false;

export async function generateStaticParams() {
  const slugs = await queryStaticParamsSlugs(() => getAllSoftwareSlugs());
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
    return { title: "Software — CompareWisely" };
  }
  const product = await getSoftwareBySlug(slug);

  if (!product) {
    return { title: "Software Not Found — CompareWisely" };
  }

  return {
    title: `${product.name} Review, Pricing & Features (2026) — CompareWisely`,
    description: product.tagline || product.description.slice(0, 160),
    alternates: {
      canonical: `/software/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} — Verified Software Profile`,
      description: product.tagline || product.description,
      type: "website",
    },
  };
}

export default async function SoftwareDetailPage({ params }: Props) {
  const { slug } = await params;
  if (slug === "_placeholder") {
    notFound();
  }
  const product = await getSoftwareBySlug(slug);

  if (!product) {
    notFound();
  }

  const competitors = await getSoftwarePeers(product.slug, product.categoryId, 3);

  const pros = (product.pros as string[]) || [];
  const cons = (product.cons as string[]) || [];

  // Group features by category
  const featuresByCategory = product.featureValues.reduce((acc, fv) => {
    const catName = fv.feature.category.name;
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(fv);
    return acc;
  }, {} as Record<string, typeof product.featureValues>);

  // Schema.org SoftwareApplication structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description: product.description,
    applicationCategory: product.category.name,
    operatingSystem: "Windows, Web, Mobile",
    offers: product.pricingPlans.map((plan) => ({
      "@type": "Offer",
      name: plan.planName,
      price: plan.priceAmount ? String(plan.priceAmount) : undefined,
      priceCurrency: plan.currency,
      description: plan.description || plan.displayPrice,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHead
        current={product.name}
        eyebrow={`Verified Software · ${product.category.name}`}
        title={product.name}
        lead={product.tagline || product.description}
      />

      <section className="section" style={{ paddingTop: "12px" }}>
        <div className="container">
          {/* Top Summary Bar & Vendor CTAs */}
          <div
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface)",
              padding: "24px",
              marginBottom: "40px",
            }}
          >
            <div className="row between" style={{ flexWrap: "wrap", gap: "20px" }}>
              <div className="row gap-16">
                <span className={`swlogo swlogo--lg ${product.slug.split("-")[0]}`}>
                  {product.mono || product.name[0]}
                </span>
                <div>
                  <h2 style={{ fontSize: "1.4rem", margin: 0 }}>{product.name}</h2>
                  <span className="tiny muted">
                    Category: <b>{product.category.name}</b>
                    {product.verifiedAt ? (
                      <>
                        {" "}· Verified on{" "}
                        <b>
                          {new Date(product.verifiedAt).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                          })}
                        </b>
                      </>
                    ) : null}
                  </span>
                </div>
              </div>

              {/* Vendor Actions */}
              <div className="row gap-12" style={{ flexWrap: "wrap" }}>
                {product.websiteUrl ? (
                  <a
                    href={product.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--sm"
                  >
                    Official Website ↗
                  </a>
                ) : null}
                {product.trialUrl ? (
                  <a
                    href={product.trialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--primary btn--sm"
                  >
                    Try / Demo ↗
                  </a>
                ) : null}
                <Link
                  href={`/compare?products=${product.slug}`}
                  className="btn btn--sm btn--fill-bg"
                >
                  Compare with Others
                </Link>
              </div>
            </div>

            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
              <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.6, color: "var(--fg-soft)" }}>
                {product.description}
              </p>
            </div>
          </div>

          {/* Pricing Plans Section */}
          <div style={{ marginBottom: "48px" }}>
            <div className="row between" style={{ marginBottom: "16px" }}>
              <div>
                <span className="eyebrow">Pricing Structure</span>
                <h3 style={{ fontSize: "1.3rem", margin: "4px 0 0" }}>Verified Plans & Licensing</h3>
              </div>
              <span className="tiny muted">No affiliate markups · Direct vendor rates</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
              }}
            >
              {product.pricingPlans.map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    border: plan.isStartingPrice
                      ? "2px solid var(--primary-text)"
                      : "1px solid var(--border)",
                    padding: "20px",
                    background: "var(--surface)",
                  }}
                >
                  {plan.isStartingPrice ? (
                    <span
                      className="eyebrow"
                      style={{
                        background: "var(--primary-soft)",
                        padding: "2px 8px",
                        display: "inline-block",
                        marginBottom: "12px",
                      }}
                    >
                      Base / Starting Tier
                    </span>
                  ) : null}
                  <h4 style={{ fontSize: "1.1rem", margin: "0 0 6px" }}>{plan.planName}</h4>
                  <div style={{ fontSize: "1.4rem", fontWeight: 750, color: "var(--fg)", marginBottom: "8px" }}>
                    {plan.displayPrice ? <Money value={plan.displayPrice} /> : "Contact Vendor"}
                  </div>
                  <span className="tiny muted block" style={{ textTransform: "capitalize", marginBottom: "12px" }}>
                    Billing Cycle: {plan.billingCycle.toLowerCase().replace("_", " ")}
                  </span>
                  {plan.description ? (
                    <p className="tiny muted" style={{ lineHeight: 1.5, marginBottom: "16px" }}>
                      {plan.description}
                    </p>
                  ) : null}
                  {plan.verificationSourceUrl ? (
                    <a
                      href={plan.verificationSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tiny"
                      style={{ color: "var(--primary-text)", textDecoration: "underline" }}
                    >
                      View vendor pricing proof ↗
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
            <p className="tiny muted" style={{ marginTop: "12px" }}>
              * Software prices are subject to GST and vendor revision. Always confirm terms with the vendor before subscribing.
            </p>
          </div>

          {/* Pros & Cons */}
          <div style={{ marginBottom: "48px" }}>
            <span className="eyebrow">Editorial Verdict</span>
            <h3 style={{ fontSize: "1.3rem", margin: "4px 0 20px" }}>Advantages & Trade-offs</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "24px",
              }}
            >
              {/* Pros */}
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderTop: "3px solid #16a34a",
                  padding: "20px",
                  background: "var(--surface)",
                }}
              >
                <h4 style={{ color: "#16a34a", margin: "0 0 12px", fontSize: "1.05rem" }}>
                  ✓ What Works Well
                </h4>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.9rem", lineHeight: 1.6 }}>
                  {pros.map((p, idx) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderTop: "3px solid #dc2626",
                  padding: "20px",
                  background: "var(--surface)",
                }}
              >
                <h4 style={{ color: "#dc2626", margin: "0 0 12px", fontSize: "1.05rem" }}>
                  ⚠ Limitations to Keep in Mind
                </h4>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.9rem", lineHeight: 1.6 }}>
                  {cons.map((c, idx) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Feature Matrix Table */}
          <div style={{ marginBottom: "48px" }}>
            <span className="eyebrow">Feature Checklist</span>
            <h3 style={{ fontSize: "1.3rem", margin: "4px 0 16px" }}>Verified Capability Breakdown</h3>

            <div style={{ border: "1px solid var(--border)", background: "var(--surface)" }} className="feature-matrix">
              {Object.entries(featuresByCategory).map(([catName, featureList]) => (
                <div key={catName} style={{ borderBottom: "1px solid var(--border)" }}>
                  <div
                    style={{
                      background: "var(--bg)",
                      padding: "10px 16px",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--fg-soft)",
                    }}
                  >
                    {catName}
                  </div>
                  <div>
                    {featureList.map((fv) => {
                      let badge = "Unknown";
                      let badgeColor = "var(--muted)";
                      let badgeBg = "var(--bg)";

                      if (fv.valueKind === "YES") {
                        badge = "Supported";
                        badgeColor = "#16a34a";
                        badgeBg = "rgba(22, 163, 74, 0.1)";
                      } else if (fv.valueKind === "NO" || fv.valueKind === "UNAVAILABLE") {
                        badge = "Not Supported";
                        badgeColor = "#dc2626";
                        badgeBg = "rgba(220, 38, 38, 0.1)";
                      } else if (fv.valueKind === "PARTIAL") {
                        badge = "Partial Support";
                        badgeColor = "#d97706";
                        badgeBg = "rgba(217, 119, 6, 0.1)";
                      } else if (fv.valueKind === "PAID_ADDON") {
                        badge = "Paid Add-on";
                        badgeColor = "var(--primary-text)";
                        badgeBg = "var(--primary-soft)";
                      }

                      return (
                        <div
                          key={fv.id}
                          className="row between"
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid var(--border)",
                            fontSize: "0.88rem",
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>{fv.feature.name}</span>
                          <div className="row gap-8">
                            {fv.textValue ? (
                              <span className="tiny muted">{fv.textValue}</span>
                            ) : null}
                            <span
                              style={{
                                fontSize: "0.74rem",
                                fontWeight: 650,
                                padding: "2px 8px",
                                borderRadius: "var(--r-sm)",
                                color: badgeColor,
                                background: badgeBg,
                              }}
                            >
                              {badge}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Competitor Shortcuts */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "32px" }}>
            <span className="eyebrow">Compare Against Top Alternatives</span>
            <h4 style={{ fontSize: "1.1rem", margin: "6px 0 16px" }}>
              See how {product.name} stacks up head-to-head
            </h4>
            <div className="row gap-12" style={{ flexWrap: "wrap" }}>
              {competitors.map((comp) => (
                <Link
                  key={comp.id}
                  href={`/compare?products=${product.slug},${comp.slug}`}
                  className="btn btn--sm btn--fill-surface"
                >
                  {product.name} vs {comp.name} →
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { Money } from "@/components/money";
import { getAllCategories, getSoftwareProducts } from "@/lib/services/software.service";

export const metadata: Metadata = {
  title: "Software Directory — CompareWisely",
  description:
    "Discover, evaluate and compare verified ERP, accounting, invoicing and inventory software for Indian businesses and Chartered Accountants.",
};

export const instant = false;

interface Props {
  searchParams: Promise<{
    category?: string;
    size?: string;
    search?: string;
  }>;
}

import { CatalogFilters } from "@/components/software/catalog-filters";

export default async function SoftwareDirectoryPage({ searchParams }: Props) {
  const { category: categorySlug, size: businessSize, search } = await searchParams;

  const [categories, products] = await Promise.all([
    getAllCategories(),
    getSoftwareProducts({
      categorySlug,
      businessSize,
      search,
    }),
  ]);

  return (
    <>
      <PageHead
        variant="catalog"
        current="Software Directory"
        eyebrow="Independent Catalogue"
        title="Business Software Directory"
        lead="Explore verified accounting, invoicing, GST, and ERP software for India. Every capability and price tier is independently checked."
        after={
          <CatalogFilters
            categories={categories}
            categorySlug={categorySlug}
            businessSize={businessSize}
          />
        }
      />

      <section className="section section--catalog">
        <div className="container">
          <div className="catalog-results row between">
            <span className="tiny muted">
              Showing <b>{products.length}</b> verified {products.length === 1 ? "product" : "products"}
            </span>
            <span className="tiny muted">No sponsored rankings · Strictly editorial</span>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="stack center" style={{ padding: "64px 0", textAlign: "center" }}>
              <p className="lead">No software matches your current filter combination.</p>
              <div style={{ marginTop: "16px" }}>
                <Link href="/software" className="btn btn--primary">
                  Clear Filters
                </Link>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "24px",
                marginTop: "24px",
              }}
            >
              {products.map((item) => {
                const startingPlan = item.pricingPlans[0];
                const prosList = (item.pros as string[]) || [];

                return (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid var(--border)",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      background: "var(--surface)",
                      position: "relative",
                    }}
                  >
                    <div>
                      {/* Header with Logo & Verified Badge */}
                      <div className="row between" style={{ marginBottom: "16px" }}>
                        <div className="row gap-12">
                          <span className={`swlogo swlogo--lg ${item.slug.split("-")[0]}`}>
                            {item.mono || item.name[0]}
                          </span>
                          <div>
                            <h2 style={{ fontSize: "1.2rem", margin: 0, fontWeight: 700 }}>
                              <Link href={`/software/${item.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                                {item.name}
                              </Link>
                            </h2>
                            <span className="tiny muted">{item.category.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tagline & Description */}
                      <p style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--fg)", marginBottom: "8px" }}>
                        {item.tagline}
                      </p>
                      <p className="tiny muted" style={{ lineHeight: 1.5, marginBottom: "16px" }}>
                        {item.description}
                      </p>

                      {/* Starting Price Box */}
                      <div
                        style={{
                          background: "var(--bg)",
                          padding: "10px 14px",
                          marginBottom: "16px",
                          borderLeft: "3px solid var(--primary-text)",
                        }}
                      >
                        <span className="tiny muted block">Starting Price</span>
                        <b style={{ fontSize: "1rem" }}>
                          {startingPlan?.displayPrice ? (
                            <Money value={startingPlan.displayPrice} />
                          ) : (
                            "Contact Vendor"
                          )}
                        </b>
                        {item.verifiedAt ? (
                          <span className="tiny muted block" style={{ fontSize: "0.72rem", marginTop: "2px" }}>
                            Verified on {new Date(item.verifiedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                          </span>
                        ) : null}
                      </div>

                      {/* Key Pros */}
                      {prosList.length > 0 ? (
                        <div style={{ marginBottom: "20px" }}>
                          <span className="eyebrow" style={{ fontSize: "0.68rem", marginBottom: "6px" }}>
                            Key Strengths
                          </span>
                          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.84rem", color: "var(--fg-soft)" }}>
                            {prosList.slice(0, 3).map((pro, idx) => (
                              <li key={idx} style={{ marginBottom: "4px" }}>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>

                    {/* Card Actions */}
                    <div className="row gap-8" style={{ paddingTop: "16px", borderTop: "1px solid var(--border)", marginTop: "16px" }}>
                      <Link href={`/software/${item.slug}`} className="btn btn--sm grow center">
                        Full Profile
                      </Link>
                      <Link
                        href={`/compare?products=${item.slug}`}
                        className="btn btn--primary btn--sm grow center"
                      >
                        Compare
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

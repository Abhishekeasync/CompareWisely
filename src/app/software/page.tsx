import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { CatalogActiveFilters } from "@/components/software/catalog-active-filters";
import { CatalogFilters } from "@/components/software/catalog-filters";
import { SoftwareCatalogCard } from "@/components/software/software-catalog-card";
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
            search={search}
          />
        }
      />

      <section className="section section--catalog" aria-labelledby="catalog-results-heading">
        <div className="container">
          <div className="catalog-results row between">
            <h2 id="catalog-results-heading" className="catalog-results__heading tiny muted">
              Showing <b>{products.length}</b> verified {products.length === 1 ? "product" : "products"}
            </h2>
            <span className="tiny muted">No sponsored rankings · Strictly editorial</span>
          </div>

          <CatalogActiveFilters
            categories={categories}
            categorySlug={categorySlug}
            businessSize={businessSize}
            search={search}
          />

          {products.length === 0 ? (
            <div className="catalog-empty">
              <p className="catalog-empty__title">No matches for this view</p>
              <p className="lead catalog-empty__lead">
                Try clearing filters or searching with a broader term — every listing here is editorially verified, not sponsored.
              </p>
              <Link href="/software" className="btn btn--primary">
                Reset directory
              </Link>
            </div>
          ) : (
            <ul className="catalog-grid">
              {products.map((item) => (
                <li key={item.id}>
                  <SoftwareCatalogCard item={item} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

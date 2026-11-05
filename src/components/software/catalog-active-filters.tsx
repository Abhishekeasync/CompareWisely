import Link from "next/link";
import { businessSizeLabel } from "@/components/software/catalog-filters";

type CategoryRow = {
  slug: string;
  name: string;
};

type Props = {
  categories: CategoryRow[];
  categorySlug?: string;
  businessSize?: string;
  search?: string;
};

function hrefWithoutCategory(categorySlug: string | undefined, businessSize?: string, search?: string) {
  const params = new URLSearchParams();
  if (businessSize) params.set("size", businessSize);
  if (search?.trim()) params.set("search", search.trim());
  const q = params.toString();
  return q ? `/software?${q}` : "/software";
}

function hrefWithoutSize(categorySlug?: string, search?: string) {
  const params = new URLSearchParams();
  if (categorySlug) params.set("category", categorySlug);
  if (search?.trim()) params.set("search", search.trim());
  const q = params.toString();
  return q ? `/software?${q}` : "/software";
}

function hrefWithoutSearch(categorySlug?: string, businessSize?: string) {
  const params = new URLSearchParams();
  if (categorySlug) params.set("category", categorySlug);
  if (businessSize) params.set("size", businessSize);
  const q = params.toString();
  return q ? `/software?${q}` : "/software";
}

export function CatalogActiveFilters({ categories, categorySlug, businessSize, search }: Props) {
  const category = categories.find((c) => c.slug === categorySlug);
  const sizeLabel = businessSize ? businessSizeLabel(businessSize) : null;
  const term = search?.trim() || null;

  if (!category && !sizeLabel && !term) return null;

  return (
    <div className="catalog-active" aria-label="Active filters">
      <span className="catalog-active__label tiny muted">Filtered by</span>
      <div className="catalog-active__chips">
        {category ? (
          <Link
            href={hrefWithoutCategory(categorySlug, businessSize, search)}
            className="catalog-active__chip"
          >
            {category.name}
            <span className="catalog-active__remove" aria-hidden="true">
              ×
            </span>
            <span className="sr-only">Remove category filter</span>
          </Link>
        ) : null}
        {sizeLabel ? (
          <Link href={hrefWithoutSize(categorySlug, search)} className="catalog-active__chip">
            {sizeLabel}
            <span className="catalog-active__remove" aria-hidden="true">
              ×
            </span>
            <span className="sr-only">Remove business size filter</span>
          </Link>
        ) : null}
        {term ? (
          <Link href={hrefWithoutSearch(categorySlug, businessSize)} className="catalog-active__chip">
            “{term}”
            <span className="catalog-active__remove" aria-hidden="true">
              ×
            </span>
            <span className="sr-only">Clear search</span>
          </Link>
        ) : null}
        <Link href="/software" className="catalog-active__clear tiny">
          Clear all
        </Link>
      </div>
    </div>
  );
}

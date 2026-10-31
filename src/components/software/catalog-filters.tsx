import Link from "next/link";

const BUSINESS_SIZES = [
  { value: "sole", label: "Sole Proprietor" },
  { value: "small", label: "Small Team (1–10)" },
  { value: "growing", label: "Growing (11–50)" },
  { value: "mid", label: "Mid-Market (50+)" },
] as const;

type CategoryRow = {
  id: number;
  slug: string;
  name: string;
  _count: { products: number };
};

type Props = {
  categories: CategoryRow[];
  categorySlug?: string;
  businessSize?: string;
};

function categoryHref(slug: string | null, businessSize?: string) {
  if (!slug && !businessSize) return "/software";
  const params = new URLSearchParams();
  if (slug) params.set("category", slug);
  if (businessSize) params.set("size", businessSize);
  return `/software?${params.toString()}`;
}

export function CatalogFilters({ categories, categorySlug, businessSize }: Props) {
  return (
    <div className="catalog-filters">
      <fieldset className="catalog-filter">
        <legend className="catalog-filter__legend">Category</legend>
        <div className="catalog-filter__options">
          <Link
            href={categoryHref(null, businessSize)}
            className="catalog-chip"
            aria-current={!categorySlug ? "true" : undefined}
          >
            All software
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={categoryHref(cat.slug, businessSize)}
              className="catalog-chip"
              aria-current={categorySlug === cat.slug ? "true" : undefined}
            >
              {cat.name}
              <span className="catalog-chip__count">{cat._count.products}</span>
            </Link>
          ))}
        </div>
      </fieldset>

      <fieldset className="catalog-filter">
        <legend className="catalog-filter__legend">Business size</legend>
        <div className="catalog-filter__options">
          <Link
            href={categoryHref(categorySlug ?? null, undefined)}
            className="catalog-chip"
            aria-current={!businessSize ? "true" : undefined}
          >
            Any size
          </Link>
          {BUSINESS_SIZES.map((sz) => (
            <Link
              key={sz.value}
              href={categoryHref(categorySlug ?? null, sz.value)}
              className="catalog-chip"
              aria-current={businessSize === sz.value ? "true" : undefined}
            >
              {sz.label}
            </Link>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

import { ChevronIcon } from "@/components/icons";
import { CatalogOptionLink } from "@/components/software/catalog-option-link";

const BUSINESS_SIZES = [
  { value: "sole", label: "Sole Proprietor" },
  { value: "small", label: "Small Team (1–10)" },
  { value: "growing", label: "Growing (11–50)" },
  { value: "mid", label: "Mid-Market (50+)" },
] as const;

export function businessSizeLabel(value: string) {
  return BUSINESS_SIZES.find((s) => s.value === value)?.label ?? value;
}

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
  search?: string;
};

function categoryHref(slug: string | null, businessSize?: string) {
  if (!slug && !businessSize) return "/software";
  const params = new URLSearchParams();
  if (slug) params.set("category", slug);
  if (businessSize) params.set("size", businessSize);
  return `/software?${params.toString()}`;
}

export function CatalogFilters({ categories, categorySlug, businessSize, search }: Props) {
  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const categoryValue = activeCategory?.name ?? "All software";
  const sizeValue = businessSize ? businessSizeLabel(businessSize) : "Any size";

  return (
    <div className="catalog-filters">
      <form className="catalog-search" action="/software" method="get" role="search">
        {categorySlug ? <input type="hidden" name="category" value={categorySlug} /> : null}
        {businessSize ? <input type="hidden" name="size" value={businessSize} /> : null}
        <label className="sr-only" htmlFor="catalog-search-input">
          Search software directory
        </label>
        <input
          id="catalog-search-input"
          className="catalog-search__input"
          type="search"
          name="search"
          defaultValue={search ?? ""}
          placeholder="Search by product name or keyword…"
          autoComplete="off"
        />
        <button type="submit" className="btn btn--sm catalog-search__submit">
          Search
        </button>
      </form>

      <div className="catalog-filters__panels">
        <details name="catalog-facet" className="catalog-facet">
          <summary className="catalog-facet__trigger">
            <span className="catalog-facet__trigger-main">
              <span className="catalog-facet__trigger-label">Category</span>
              <span className="catalog-facet__trigger-value">{categoryValue}</span>
            </span>
            <span className="catalog-facet__chevron" aria-hidden="true">
              <ChevronIcon />
            </span>
          </summary>
          <div className="catalog-facet__panel">
            <p className="catalog-facet__hint tiny muted">
              {activeCategory ? (
                <>
                  <b>{activeCategory._count.products}</b> verified listings in this category.
                </>
              ) : (
                <>Counts show verified listings in each category.</>
              )}
            </p>
            <div
              className="catalog-facet__list catalog-facet__list--scroll"
              role="list"
              aria-label="Software categories"
            >
              <CatalogOptionLink
                href={categoryHref(null, businessSize)}
                selected={!categorySlug}
                label="All software"
              />
              {categories.map((cat) => (
                <CatalogOptionLink
                  key={cat.id}
                  href={categoryHref(cat.slug, businessSize)}
                  selected={categorySlug === cat.slug}
                  label={cat.name}
                  count={cat._count.products}
                />
              ))}
            </div>
          </div>
        </details>

        <details name="catalog-facet" className="catalog-facet">
          <summary className="catalog-facet__trigger">
            <span className="catalog-facet__trigger-main">
              <span className="catalog-facet__trigger-label">Business size</span>
              <span className="catalog-facet__trigger-value">{sizeValue}</span>
            </span>
            <span className="catalog-facet__chevron" aria-hidden="true">
              <ChevronIcon />
            </span>
          </summary>
          <div className="catalog-facet__panel">
            <p className="catalog-facet__hint tiny muted">
              Optional — narrow listings to products suited to your team scale.
            </p>
            <div className="catalog-facet__list" role="list" aria-label="Business size">
              <CatalogOptionLink
                href={categoryHref(categorySlug ?? null, undefined)}
                selected={!businessSize}
                label="Any size"
              />
              {BUSINESS_SIZES.map((sz) => (
                <CatalogOptionLink
                  key={sz.value}
                  href={categoryHref(categorySlug ?? null, sz.value)}
                  selected={businessSize === sz.value}
                  label={sz.label}
                />
              ))}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

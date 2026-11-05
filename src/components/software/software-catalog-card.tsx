import Link from "next/link";
import { Money } from "@/components/money";
import { SoftwareProductMark } from "@/components/software/product-mark";

type CatalogProduct = {
  id: number;
  slug: string;
  name: string;
  mono: string | null;
  logoUrl: string | null;
  tagline: string | null;
  description: string;
  verifiedAt: Date | null;
  category: { name: string };
  pricingPlans: { displayPrice: string | null }[];
  pros: unknown;
};

export function SoftwareCatalogCard({ item }: { item: CatalogProduct }) {
  const startingPlan = item.pricingPlans[0];
  const prosList = (item.pros as string[]) || [];

  return (
    <article className="catalog-card">
      <div className="catalog-card__glow" aria-hidden="true" />

      <div className="catalog-card__body">
        <header className="catalog-card__head">
          <div className="catalog-card__identity">
            <SoftwareProductMark
              slug={item.slug}
              name={item.name}
              mono={item.mono}
              logoUrl={item.logoUrl}
              size="lg"
            />
            <div className="catalog-card__titles">
              <h2 className="catalog-card__name">
                <Link href={`/software/${item.slug}`}>{item.name}</Link>
              </h2>
              <span className="tiny muted">{item.category.name}</span>
            </div>
          </div>
          {item.verifiedAt ? (
            <span className="catalog-card__verified" title="Independently verified profile">
              Verified
            </span>
          ) : null}
        </header>

        {item.tagline ? <p className="catalog-card__tagline">{item.tagline}</p> : null}
        <p className="catalog-card__desc">{item.description}</p>

        <div className="catalog-card__price">
          <span className="catalog-card__price-label">Starting price</span>
          <b className="catalog-card__price-value">
            {startingPlan?.displayPrice ? <Money value={startingPlan.displayPrice} /> : "Contact vendor"}
          </b>
          {item.verifiedAt ? (
            <span className="catalog-card__verified-date tiny muted">
              Checked{" "}
              {new Date(item.verifiedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
            </span>
          ) : null}
        </div>

        {prosList.length > 0 ? (
          <div className="catalog-card__pros">
            <span className="eyebrow catalog-card__pros-label">Key strengths</span>
            <ul className="catalog-card__pros-list">
              {prosList.slice(0, 3).map((pro, idx) => (
                <li key={idx}>{pro}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <footer className="catalog-card__actions">
        <Link href={`/software/${item.slug}`} className="btn btn--sm grow center">
          Full profile
        </Link>
        <Link href={`/compare?products=${item.slug}`} className="btn btn--primary btn--sm grow center">
          Compare
        </Link>
      </footer>
    </article>
  );
}

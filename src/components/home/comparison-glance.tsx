import Link from "next/link";
import { ChevronIcon } from "@/components/icons";
import { Money } from "@/components/money";
import { ComparisonGlanceHeading, MacFrame } from "@/components/home/mac-frame";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import type {
  ComparisonGlance,
  ComparisonGlanceProduct,
} from "@/lib/comparison-glance";

export type {
  ComparisonGlance,
  ComparisonGlanceProduct,
  ComparisonGlanceRow,
  ComparisonGlanceSection,
} from "@/lib/comparison-glance";

function productMark(product: ComparisonGlanceProduct) {
  if (product.logo) {
    return <img className="comparison-glance__logo" src={product.logo} alt="" />;
  }
  const key = product.mono?.slice(0, 1) || product.name?.[0] || "?";
  return (
    <span className={`swlogo swlogo--sm ${product.swClass ?? ""}`.trim()} aria-hidden="true">
      {key}
    </span>
  );
}

function valueClass(value: string, long?: boolean) {
  if (long) return "comparison-glance__val comparison-glance__val--text";
  const normalized = value.trim().toLowerCase();
  if (normalized === "yes") return "comparison-glance__val comparison-glance__val--yes";
  if (normalized === "no") return "comparison-glance__val comparison-glance__val--no";
  if (normalized === "partial" || normalized.includes("add-on") || normalized.includes("paid")) {
    return "comparison-glance__val comparison-glance__val--mid";
  }
  if (normalized === "not listed" || normalized === "—") {
    return "comparison-glance__val comparison-glance__val--no";
  }
  return "comparison-glance__val";
}

function previewSections(sections: ComparisonGlance["sections"], previewRows: number) {
  let remaining = previewRows;
  const visible: ComparisonGlance["sections"] = [];
  for (const section of sections) {
    if (remaining <= 0) break;
    const rows = section.rows.slice(0, remaining);
    remaining -= rows.length;
    if (rows.length > 0) visible.push({ ...section, rows });
  }
  return visible;
}

export function ComparisonGlanceMatrix({
  title,
  products,
  sections,
  scrollable = false,
  previewRows,
}: Pick<ComparisonGlance, "title" | "products" | "sections"> & {
  scrollable?: boolean;
  previewRows?: number;
}) {
  const visibleSections = previewRows == null ? sections : previewSections(sections, previewRows);
  if (products.length === 0) {
    return (
      <p className="comparison-glance__fallback">The published comparison is Tally Prime against Zoho Books.</p>
    );
  }

  return (
    <div
      className={`comparison-glance__matrix-wrap${scrollable ? " comparison-glance__matrix-wrap--scroll" : ""}`}
      data-lenis-prevent={scrollable ? "" : undefined}
    >
      <table className="comparison-glance__matrix">
        <caption className="sr-only">
          {title}: {products.map((product) => product.name).join(" versus ")}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="comparison-glance__corner">
              <span className="sr-only">Capability</span>
            </th>
            {products.map((product) => (
              <th key={product.name} scope="col" className="comparison-glance__head">
                <div className="comparison-glance__product">
                  {productMark(product)}
                  <span className="comparison-glance__product-name">{product.name}</span>
                  <span className="comparison-glance__product-price tiny">
                    <Money value={product.price} />
                  </span>
                  {product.tagline ? <p className="comparison-glance__product-note">{product.tagline}</p> : null}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        {visibleSections.map((section) => (
          <tbody key={section.id}>
            <tr className="comparison-glance__section-row">
              <th scope="colgroup" colSpan={products.length + 1} className="comparison-glance__section">
                {section.name}
              </th>
            </tr>
            {section.rows.map((row) => (
              <tr
                key={row.id}
                className={row.code === "starting_price" ? "comparison-glance__row--starting-price" : undefined}
              >
                <th scope="row">{row.name}</th>
                {row.values.map((value, index) => (
                  <td
                    key={`${row.id}-${index}`}
                    data-product={products[index]?.name}
                    className={
                      row.differs && !row.long ? "comparison-glance__cell--diff" : undefined
                    }
                  >
                    <span className={valueClass(value, row.long)}>{value}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function comparisonPath(href: string) {
  try {
    return new URL(href, SITE_URL).pathname;
  } catch {
    return href;
  }
}

export function ComparisonGlanceHero({ data }: { data: ComparisonGlance }) {
  const path = comparisonPath(data.href);

  return (
    <div className="hero-well" aria-labelledby="lead-comparison-heading">
      <header className="comparison-glance__intro">
        <ComparisonGlanceHeading title={data.title} />
        <p className="comparison-glance__deck">Side-by-side matrix from the published comparison. Prices are indicative.</p>
      </header>

      <Link
        className="comparison-glance comparison-glance--hero"
        href={data.href}
        aria-label={`Open the full ${data.title} comparison`}
      >
        <MacFrame title={`${SITE_NAME} — Matrix`} location={path}>
          <ComparisonGlanceMatrix title={data.title} products={data.products} sections={data.sections} scrollable />
          <span className="path-card__go comparison-glance__cta">
            Open the comparison
            <ChevronIcon />
          </span>
        </MacFrame>
      </Link>
    </div>
  );
}

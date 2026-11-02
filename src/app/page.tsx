import type { Metadata } from "next";
import Link from "next/link";
import { ChevronIcon } from "@/components/icons";
import { ComparisonGlanceHero } from "@/components/home/comparison-glance";
import { FeatureStage } from "@/components/home/feature-stage";
import { MorphingHeadline } from "@/components/home/morphing-headline";
import { buildLeadComparisonGlance } from "@/lib/comparison-glance";
import { PRODUCT_LOGOS, type ProductLogoKey } from "@/lib/product-logos";
import { getSoftwareBySlug } from "@/lib/services/software.service";
import { getCuratedComparison } from "@/lib/services/comparison.service";

export const metadata: Metadata = {
  title: "CompareWisely",
  description: "India's independent comparison platform for ERP and accounting software. Built for MSMEs, CAs and finance teams.",
};

// This page queries the database at render time; allow blocking prerender
export const instant = false;

const NOTES = [
  {
    href: "/blog/gstr-2b-reconciliation",
    kicker: "GST · 12 min",
    title: "GSTR-2B reconciliation",
    body: "How Tally, Zoho and Busy treat purchase reconciliation when 2B and your books disagree.",
    action: "Read the note",
  },
  {
    href: "/finance-updates",
    kicker: "CBIC",
    title: "E-invoicing in 2026",
    body: "The turnover threshold note, with a reminder to confirm the live rule before you change a filing process.",
    action: "Read the update",
  },
] as const;

const COMPARISON_HREF = "/compare/tally-prime-vs-zoho-books";

function mapGlanceProducts(items: NonNullable<Awaited<ReturnType<typeof getSoftwareBySlug>>>[]) {
  return items.map((item) => {
    const startingPlan = item.pricingPlans.find((plan) => plan.isStartingPrice);
    const pros = (item.pros as string[]) || [];
    const key = item.slug.split("-")[0] as ProductLogoKey;
    return {
      name: item.name,
      price: startingPlan?.displayPrice || "Contact vendor",
      logo: PRODUCT_LOGOS[key] ?? null,
      tagline: pros[0] || item.tagline || undefined,
      mono: item.mono || item.name[0],
      swClass: key,
    };
  });
}

export default async function HomePage() {
  const [curatedData, tallyProduct, zohoProduct] = await Promise.all([
    getCuratedComparison("tally-prime-vs-zoho-books"),
    getSoftwareBySlug("tally-prime"),
    getSoftwareBySlug("zoho-books"),
  ]);

  const glanceProducts = [tallyProduct, zohoProduct].filter(
    (p): p is NonNullable<typeof p> => p !== undefined,
  );

  const productSlugs = glanceProducts.map((item) => item.slug);
  const leadComparison =
    glanceProducts.length > 0
      ? buildLeadComparisonGlance({
          title: curatedData?.page.title || "Tally Prime vs Zoho Books",
          href: COMPARISON_HREF,
          products: mapGlanceProducts(glanceProducts),
          categories: curatedData?.matrix.categories ?? [],
          productSlugs,
        })
      : null;

  return (
    <>
      <section className="hero hero--morph">
        <div className="container hero__intro">
          <MorphingHeadline />
          <p className="lead">
            Trade-offs in view for MSMEs, CAs and finance teams. Prices are starting points. Confirm them with the vendor before you decide.
          </p>
          <div className="row gap-12 home-actions">
            <Link className="btn btn--primary" href="/find-your-best-fit">
              Find your best fit
            </Link>
            <Link className="btn" href={COMPARISON_HREF}>
              Read comparison
            </Link>
          </div>
          <p className="hero__note">Independent · No vendor affiliation</p>
        </div>

        {leadComparison ? (
          <div className="container">
            <ComparisonGlanceHero data={leadComparison} />
          </div>
        ) : null}
      </section>

      {leadComparison ? <FeatureStage comparison={leadComparison} /> : null}

      <section className="section section--follow" aria-labelledby="reading-heading">
        <div className="container">
          <header className="section-head">
            <h2 id="reading-heading">On the desk</h2>
            <p className="muted">One GST note and one compliance update.</p>
          </header>
          <div className="story-grid">
            {NOTES.map((note, index) => (
              <Link key={note.href} className="story-card" href={note.href}>
                <span className="path-card__index">{String(index + 4).padStart(2, "0")}</span>
                <span className="eyebrow">{note.kicker}</span>
                <span>
                  <b>{note.title}</b>
                  <p>{note.body}</p>
                </span>
                <span className="path-card__go">
                  {note.action}
                  <ChevronIcon />
                </span>
              </Link>
            ))}
          </div>
          <p className="trust">
            CompareWisely is not affiliated with the software vendors reviewed. Information is general guidance. Verify prices, GST rules and product features with the official source.
          </p>
        </div>
      </section>
    </>
  );
}

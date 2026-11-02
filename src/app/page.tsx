import type { Metadata } from "next";
import Link from "next/link";
import { ChevronIcon } from "@/components/icons";
import { ComparisonGlanceHero } from "@/components/home/comparison-glance";
import { FeatureStage } from "@/components/home/feature-stage";
import { MorphingHeadline } from "@/components/home/morphing-headline";
import {
  buildLeadComparisonGlance,
  mapGlanceProducts,
} from "@/lib/comparison-glance";
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
    index: "01",
    badge: "GST Reconciliation",
    badgeType: "gst",
    readTime: "12 min read",
    highlight: "Tally · Zoho · Busy",
    title: "GSTR-2B reconciliation",
    body: "How Tally, Zoho and Busy treat purchase reconciliation when 2B and your books disagree.",
    action: "Read the note",
  },
  {
    href: "/finance-updates",
    index: "02",
    badge: "CBIC Mandate",
    badgeType: "cbic",
    readTime: "Compliance Alert",
    highlight: "Turnover Thresholds · 2026",
    title: "E-invoicing in 2026",
    body: "The turnover threshold note, with a reminder to confirm the live rule before you change a filing process.",
    action: "Read the update",
  },
] as const;

const COMPARISON_HREF = "/compare/tally-prime-vs-zoho-books";

type SoftwareWithRelations = NonNullable<Awaited<ReturnType<typeof getSoftwareBySlug>>>;

export default async function HomePage() {
  const [curatedData, tallyProduct, zohoProduct] = await Promise.all([
    getCuratedComparison("tally-prime-vs-zoho-books"),
    getSoftwareBySlug("tally-prime"),
    getSoftwareBySlug("zoho-books"),
  ]);

  const glanceProducts = [tallyProduct, zohoProduct].filter(
    (p): p is SoftwareWithRelations => p != null,
  );

  const productSlugs = glanceProducts.map((item) => item.slug);
  const leadComparison =
    glanceProducts.length > 0
      ? buildLeadComparisonGlance({
          title: curatedData?.page.title || "Tally Prime vs Zoho Books",
          href: COMPARISON_HREF,
          products: mapGlanceProducts(glanceProducts),
          categories: curatedData?.matrix?.categories ?? [],
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

      <section className="section section--desk" aria-labelledby="reading-heading">
        <div className="container">
          <header className="desk-head">
            <div className="desk-head__left">
              <span className="desk-badge">
                <span className="desk-badge__dot" aria-hidden="true" />
                Editorial &amp; Compliance
              </span>
              <h2 id="reading-heading" className="desk-title">On the desk</h2>
              <p className="desk-sub">One GST note and one compliance update.</p>
            </div>
            <Link className="desk-head__link" href="/blog">
              Browse all publications
              <ChevronIcon />
            </Link>
          </header>

          <div className="desk-grid">
            {NOTES.map((note) => (
              <Link key={note.href} className="desk-card" href={note.href}>
                <div className="desk-card__glow" aria-hidden="true" />
                <div className="desk-card__top">
                  <div className="desk-card__tags">
                    <span className={`desk-tag desk-tag--${note.badgeType}`}>
                      <span className="desk-tag__bullet" aria-hidden="true" />
                      {note.badge}
                    </span>
                    <span className="desk-tag desk-tag--meta">{note.readTime}</span>
                  </div>
                  <span className="desk-card__index">{note.index}</span>
                </div>

                <div className="desk-card__content">
                  <h3 className="desk-card__title">{note.title}</h3>
                  <p className="desk-card__body">{note.body}</p>
                </div>

                <div className="desk-card__foot">
                  <span className="desk-card__chip">{note.highlight}</span>
                  <span className="desk-card__cta">
                    <span>{note.action}</span>
                    <span className="desk-card__cta-btn" aria-hidden="true">
                      <ChevronIcon />
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="desk-trust-bar">
            <svg
              className="desk-trust-bar__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <p className="desk-trust-bar__text">
              <strong>Independent Guidance:</strong> CompareWisely is not affiliated with the software vendors reviewed. Information is general guidance. Verify prices, GST rules and product features with official vendor and CBIC documentation.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

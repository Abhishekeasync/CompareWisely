import type { Metadata } from "next";
import Link from "next/link";
import { ChevronIcon } from "@/components/icons";
import { Money } from "@/components/money";
import { getSoftwareBySlug } from "@/lib/services/software.service";
import { getCuratedComparison } from "@/lib/services/comparison.service";

export const metadata: Metadata = {
  title: "CompareWisely",
  description: "India's independent comparison platform for ERP and accounting software. Built for MSMEs, CAs and finance teams.",
};

// This page queries the database at render time; allow blocking prerender
export const instant = false;

const PATHS = [
  {
    href: "/find-your-best-fit",
    kicker: "MSME owner",
    title: "Find a fit in four questions",
    body: "Size, industry, budget and the features you cannot skip. The result names a product and the trade-off.",
    action: "Start the quiz",
  },
  {
    href: "/compare/tally-prime-vs-zoho-books",
    kicker: "Chartered accountant",
    title: "Tally against Zoho",
    body: "Offline inventory and the workflow most CAs already know, set next to cloud bank feeds and mobile access.",
    action: "Open the comparison",
  },
  {
    href: "/finance-updates",
    kicker: "Finance team",
    title: "Check the compliance notes",
    body: "E-invoicing and filing updates, with a reminder to confirm the live rule before you change a process.",
    action: "Read the note",
  },
] as const;

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

export default async function HomePage() {
  const [curatedData, tallyProduct, zohoProduct] = await Promise.all([
    getCuratedComparison("tally-prime-vs-zoho-books"),
    getSoftwareBySlug("tally-prime"),
    getSoftwareBySlug("zoho-books"),
  ]);

  const glanceProducts = [tallyProduct, zohoProduct].filter(
    (p): p is NonNullable<typeof p> => p !== undefined,
  );

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="front__copy">
            <p className="eyebrow">India · Independent</p>
            <h1>Accounting software, with the trade-offs in view.</h1>
            <p className="lead">
              CompareWisely compares ERP and accounting software for MSMEs, CAs and finance teams. Prices are starting points. Confirm them with the vendor before you decide.
            </p>
            <div className="row gap-12 home-actions">
              <Link className="btn btn--primary" href="/find-your-best-fit">
                Find your best fit
              </Link>
              <Link className="btn" href="/compare/tally-prime-vs-zoho-books">
                Read comparison
              </Link>
              <Link className="btn btn--ghost" href="/software">
                Browse catalogue
              </Link>
            </div>
          </div>
          <Link className="glance" href="/compare/tally-prime-vs-zoho-books" aria-label="Open the Tally Prime versus Zoho Books comparison">
            <p className="eyebrow">Lead comparison</p>
            <h2>{curatedData?.page.title || "Tally Prime vs Zoho Books"}</h2>
            <div className="glance__pair">
              {glanceProducts.map((item) => {
                const startingPlan = item.pricingPlans.find((p) => p.isStartingPrice);
                const pros = (item.pros as string[]) || [];
                return (
                  <div key={item.id} className="glance__item">
                    <span className="row gap-12">
                      <span className={`swlogo swlogo--sm ${item.slug.split("-")[0]}`} aria-hidden="true">
                        {item.mono || item.name[0]}
                      </span>
                      <b>{item.name}</b>
                    </span>
                    <span className="tiny">
                      <Money value={startingPlan?.displayPrice || "Contact vendor"} />
                    </span>
                    <p>{pros[0] || item.tagline}</p>
                  </div>
                );
              })}
            </div>
            <span className="path-card__go">
              Open the comparison
              <ChevronIcon />
            </span>
          </Link>
        </div>
      </section>

      <section className="section" aria-labelledby="roles-heading">
        <div className="container">
          <header className="section-head">
            <h2 id="roles-heading">Start from the decision</h2>
            <p className="muted">Same catalog. Three entries, depending on who is choosing.</p>
          </header>
          <div className="path-grid">
            {PATHS.map((path, index) => (
              <Link key={path.href} className="path-card" href={path.href}>
                <span className="path-card__index">{String(index + 1).padStart(2, "0")}</span>
                <span className="eyebrow">{path.kicker}</span>
                <span>
                  <b>{path.title}</b>
                  <p>{path.body}</p>
                </span>
                <span className="path-card__go">
                  {path.action}
                  <ChevronIcon />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

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

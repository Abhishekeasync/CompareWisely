import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/page-head";

export const metadata: Metadata = {
  title: "404 Page Not Found — CompareWisely",
  description: "The requested software review, comparison matrix, or editorial guide could not be found.",
};

export default function NotFound() {
  return (
    <>
      <PageHead
        current="404"
        eyebrow="Page Missing"
        title="404 — Ledger Entry Not Found"
        lead="The software comparison, product profile, or editorial guide you requested does not exist or has been relocated."
      />
      <section className="section">
        <div className="container" style={{ maxWidth: "680px" }}>
          <div className="panel card--pad" style={{ padding: "40px 32px", textAlign: "center" }}>
            <div
              style={{
                fontSize: "4rem",
                fontFamily: "var(--font-serif)",
                color: "var(--primary-text)",
                lineHeight: 1,
                marginBottom: "16px",
                fontWeight: 700,
              }}
            >
              404
            </div>
            <h2 style={{ fontSize: "1.4rem", margin: "0 0 12px", color: "var(--fg)" }}>
              We Couldn&apos;t Balance This URL
            </h2>
            <p className="tiny muted" style={{ maxWidth: "480px", margin: "0 auto 28px" }}>
              The address might be misspelled, or the comparison slug has moved to an updated format. Explore our verified directory or launch the interactive comparison workspace.
            </p>

            <div className="row gap-12 center" style={{ flexWrap: "wrap" }}>
              <Link className="btn btn--primary" href="/">
                Return to Homepage
              </Link>
              <Link className="btn" href="/software">
                Browse Software Directory
              </Link>
              <Link className="btn" href="/compare">
                Comparison Workspace
              </Link>
              <Link className="btn btn--ghost" href="/find-your-best-fit">
                Take Best-Fit Quiz
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

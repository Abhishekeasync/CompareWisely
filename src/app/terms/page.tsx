import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/page-head";

export const metadata: Metadata = {
  title: "Terms and Conditions — CompareWisely",
  description: "Terms and conditions, editorial disclaimers, and platform usage terms for CompareWisely.",
};

export default function TermsPage() {
  return (
    <>
      <PageHead
        current="Terms &amp; Conditions"
        eyebrow="Legal &amp; Transparency"
        title="Terms and Conditions"
        lead="Terms governing the use of CompareWisely comparison matrices, recommendations, and editorial guides."
      />
      <section className="section">
        <div className="container" style={{ maxWidth: "800px" }}>
          <div className="panel card--pad" style={{ padding: "32px", fontSize: "0.95rem", lineHeight: 1.8 }}>
            <p className="tiny muted" style={{ marginBottom: "24px" }}>
              <b>Effective Date:</b> October 2026 · Last Updated: October 2026
            </p>

            <h2 style={{ fontSize: "1.35rem", marginTop: "24px", marginBottom: "12px" }}>
              1. Independent Editorial Platform
            </h2>
            <p>
              CompareWisely is an independent informational and comparison platform. We are not owned by, partnered with, or an authorized sales agent for Tally Solutions, Zoho Corporation, Busy Infotech, Marg ERP, Vyapar, or any other reviewed vendor.
            </p>

            <h2 style={{ fontSize: "1.35rem", marginTop: "28px", marginBottom: "12px" }}>
              2. Factual Guidance Disclaimer
            </h2>
            <p>
              All software pricing tiers, feature taxonomy assignments, and GST compliance notes published on CompareWisely are gathered from publicly available vendor materials and verified against primary sources. However:
            </p>
            <ul className="stack gap-8" style={{ paddingLeft: "20px", marginBottom: "16px" }}>
              <li>Vendor pricing, tier packaging, and terms may change without notice.</li>
              <li>Calculated recommendation match percentages are mathematical heuristic approximations based on user inputs.</li>
              <li>
                Content published on this website does not constitute formal legal, accounting, tax, or statutory compliance advice. Always consult your practicing Chartered Accountant (CA) or certified tax professional before purchasing enterprise software.
              </li>
            </ul>

            <h2 style={{ fontSize: "1.35rem", marginTop: "28px", marginBottom: "12px" }}>
              3. User Conduct &amp; Discussion Policy
            </h2>
            <p>
              Users submitting comments on guides agree to provide factual, respectful, and relevant insights. Commercial advertisements, spam, affiliate marketing links, and defamatory statements are prohibited and will be rejected by our moderation team.
            </p>

            <h2 style={{ fontSize: "1.35rem", marginTop: "28px", marginBottom: "12px" }}>
              4. Intellectual Property
            </h2>
            <p>
              CompareWisely logos, original editorial content, comparison layouts, and scoring methodologies are the property of CompareWisely. Product names, trademarks, and brand logos (e.g. Tally Prime, Zoho Books) remain the property of their respective trademark holders.
            </p>

            <h2 style={{ fontSize: "1.35rem", marginTop: "28px", marginBottom: "12px" }}>
              5. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted under applicable law, CompareWisely shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of the website or decisions made based on our software evaluations.
            </p>

            <div className="row gap-12" style={{ marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
              <Link className="btn btn--primary" href="/">
                Return to Homepage
              </Link>
              <Link className="btn btn--ghost" href="/privacy">
                Read Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { SITE_NAME, SITE_PRIVACY_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE_NAME}`,
  description: `Privacy Policy, data collection practices, and cookie disclosures for ${SITE_NAME}.`,
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHead
        current="Privacy Policy"
        eyebrow="Legal &amp; Transparency"
        title="Privacy Policy"
        lead={`How ${SITE_NAME} collects, protects, and respects your personal data and business evaluation inputs.`}
      />
      <section className="section">
        <div className="container" style={{ maxWidth: "800px" }}>
          <div className="panel card--pad" style={{ padding: "32px", fontSize: "0.95rem", lineHeight: 1.8 }}>
            <p className="tiny muted" style={{ marginBottom: "24px" }}>
              <b>Effective Date:</b> October 2026 · Last Updated: October 2026
            </p>

            <h2 style={{ fontSize: "1.35rem", marginTop: "24px", marginBottom: "12px" }}>
              1. Our Core Privacy Commitment
            </h2>
            <p>
              CompareWisely is an independent platform built to help Indian MSMEs, Chartered Accountants, and finance teams evaluate business software. We do not sell your personal data or business workflow answers to third-party telemarketers or software vendors.
            </p>

            <h2 style={{ fontSize: "1.35rem", marginTop: "28px", marginBottom: "12px" }}>
              2. Information We Collect
            </h2>
            <ul className="stack gap-8" style={{ paddingLeft: "20px", marginBottom: "16px" }}>
              <li>
                <b>Questionnaire Inputs:</b> When you use the &ldquo;Find Your Best Fit&rdquo; wizard, we process your business scale, industry, seat count, and required features to generate real-time match scores. These answers are evaluated in-session.
              </li>
              <li>
                <b>Newsletter Subscription:</b> If you subscribe to our monthly briefing, we collect your email address and record explicit timestamped consent. Every dispatch includes a one-click, verified unsubscribe link.
              </li>
              <li>
                <b>Community Comments:</b> When you post commentary on an editorial guide, we collect your name, email (kept private), and comment body. We store a cryptographic one-way hash of your IP address solely for rate limiting and spam prevention.
              </li>
              <li>
                <b>Authentication &amp; Security:</b> For administrative staff, we store encrypted credentials and session cookies to maintain secure access.
              </li>
            </ul>

            <h2 style={{ fontSize: "1.35rem", marginTop: "28px", marginBottom: "12px" }}>
              3. Cookies and Tracking
            </h2>
            <p>
              CompareWisely uses essential HTTP cookies for administrative session authentication and CSRF defense. We do not use intrusive third-party cross-site advertising trackers or sell browsing profiles.
            </p>

            <h2 style={{ fontSize: "1.35rem", marginTop: "28px", marginBottom: "12px" }}>
              4. Vendor Links &amp; Third Parties
            </h2>
            <p>
              Our comparison matrices and product reviews contain links to official vendor portals (e.g. Tally Solutions, Zoho, Busy Infotech). When you click an external link, you leave CompareWisely and are governed by the respective vendor&apos;s privacy terms.
            </p>

            <h2 style={{ fontSize: "1.35rem", marginTop: "28px", marginBottom: "12px" }}>
              5. Data Retention &amp; Rights
            </h2>
            <p>
              You have the right to request deletion or modification of your newsletter subscription or posted comments at any time. To exercise these rights, click the unsubscribe link in any email or email us at <code>{SITE_PRIVACY_EMAIL}</code>.
            </p>

            <div className="row gap-12" style={{ marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
              <Link className="btn btn--primary" href="/">
                Return to Homepage
              </Link>
              <Link className="btn btn--ghost" href="/terms">
                Read Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

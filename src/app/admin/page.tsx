import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/services/auth.service";
import { getAdminDashboardStats } from "@/lib/services/admin.service";
import { PageHead } from "@/components/page-head";
import { AdminNav } from "@/components/admin/admin-nav";
import Link from "next/link";

export const instant = false;

export default async function AdminDashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/admin/login");
  }

  const stats = await getAdminDashboardStats();

  return (
    <>
      <PageHead
        current="Admin Portal"
        eyebrow={`Signed in as ${session.name} (${session.role})`}
        title="CompareWisely Operations Portal"
        lead="Catalogue integrity control, stale pricing alerts, comment moderation, and audit logs."
      />
      <section className="section">
        <div className="container">
          <AdminNav current="dashboard" />

          {/* Metric KPI Cards */}
          <div className="story-grid" style={{ marginBottom: "32px" }}>
            <div className="panel card--pad" style={{ padding: "20px" }}>
              <span className="eyebrow">Catalogue Size</span>
              <h3 style={{ fontSize: "2rem", margin: "8px 0 4px", color: "var(--fg)" }}>
                {stats.totalSoftware}
              </h3>
              <p className="tiny muted" style={{ margin: 0 }}>
                Across {stats.totalCategories} active software categories
              </p>
            </div>

            <div className="panel card--pad" style={{ padding: "20px", borderLeft: stats.stalePricingCount > 0 ? "4px solid var(--amber)" : "1px solid var(--border)" }}>
              <span className="eyebrow" style={{ color: stats.stalePricingCount > 0 ? "var(--amber)" : "var(--muted)" }}>
                Pricing Verification Queue
              </span>
              <h3 style={{ fontSize: "2rem", margin: "8px 0 4px", color: "var(--fg)" }}>
                {stats.stalePricingCount}
              </h3>
              <p className="tiny muted" style={{ margin: 0 }}>
                Tiers unverified or older than 90 days
              </p>
            </div>

            <div className="panel card--pad" style={{ padding: "20px", borderLeft: stats.pendingCommentsCount > 0 ? "4px solid var(--primary-text)" : "1px solid var(--border)" }}>
              <span className="eyebrow" style={{ color: stats.pendingCommentsCount > 0 ? "var(--primary-text)" : "var(--muted)" }}>
                Pending Moderation
              </span>
              <h3 style={{ fontSize: "2rem", margin: "8px 0 4px", color: "var(--fg)" }}>
                {stats.pendingCommentsCount}
              </h3>
              <p className="tiny muted" style={{ margin: 0 }}>
                Reader comments awaiting verification
              </p>
            </div>

            <div className="panel card--pad" style={{ padding: "20px" }}>
              <span className="eyebrow">Newsletter Reach</span>
              <h3 style={{ fontSize: "2rem", margin: "8px 0 4px", color: "var(--fg)" }}>
                {stats.totalSubscribers}
              </h3>
              <p className="tiny muted" style={{ margin: 0 }}>
                Subscribers with verified consent
              </p>
            </div>
          </div>

          {/* Action Hub */}
          <div className="panel card--pad" style={{ padding: "28px" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "16px" }}>Immediate Operational Tasks</h3>
            <div className="row gap-12" style={{ flexWrap: "wrap" }}>
              <Link className="btn btn--primary" href="/admin/software">
                Inspect Software Catalogue &amp; Pricing
              </Link>
              <Link className="btn" href="/admin/comments">
                Review Pending Comments ({stats.pendingCommentsCount})
              </Link>
              <Link className="btn" href="/admin/comparisons">
                Manage Curated Comparisons ({stats.totalComparisons})
              </Link>
              <Link className="btn btn--ghost" href="/admin/audit-logs">
                View Audit Ledger
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

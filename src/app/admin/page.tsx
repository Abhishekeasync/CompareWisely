import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/lib/services/auth.service";
import { getAdminDashboardStats } from "@/lib/services/admin.service";
import { PageHead } from "@/components/page-head";
import { ChevronIcon } from "@/components/icons";

export const instant = false;

export default async function AdminDashboardPage() {
  await connection();
  const session = await getCurrentSession();
  if (!session) {
    redirect("/admin/login");
  }

  const stats = await getAdminDashboardStats(new Date());
  const pricingAlert = stats.stalePricingCount > 0;
  const commentsAlert = stats.pendingCommentsCount > 0;

  const kpis = [
    {
      href: "/admin/software",
      label: "Catalogue size",
      value: stats.totalSoftware,
      note: `Across ${stats.totalCategories} active software categories`,
      alert: false,
    },
    {
      href: "/admin/software",
      label: "Pricing queue",
      value: stats.stalePricingCount,
      note: "Tiers unverified or older than 90 days",
      alert: pricingAlert,
    },
    {
      href: "/admin/comments",
      label: "Pending moderation",
      value: stats.pendingCommentsCount,
      note: "Reader comments awaiting verification",
      alert: commentsAlert,
    },
    {
      href: "/admin/articles",
      label: "Newsletter reach",
      value: stats.totalSubscribers,
      note: "Subscribers with verified consent",
      alert: false,
    },
  ];

  const tasks = [
    {
      href: "/admin/software",
      index: "01",
      kicker: pricingAlert ? "Attention" : "Catalogue",
      title: "Software & pricing audit",
      lead: pricingAlert
        ? `${stats.stalePricingCount} pricing tiers need verification.`
        : "Inspect catalog records, plans, and proof sources.",
    },
    {
      href: "/admin/comments",
      index: "02",
      kicker: commentsAlert ? "Queue" : "Community",
      title: "Comment moderation",
      lead: commentsAlert
        ? `${stats.pendingCommentsCount} comments waiting for a decision.`
        : "No comments are waiting in the moderation queue.",
    },
    {
      href: "/admin/comparisons",
      index: "03",
      kicker: "Editorial",
      title: "Comparisons builder",
      lead: `${stats.totalComparisons} curated head-to-head pages in the ledger.`,
    },
    // {
    //   href: "/admin/audit-logs",
    //   index: "04",
    //   kicker: "Compliance",
    //   title: "Audit ledger",
    //   lead: "Immutable record of pricing, editorial, and moderation actions.",
    // },
  ];

  return (
    <>
      <PageHead
        current="Operations"
        eyebrow={`Signed in as ${session.name} (${session.role})`}
        title="Operations portal"
        lead="Catalogue integrity, stale pricing, and comment moderation."
      />
      <section className="section">
        <div className="container">
          <div className="admin-kpis">
            {kpis.map((kpi) => (
              <Link
                key={kpi.label}
                href={kpi.href}
                className={`admin-kpi${kpi.alert ? " is-alert" : ""}`}
              >
                <span className="eyebrow">{kpi.label}</span>
                <p className="admin-kpi__value num">{kpi.value}</p>
                <p className="tiny muted">{kpi.note}</p>
              </Link>
            ))}
          </div>

          <div className="admin-tasks">
            <span className="eyebrow">Immediate tasks</span>
            <div className="path-grid">
              {tasks.map((task) => (
                <Link key={task.href} className="path-card" href={task.href}>
                  <span className="path-card__index mono">{task.index}</span>
                  <span className="eyebrow">{task.kicker}</span>
                  <div>
                    <b>{task.title}</b>
                    <p>{task.lead}</p>
                  </div>
                  <span className="path-card__go">
                    Open
                    <ChevronIcon />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

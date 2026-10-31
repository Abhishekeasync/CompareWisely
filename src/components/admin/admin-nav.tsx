"use client";

import { useRouter } from "next/navigation";

export function AdminNav({ current }: { current: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/v1/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const links = [
    { href: "/admin", label: "Dashboard", id: "dashboard" },
    { href: "/admin/software", label: "Software & Pricing Audit", id: "software" },
    { href: "/admin/comparisons", label: "Comparisons Builder", id: "comparisons" },
    { href: "/admin/articles", label: "Articles & News CMS", id: "articles" },
    { href: "/admin/comments", label: "Comment Moderation", id: "comments" },
    { href: "/admin/audit-logs", label: "Audit Ledger", id: "audit-logs" },
  ];

  return (
    <div
      className="panel card--pad"
      style={{
        padding: "12px 20px",
        marginBottom: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div className="row gap-12" style={{ flexWrap: "wrap", alignItems: "center" }}>
        <span className="eyebrow" style={{ color: "var(--primary-text)", marginRight: "8px" }}>
          Admin
        </span>
        {links.map((link) => {
          const isActive = current === link.id;
          return (
            <a
              key={link.id}
              href={link.href}
              className={`btn btn--sm ${isActive ? "btn--primary" : "btn--ghost"}`}
              style={{ fontSize: "0.825rem" }}
            >
              {link.label}
            </a>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn--sm btn--ghost"
        onClick={handleLogout}
        style={{ fontSize: "0.825rem", color: "var(--danger)" }}
      >
        Sign Out
      </button>
    </div>
  );
}

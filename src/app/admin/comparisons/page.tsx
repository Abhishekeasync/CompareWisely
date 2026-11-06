"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { AdminRowActions } from "@/components/admin/row-actions";
import { DraftIcon, ExternalIcon, PublishIcon, TrashIcon } from "@/components/icons";
import { readApiError } from "@/lib/validations/feedback";

interface ComparisonProduct {
  software: { id: number; name: string };
}

interface Comparison {
  id: number;
  title: string;
  slug: string;
  isPublished: boolean;
  comparisonProducts: ComparisonProduct[];
  updatedAt: string;
}

type ActionType = "publish" | "draft" | "delete";

export default function AdminComparisonsPage() {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<number, ActionType>>({});
  const [rowError, setRowError] = useState<Record<number, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<Comparison | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");

  function showToast(msg: string, kind: "ok" | "err") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchComparisons = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/v1/admin/comparisons-list");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(readApiError(json, "Could not load comparisons. Please refresh.").message);
      setComparisons(json.data);
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComparisons();
  }, [fetchComparisons]);

  async function patchComparison(cmp: Comparison, action: "publish" | "draft") {
    setPending((p) => ({ ...p, [cmp.id]: action }));
    setRowError((e) => {
      const n = { ...e };
      delete n[cmp.id];
      return n;
    });
    try {
      const res = await fetch(`/api/v1/admin/comparisons/${cmp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(readApiError(json, "Could not update this comparison.").message);
      setComparisons((prev) =>
        prev.map((c) => (c.id === cmp.id ? { ...c, isPublished: action === "publish" } : c))
      );
      showToast(json.message, "ok");
    } catch (err: any) {
      setRowError((e) => ({ ...e, [cmp.id]: err.message }));
      showToast(err.message, "err");
    } finally {
      setPending((p) => {
        const n = { ...p };
        delete n[cmp.id];
        return n;
      });
    }
  }

  async function deleteComparison(cmp: Comparison) {
    setDeleteConfirm(null);
    setPending((p) => ({ ...p, [cmp.id]: "delete" }));
    try {
      const res = await fetch(`/api/v1/admin/comparisons/${cmp.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(readApiError(json, "Could not delete this comparison.").message);
      setComparisons((prev) => prev.filter((c) => c.id !== cmp.id));
      showToast("Comparison page permanently deleted.", "ok");
    } catch (err: any) {
      setRowError((e) => ({ ...e, [cmp.id]: err.message }));
      showToast(err.message, "err");
    } finally {
      setPending((p) => {
        const n = { ...p };
        delete n[cmp.id];
        return n;
      });
    }
  }

  const stats = useMemo(() => {
    const published = comparisons.filter((c) => c.isPublished).length;
    return { total: comparisons.length, published, draft: comparisons.length - published };
  }, [comparisons]);

  const filtered = useMemo(() => {
    return comparisons.filter((c) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const hay = `${c.title} ${c.slug} ${c.comparisonProducts.map((p) => p.software.name).join(" ")}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (statusFilter === "PUBLISHED" && !c.isPublished) return false;
      if (statusFilter === "DRAFT" && c.isPublished) return false;
      return true;
    });
  }, [comparisons, searchQuery, statusFilter]);

  const filtersOn = searchQuery.trim() !== "" || statusFilter !== "ALL";

  return (
    <>
      <PageHead
        current="Comparisons"
        eyebrow="Admin Portal"
        title="Curated Comparisons Builder"
        lead="Manage flagship head-to-head comparison pages, editorial verdicts, and software slot order."
      />

      {toast ? (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "12px 20px",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#fff",
            background: toast.kind === "ok" ? "var(--primary-text)" : "var(--danger)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          }}
        >
          {toast.msg}
        </div>
      ) : null}

      {deleteConfirm ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--fg)",
              padding: "32px",
              maxWidth: "440px",
              width: "90%",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "8px" }}>
              Delete this comparison?
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
              <b>&ldquo;{deleteConfirm.title}&rdquo;</b> will be permanently removed. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn--ghost" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--sm"
                style={{ background: "var(--danger)", color: "#fff", border: "none" }}
                onClick={() => deleteComparison(deleteConfirm)}
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="section">
        <div className="container">
          <div className="admin-ledger__head">
            <div className="admin-ledger__meta">
              <span>
                Total <b>{stats.total}</b>
              </span>
              <span>
                Published <b>{stats.published}</b>
              </span>
              {stats.draft > 0 ? (
                <span>
                  Draft <b>{stats.draft}</b>
                </span>
              ) : null}
            </div>
            <Link className="btn btn--primary btn--sm" href="/admin/comparisons/new">
              Build comparison
            </Link>
          </div>

          {loadError ? (
            <div
              style={{
                padding: "12px 16px",
                background: "var(--danger-soft)",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                marginBottom: "16px",
                fontSize: "0.875rem",
              }}
            >
              {loadError}
              <button
                type="button"
                className="admin-ledger__act"
                onClick={fetchComparisons}
                style={{ marginLeft: "12px" }}
              >
                Retry
              </button>
            </div>
          ) : null}

          {loading ? (
            <p className="tiny muted" style={{ padding: "36px 0", textAlign: "center" }}>
              Loading comparisons.
            </p>
          ) : comparisons.length === 0 ? (
            <p className="tiny muted" style={{ padding: "36px 0", textAlign: "center" }}>
              No comparison pages yet.{" "}
              <Link href="/admin/comparisons/new" className="link">
                Build the first one
              </Link>
            </p>
          ) : (
            <>
              <div className="admin-ledger__toolbar">
                <input
                  className="admin-ledger__search"
                  type="search"
                  placeholder="Search title, slug or product"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search comparisons"
                />
                <div className="row gap-8" style={{ alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    className="admin-ledger__select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as "ALL" | "PUBLISHED" | "DRAFT")}
                    aria-label="Filter by status"
                  >
                    <option value="ALL">All statuses</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                  {filtersOn ? (
                    <button
                      type="button"
                      className="admin-ledger__act"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("ALL");
                      }}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="admin-ledger__scroller">
                <table className="admin-ledger">
                  <thead>
                    <tr>
                      <th>Comparison</th>
                      <th>Products</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: "36px 0", textAlign: "center", color: "var(--muted)" }}>
                          <p style={{ margin: "0 0 12px" }}>No comparison pages match these filters.</p>
                          <button
                            type="button"
                            className="admin-ledger__act"
                            onClick={() => {
                              setSearchQuery("");
                              setStatusFilter("ALL");
                            }}
                          >
                            Reset filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((c) => {
                        const isPending = pending[c.id];
                        const names = c.comparisonProducts.map((cp) => cp.software.name);
                        return (
                          <tr key={c.id} style={{ opacity: isPending ? 0.55 : 1 }}>
                            <td>
                              <div className="admin-ledger__product">
                                <div>
                                  <b>{c.title}</b>
                                  <span className="tiny muted block">/compare/{c.slug}</span>
                                  {rowError[c.id] ? (
                                    <span className="tiny block" style={{ color: "var(--danger)", marginTop: 4 }}>
                                      {rowError[c.id]}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="admin-ledger__count num">{names.length}</span>
                              <span className="tiny muted block">{names.join(", ") || "None listed"}</span>
                            </td>
                            <td>
                              <span className={`admin-ledger__status${c.isPublished ? " is-live" : " is-draft"}`}>
                                {c.isPublished ? "Live" : "Draft"}
                              </span>
                            </td>
                            <td>
                              <AdminRowActions
                                id={c.id}
                                tools={[
                                  {
                                    key: "view",
                                    label: "View live",
                                    icon: <ExternalIcon />,
                                    href: `/compare/${c.slug}`,
                                    external: true,
                                  },
                                  c.isPublished
                                    ? {
                                        key: "draft",
                                        label: "Save as draft",
                                        icon: <DraftIcon />,
                                        disabled: Boolean(isPending),
                                        onClick: () => patchComparison(c, "draft"),
                                      }
                                    : {
                                        key: "publish",
                                        label: "Publish",
                                        icon: <PublishIcon />,
                                        disabled: Boolean(isPending),
                                        onClick: () => patchComparison(c, "publish"),
                                      },
                                  {
                                    key: "delete",
                                    label: "Delete",
                                    icon: <TrashIcon />,
                                    danger: true,
                                    disabled: Boolean(isPending),
                                    onClick: () => setDeleteConfirm(c),
                                  },
                                ]}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

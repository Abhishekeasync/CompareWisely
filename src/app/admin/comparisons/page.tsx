"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { AdminNav } from "@/components/admin/admin-nav";

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

function StatusBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        background: isPublished ? "var(--primary-soft)" : "var(--surface-2)",
        color: isPublished ? "var(--primary-text)" : "var(--muted)",
        border: `1px solid ${isPublished ? "var(--primary-text)" : "var(--border)"}`,
      }}
    >
      {isPublished ? "PUBLISHED" : "DRAFT"}
    </span>
  );
}

export default function AdminComparisonsPage() {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<number, ActionType>>({});
  const [rowError, setRowError] = useState<Record<number, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<Comparison | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);

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
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to load.");
      setComparisons(json.data);
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComparisons(); }, [fetchComparisons]);

  async function patchComparison(cmp: Comparison, action: "publish" | "draft") {
    setPending((p) => ({ ...p, [cmp.id]: action }));
    setRowError((e) => { const n = { ...e }; delete n[cmp.id]; return n; });
    try {
      const res = await fetch(`/api/v1/admin/comparisons/${cmp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed.");
      setComparisons((prev) =>
        prev.map((c) => (c.id === cmp.id ? { ...c, isPublished: action === "publish" } : c))
      );
      showToast(json.message, "ok");
    } catch (err: any) {
      setRowError((e) => ({ ...e, [cmp.id]: err.message }));
      showToast(err.message, "err");
    } finally {
      setPending((p) => { const n = { ...p }; delete n[cmp.id]; return n; });
    }
  }

  async function deleteComparison(cmp: Comparison) {
    setDeleteConfirm(null);
    setPending((p) => ({ ...p, [cmp.id]: "delete" }));
    try {
      const res = await fetch(`/api/v1/admin/comparisons/${cmp.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to delete.");
      setComparisons((prev) => prev.filter((c) => c.id !== cmp.id));
      showToast("Comparison page permanently deleted.", "ok");
    } catch (err: any) {
      setRowError((e) => ({ ...e, [cmp.id]: err.message }));
      showToast(err.message, "err");
    } finally {
      setPending((p) => { const n = { ...p }; delete n[cmp.id]; return n; });
    }
  }

  return (
    <>
      <PageHead
        current="Comparisons"
        eyebrow="Admin Portal"
        title="Curated Comparisons Builder"
        lead="Manage flagship head-to-head comparison pages, editorial verdicts, and software slot order."
      />

      {/* ── Toast ── */}
      {toast && (
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
          {toast.kind === "ok" ? "✓ " : "✗ "}
          {toast.msg}
        </div>
      )}

      {/* ── Delete confirm dialog ── */}
      {deleteConfirm && (
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
              border: "1px solid var(--border)",
              padding: "32px",
              maxWidth: "440px",
              width: "90%",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "8px" }}>
              Delete Comparison Page?
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
              <b>&ldquo;{deleteConfirm.title}&rdquo;</b> will be permanently removed. This action
              cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button className="btn btn--ghost" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="btn btn--sm"
                style={{ background: "var(--danger)", color: "#fff", border: "none" }}
                onClick={() => deleteComparison(deleteConfirm)}
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="section">
        <div className="container">
          <AdminNav current="comparisons" />

          <div className="row between" style={{ alignItems: "center", marginBottom: "20px" }}>
            <span className="tiny muted">
              Total <b>{comparisons.length}</b> curated comparison pages
            </span>
            <Link className="btn btn--primary btn--sm" href="/admin/comparisons/new">
              + Build New Comparison
            </Link>
          </div>

          {loadError && (
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
                className="btn btn--sm btn--ghost"
                onClick={fetchComparisons}
                style={{ marginLeft: "12px" }}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
              Loading comparisons…
            </div>
          ) : comparisons.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
              No comparison pages yet.{" "}
              <Link href="/admin/comparisons/new" className="link">
                Build your first comparison →
              </Link>
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
                border: "1px solid var(--border)",
                background: "var(--surface)",
              }}
            >
              <table
                style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}
              >
                <thead>
                  <tr
                    style={{
                      background: "var(--surface-2)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>
                      Comparison Title
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>URL Slug</th>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>
                      Products Evaluated
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", minWidth: "260px" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((c) => {
                    const isPending = pending[c.id];
                    return (
                      <tr
                        key={c.id}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          opacity: isPending ? 0.6 : 1,
                          transition: "opacity 0.15s",
                        }}
                      >
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                          {c.title}
                          {rowError[c.id] && (
                            <span
                              style={{
                                display: "block",
                                fontSize: "0.72rem",
                                color: "var(--danger)",
                                marginTop: "4px",
                              }}
                            >
                              ✗ {rowError[c.id]}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", color: "var(--muted)" }}>
                          /compare/{c.slug}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div className="row gap-6" style={{ alignItems: "center", flexWrap: "wrap" }}>
                            {c.comparisonProducts.map((cp) => (
                              <span
                                key={cp.software.id}
                                style={{
                                  padding: "2px 8px",
                                  fontSize: "0.72rem",
                                  background: "var(--surface-2)",
                                  border: "1px solid var(--border)",
                                }}
                              >
                                {cp.software.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <StatusBadge isPublished={c.isPublished} />
                        </td>
                        <td style={{ padding: "10px 16px", textAlign: "right" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexWrap: "wrap",
                              justifyContent: "flex-end",
                            }}
                          >
                            <Link
                              className="btn btn--sm btn--ghost"
                              href={`/compare/${c.slug}`}
                              target="_blank"
                            >
                              View ↗
                            </Link>

                            {!c.isPublished && (
                              <button
                                className="btn btn--sm btn--primary"
                                disabled={Boolean(isPending)}
                                onClick={() => patchComparison(c, "publish")}
                              >
                                {isPending === "publish" ? "…" : "Publish"}
                              </button>
                            )}

                            {c.isPublished && (
                              <button
                                className="btn btn--sm btn--ghost"
                                disabled={Boolean(isPending)}
                                onClick={() => patchComparison(c, "draft")}
                                style={{ color: "var(--amber)" }}
                              >
                                {isPending === "draft" ? "…" : "Save as Draft"}
                              </button>
                            )}

                            <button
                              className="btn btn--sm btn--ghost"
                              disabled={Boolean(isPending)}
                              onClick={() => setDeleteConfirm(c)}
                              style={{ color: "var(--danger)" }}
                            >
                              {isPending === "delete" ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

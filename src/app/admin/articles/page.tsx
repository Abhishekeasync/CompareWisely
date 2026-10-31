"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { AdminNav } from "@/components/admin/admin-nav";

interface Article {
  id: number;
  title: string;
  slug: string;
  articleType: "BLOG" | "FINANCE_UPDATE";
  isPublished: boolean;
  category: { name: string } | null;
  author: { name: string } | null;
  tags: { tagName: string }[];
  createdAt: string;
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

function TypeBadge({ type }: { type: "BLOG" | "FINANCE_UPDATE" }) {
  const isBlog = type === "BLOG";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        fontSize: "0.72rem",
        fontWeight: 600,
        background: isBlog ? "var(--primary-soft)" : "var(--amber-soft)",
        color: isBlog ? "var(--primary-text)" : "var(--amber)",
        border: `1px solid ${isBlog ? "var(--primary-text)" : "var(--amber)"}`,
      }}
    >
      {isBlog ? "BLOG" : "FINANCE UPDATE"}
    </span>
  );
}

export default function AdminArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** articleId → action currently in-flight */
  const [pending, setPending] = useState<Record<number, ActionType>>({});
  /** per-row inline error message */
  const [rowError, setRowError] = useState<Record<number, string>>({});
  /** confirmation dialog state */
  const [deleteConfirm, setDeleteConfirm] = useState<Article | null>(null);
  /** global toast */
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);

  /* ── Fetch articles ─────────────────────────────────── */
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/v1/admin/articles");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to load.");
      setArticles(json.data);
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  /* ── Show toast ─────────────────────────────────────── */
  function showToast(msg: string, kind: "ok" | "err") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  }

  /* ── PATCH action (publish / draft) ─────────────────── */
  async function patchArticle(art: Article, action: "publish" | "draft") {
    setPending((p) => ({ ...p, [art.id]: action }));
    setRowError((e) => { const n = { ...e }; delete n[art.id]; return n; });
    try {
      const res = await fetch(`/api/v1/admin/articles/${art.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed.");
      // Optimistic update
      setArticles((prev) =>
        prev.map((a) =>
          a.id === art.id ? { ...a, isPublished: action === "publish" } : a
        )
      );
      showToast(json.message, "ok");
    } catch (err: any) {
      setRowError((e) => ({ ...e, [art.id]: err.message }));
      showToast(err.message, "err");
    } finally {
      setPending((p) => { const n = { ...p }; delete n[art.id]; return n; });
    }
  }

  /* ── DELETE ─────────────────────────────────────────── */
  async function deleteArticle(art: Article) {
    setDeleteConfirm(null);
    setPending((p) => ({ ...p, [art.id]: "delete" }));
    try {
      const res = await fetch(`/api/v1/admin/articles/${art.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to delete.");
      setArticles((prev) => prev.filter((a) => a.id !== art.id));
      showToast("Article permanently deleted.", "ok");
    } catch (err: any) {
      setRowError((e) => ({ ...e, [art.id]: err.message }));
      showToast(err.message, "err");
    } finally {
      setPending((p) => { const n = { ...p }; delete n[art.id]; return n; });
    }
  }

  /* ── Render ─────────────────────────────────────────── */
  return (
    <>
      <PageHead
        current="Articles & News"
        eyebrow="Admin CMS"
        title="Editorial & Regulatory CMS"
        lead="Write, edit, publish, draft, and delete technical guides, blog posts, and CBIC statutory finance updates."
      />

      {/* ── Global toast ── */}
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
            animation: "fadeInUp 0.2s ease",
          }}
        >
          {toast.kind === "ok" ? "✓ " : "✗ "}
          {toast.msg}
        </div>
      )}

      {/* ── Delete confirmation dialog ── */}
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
              Delete Article?
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
              <b>&ldquo;{deleteConfirm.title}&rdquo;</b> will be permanently removed including all
              comments. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                className="btn btn--ghost"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn--sm"
                style={{ background: "var(--danger)", color: "#fff", border: "none" }}
                onClick={() => deleteArticle(deleteConfirm)}
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="section">
        <div className="container">
          <AdminNav current="articles" />

          <div className="row between" style={{ alignItems: "center", marginBottom: "20px" }}>
            <span className="tiny muted">
              Total <b>{articles.length}</b> articles &amp; compliance updates
            </span>
            <Link className="btn btn--primary btn--sm" href="/admin/articles/new">
              + Write New Article / Update
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
                onClick={fetchArticles}
                style={{ marginLeft: "12px" }}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
              Loading articles…
            </div>
          ) : articles.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
              No articles yet.{" "}
              <Link href="/admin/articles/new" className="link">
                Write your first article →
              </Link>
            </div>
          ) : (
            <div
              style={{ overflowX: "auto", border: "1px solid var(--border)", background: "var(--surface)" }}
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
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Title &amp; Slug</th>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Type</th>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Category / Tags</th>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Author</th>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", minWidth: "280px" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((art) => {
                    const isPending = pending[art.id];
                    return (
                      <tr
                        key={art.id}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          opacity: isPending ? 0.6 : 1,
                          transition: "opacity 0.15s",
                        }}
                      >
                        {/* Title */}
                        <td style={{ padding: "12px 16px" }}>
                          <b style={{ display: "block" }}>{art.title}</b>
                          <span className="tiny muted">/{art.slug}</span>
                          {rowError[art.id] && (
                            <span
                              style={{
                                display: "block",
                                marginTop: "4px",
                                fontSize: "0.72rem",
                                color: "var(--danger)",
                              }}
                            >
                              ✗ {rowError[art.id]}
                            </span>
                          )}
                        </td>

                        {/* Type */}
                        <td style={{ padding: "12px 16px" }}>
                          <TypeBadge type={art.articleType} />
                        </td>

                        {/* Category / Tags */}
                        <td style={{ padding: "12px 16px" }}>
                          <span className="tiny block">{art.category?.name || "General"}</span>
                          <span className="tiny muted block">
                            {art.tags.map((t) => t.tagName).join(", ") || "No tags"}
                          </span>
                        </td>

                        {/* Author */}
                        <td style={{ padding: "12px 16px" }}>
                          <span className="tiny">{art.author?.name || "Staff"}</span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "12px 16px" }}>
                          <StatusBadge isPublished={art.isPublished} />
                        </td>

                        {/* Actions */}
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
                              className="btn btn--sm btn--primary"
                              href={`/admin/articles/${art.id}/edit`}
                              title="Edit article content and media"
                            >
                              Edit
                            </Link>

                            {/* View public */}
                            <Link
                              className="btn btn--sm btn--ghost"
                              href={
                                art.articleType === "BLOG"
                                  ? `/blog/${art.slug}`
                                  : `/finance-updates`
                              }
                              target="_blank"
                              title="Open public page"
                            >
                              View ↗
                            </Link>

                            {/* Publish — shown when DRAFT */}
                            {!art.isPublished && (
                              <button
                                className="btn btn--sm btn--primary"
                                disabled={Boolean(isPending)}
                                onClick={() => patchArticle(art, "publish")}
                                title="Publish this article"
                              >
                                {isPending === "publish" ? "…" : "Publish"}
                              </button>
                            )}

                            {/* Save as Draft — shown when PUBLISHED */}
                            {art.isPublished && (
                              <button
                                className="btn btn--sm btn--ghost"
                                disabled={Boolean(isPending)}
                                onClick={() => patchArticle(art, "draft")}
                                title="Move back to draft (hidden from public)"
                                style={{ color: "var(--amber)" }}
                              >
                                {isPending === "draft" ? "…" : "Save as Draft"}
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              className="btn btn--sm btn--ghost"
                              disabled={Boolean(isPending)}
                              onClick={() => setDeleteConfirm(art)}
                              title="Permanently delete this article"
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

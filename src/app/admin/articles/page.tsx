"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { AdminRowActions } from "@/components/admin/row-actions";
import { DraftIcon, ExternalIcon, PencilIcon, PublishIcon, TrashIcon } from "@/components/icons";
import { readApiError } from "@/lib/validations/feedback";

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

function publicHref(art: Article) {
  return art.articleType === "BLOG" ? `/blog/${art.slug}` : "/finance-updates";
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<number, ActionType>>({});
  const [rowError, setRowError] = useState<Record<number, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<Article | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "BLOG" | "FINANCE_UPDATE">("ALL");

  function showToast(msg: string, kind: "ok" | "err") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/v1/admin/articles");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(readApiError(json, "Could not load articles. Please refresh.").message);
      setArticles(json.data);
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  async function patchArticle(art: Article, action: "publish" | "draft") {
    setPending((p) => ({ ...p, [art.id]: action }));
    setRowError((e) => {
      const n = { ...e };
      delete n[art.id];
      return n;
    });
    try {
      const res = await fetch(`/api/v1/admin/articles/${art.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(readApiError(json, "Could not update this article.").message);
      setArticles((prev) =>
        prev.map((a) => (a.id === art.id ? { ...a, isPublished: action === "publish" } : a))
      );
      showToast(json.message, "ok");
    } catch (err: any) {
      setRowError((e) => ({ ...e, [art.id]: err.message }));
      showToast(err.message, "err");
    } finally {
      setPending((p) => {
        const n = { ...p };
        delete n[art.id];
        return n;
      });
    }
  }

  async function deleteArticle(art: Article) {
    setDeleteConfirm(null);
    setPending((p) => ({ ...p, [art.id]: "delete" }));
    try {
      const res = await fetch(`/api/v1/admin/articles/${art.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(readApiError(json, "Could not delete this article.").message);
      setArticles((prev) => prev.filter((a) => a.id !== art.id));
      showToast("Article permanently deleted.", "ok");
    } catch (err: any) {
      setRowError((e) => ({ ...e, [art.id]: err.message }));
      showToast(err.message, "err");
    } finally {
      setPending((p) => {
        const n = { ...p };
        delete n[art.id];
        return n;
      });
    }
  }

  const stats = useMemo(() => {
    const published = articles.filter((a) => a.isPublished).length;
    return { total: articles.length, published, draft: articles.length - published };
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter((art) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const tags = art.tags.map((t) => t.tagName).join(" ");
        const hay = `${art.title} ${art.slug} ${art.category?.name ?? ""} ${art.author?.name ?? ""} ${tags}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (statusFilter === "PUBLISHED" && !art.isPublished) return false;
      if (statusFilter === "DRAFT" && art.isPublished) return false;
      if (typeFilter !== "ALL" && art.articleType !== typeFilter) return false;
      return true;
    });
  }, [articles, searchQuery, statusFilter, typeFilter]);

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
  }

  const filtersOn = searchQuery.trim() !== "" || statusFilter !== "ALL" || typeFilter !== "ALL";

  return (
    <>
      <PageHead
        current="Articles & News"
        eyebrow="Admin Portal"
        title="Editorial & Regulatory CMS"
        lead="Write, edit, publish, draft, and delete technical guides, blog posts, and CBIC statutory finance updates."
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
              Delete this article?
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
              <b>&ldquo;{deleteConfirm.title}&rdquo;</b> will be permanently removed, including comments. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn--ghost" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--sm"
                style={{ background: "var(--danger)", color: "#fff", border: "none" }}
                onClick={() => deleteArticle(deleteConfirm)}
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
            <Link className="btn btn--primary btn--sm" href="/admin/articles/new">
              Write article
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
              <button type="button" className="admin-ledger__act" onClick={fetchArticles} style={{ marginLeft: "12px" }}>
                Retry
              </button>
            </div>
          ) : null}

          {loading ? (
            <p className="tiny muted" style={{ padding: "36px 0", textAlign: "center" }}>
              Loading articles.
            </p>
          ) : articles.length === 0 ? (
            <p className="tiny muted" style={{ padding: "36px 0", textAlign: "center" }}>
              No articles yet.{" "}
              <Link href="/admin/articles/new" className="link">
                Write the first one
              </Link>
            </p>
          ) : (
            <>
              <div className="admin-ledger__toolbar">
                <input
                  className="admin-ledger__search"
                  type="search"
                  placeholder="Search title, slug, topic or author"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search articles"
                />
                <div className="row gap-8" style={{ alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    className="admin-ledger__select"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as "ALL" | "BLOG" | "FINANCE_UPDATE")}
                    aria-label="Filter by type"
                  >
                    <option value="ALL">All types</option>
                    <option value="BLOG">Blog</option>
                    <option value="FINANCE_UPDATE">Finance update</option>
                  </select>
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
                    <button type="button" className="admin-ledger__act" onClick={clearFilters}>
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="admin-ledger__scroller">
                <table className="admin-ledger">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Type</th>
                      <th>Topic</th>
                      <th>Author</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "36px 0", textAlign: "center", color: "var(--muted)" }}>
                          <p style={{ margin: "0 0 12px" }}>No articles match these filters.</p>
                          <button type="button" className="admin-ledger__act" onClick={clearFilters}>
                            Reset filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((art) => {
                        const isPending = pending[art.id];
                        const tags = art.tags.map((t) => t.tagName).join(", ");
                        return (
                          <tr key={art.id} style={{ opacity: isPending ? 0.55 : 1 }}>
                            <td>
                              <div className="admin-ledger__product">
                                <div>
                                  <b>{art.title}</b>
                                  <span className="tiny muted block">/{art.slug}</span>
                                  {rowError[art.id] ? (
                                    <span className="tiny block" style={{ color: "var(--danger)", marginTop: 4 }}>
                                      {rowError[art.id]}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="admin-ledger__status">
                                {art.articleType === "BLOG" ? "Blog" : "Finance update"}
                              </span>
                            </td>
                            <td>
                              <span>{art.category?.name || "General"}</span>
                              <span className="tiny muted block">{tags || "No tags"}</span>
                            </td>
                            <td>
                              <span className="tiny muted">{art.author?.name || "Staff"}</span>
                            </td>
                            <td>
                              <span className={`admin-ledger__status${art.isPublished ? " is-live" : " is-draft"}`}>
                                {art.isPublished ? "Live" : "Draft"}
                              </span>
                            </td>
                            <td>
                              <AdminRowActions
                                id={art.id}
                                tools={[
                                  {
                                    key: "edit",
                                    label: "Edit",
                                    icon: <PencilIcon />,
                                    href: `/admin/articles/${art.id}/edit`,
                                  },
                                  {
                                    key: "view",
                                    label: "View live",
                                    icon: <ExternalIcon />,
                                    href: publicHref(art),
                                    external: true,
                                  },
                                  art.isPublished
                                    ? {
                                        key: "draft",
                                        label: "Save as draft",
                                        icon: <DraftIcon />,
                                        disabled: Boolean(isPending),
                                        onClick: () => patchArticle(art, "draft"),
                                      }
                                    : {
                                        key: "publish",
                                        label: "Publish",
                                        icon: <PublishIcon />,
                                        disabled: Boolean(isPending),
                                        onClick: () => patchArticle(art, "publish"),
                                      },
                                  {
                                    key: "delete",
                                    label: "Delete",
                                    icon: <TrashIcon />,
                                    danger: true,
                                    disabled: Boolean(isPending),
                                    onClick: () => setDeleteConfirm(art),
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

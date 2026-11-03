"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CommentStatus } from "@prisma/client";

interface CommentModerationListProps {
  initialComments: any[];
}

export function CommentModerationList({ initialComments }: CommentModerationListProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [filter, setFilter] = useState<string>("ALL");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function handleStatusChange(commentId: number, nextStatus: CommentStatus) {
    setLoadingId(commentId);

    try {
      const res = await fetch("/api/v1/admin/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, status: nextStatus }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update comment status.");
      }

      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, status: nextStatus } : c))
      );
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    } finally {
      setLoadingId(null);
    }
  }

  const filteredComments = comments.filter((c) => {
    if (filter === "ALL") return true;
    return c.status === filter;
  });

  return (
    <div>
      {/* Filter Tabs */}
      <div className="row gap-8" style={{ marginBottom: "20px" }}>
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`btn btn--sm ${filter === tab ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredComments.length === 0 ? (
        <div className="panel card--pad" style={{ padding: "32px", textAlign: "center" }}>
          <p className="tiny muted">No comments found matching filter &ldquo;{filter}&rdquo;.</p>
        </div>
      ) : (
        <div className="stack gap-16">
          {filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="panel card--pad"
              style={{
                padding: "20px",
                borderLeft:
                  comment.status === "APPROVED"
                    ? "4px solid var(--primary-text)"
                    : comment.status === "PENDING"
                    ? "4px solid var(--amber)"
                    : "4px solid var(--danger)",
              }}
            >
              <div className="row between" style={{ alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <span className="eyebrow" style={{ color: "var(--muted)" }}>
                    On: <b>{comment.article?.title || "Article"}</b>
                  </span>
                  <h4 style={{ fontSize: "1rem", margin: "4px 0 0" }}>{comment.authorName}</h4>
                  <span className="tiny muted">{comment.authorEmail}</span>
                </div>

                <div className="row gap-8" style={{ alignItems: "center" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background:
                        comment.status === "APPROVED"
                          ? "var(--primary-soft)"
                          : comment.status === "PENDING"
                          ? "var(--amber-soft)"
                          : "var(--danger-soft)",
                      color:
                        comment.status === "APPROVED"
                          ? "var(--primary-text)"
                          : comment.status === "PENDING"
                          ? "var(--amber)"
                          : "var(--danger)",
                    }}
                  >
                    {comment.status}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: "0.95rem", color: "var(--fg)", margin: "12px 0 16px", whiteSpace: "pre-line" }}>
                {comment.content}
              </p>

              <div className="row between" style={{ alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                <span className="tiny muted">
                  Submitted: {new Date(comment.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>

                <div className="row gap-8">
                  {comment.status !== "APPROVED" ? (
                    <button
                      type="button"
                      className="btn btn--sm btn--primary"
                      disabled={loadingId === comment.id}
                      onClick={() => handleStatusChange(comment.id, CommentStatus.APPROVED)}
                    >
                      Approve &amp; Publish
                    </button>
                  ) : null}

                  {comment.status !== "REJECTED" ? (
                    <button
                      type="button"
                      className="btn btn--sm btn--ghost"
                      style={{ color: "var(--danger)" }}
                      disabled={loadingId === comment.id}
                      onClick={() => handleStatusChange(comment.id, CommentStatus.REJECTED)}
                    >
                      Reject
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

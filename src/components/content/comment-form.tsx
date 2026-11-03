"use client";

import { useState } from "react";

interface CommentFormProps {
  articleSlug: string;
}

export function CommentForm({ articleSlug }: CommentFormProps) {
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/v1/articles/${articleSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          authorEmail,
          content,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to submit comment.");
      }

      setFeedback({
        type: "success",
        text: "Thank you! Your comment has been submitted and will appear once verified by our moderation team.",
      });
      setAuthorName("");
      setAuthorEmail("");
      setContent("");
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel card--pad" style={{ padding: "24px", marginTop: "32px" }}>
      <h3 style={{ fontSize: "1.15rem", marginBottom: "8px" }}>Leave a Professional Note or Question</h3>
      <p className="tiny muted" style={{ marginBottom: "20px" }}>
        Independent technical discussions are welcomed. All comments are moderated for spam and factual relevance.
      </p>

      {feedback ? (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "20px",
            fontSize: "0.875rem",
            background: feedback.type === "success" ? "var(--primary-soft)" : "var(--danger-soft)",
            border: `1px solid ${feedback.type === "success" ? "var(--primary-text)" : "var(--danger)"}`,
            color: feedback.type === "success" ? "var(--primary-text)" : "var(--danger)",
          }}
        >
          {feedback.text}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="stack gap-16">
        <div className="row gap-12" style={{ flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px" }}>
            <label htmlFor="c-name" className="tiny muted block" style={{ marginBottom: "4px" }}>
              Your Name &amp; Title (e.g. Ramesh S., CA)
            </label>
            <input
              id="c-name"
              type="text"
              required
              minLength={2}
              maxLength={60}
              placeholder="e.g. CA Ramesh Sharma"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--fg)",
              }}
            />
          </div>

          <div style={{ flex: "1 1 240px" }}>
            <label htmlFor="c-email" className="tiny muted block" style={{ marginBottom: "4px" }}>
              Work Email (kept private, never published)
            </label>
            <input
              id="c-email"
              type="email"
              required
              placeholder="ramesh@example.com"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--fg)",
              }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="c-content" className="tiny muted block" style={{ marginBottom: "4px" }}>
            Your Commentary or Question
          </label>
          <textarea
            id="c-content"
            required
            rows={4}
            minLength={5}
            maxLength={1000}
            placeholder="Share your practical experience or questions regarding this workflow..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--fg)",
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
        </div>

        <div className="row between" style={{ alignItems: "center" }}>
          <span className="tiny muted">{content.length}/1000 characters</span>
          <button className="btn btn--primary" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Moderation"}
          </button>
        </div>
      </form>
    </div>
  );
}

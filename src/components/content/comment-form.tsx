"use client";

import { useState } from "react";
import { FieldError } from "@/components/field-error";
import { commentSubmitSchema } from "@/lib/validations/content";
import { readApiError, validationErrorPayload, dropField, type FieldErrors } from "@/lib/validations/feedback";

interface CommentFormProps {
  articleSlug: string;
}

export function CommentForm({ articleSlug }: CommentFormProps) {
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearField = (key: string) => setFieldErrors((prev) => dropField(prev, key));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const parsed = commentSubmitSchema.safeParse({
      articleSlug,
      authorName,
      authorEmail,
      content,
    });
    if (!parsed.success) {
      const failure = validationErrorPayload(parsed.error);
      setFieldErrors(failure.fields);
      setFeedback({ type: "error", text: failure.message });
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    try {
      const res = await fetch(`/api/v1/articles/${articleSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: parsed.data.authorName,
          authorEmail: parsed.data.authorEmail,
          content: parsed.data.content,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const failure = readApiError(json, "We couldn't save your comment. Please try again.");
        setFieldErrors(failure.fields);
        throw new Error(failure.message);
      }

      setFeedback({
        type: "success",
        text: "Thank you. Your comment is in the queue and will appear after a moderator reviews it.",
      });
      setAuthorName("");
      setAuthorEmail("");
      setContent("");
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong. Please try again.",
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

      <form onSubmit={handleSubmit} className="stack gap-16" noValidate>
        <div className="row gap-12" style={{ flexWrap: "wrap" }}>
          <div className={fieldErrors.authorName ? "field-invalid" : undefined} style={{ flex: "1 1 240px" }}>
            <label htmlFor="c-name" className="tiny muted block" style={{ marginBottom: "4px" }}>
              Your Name &amp; Title (e.g. Ramesh S., CA)
            </label>
            <input
              id="c-name"
              type="text"
              maxLength={60}
              placeholder="e.g. CA Ramesh Sharma"
              value={authorName}
              aria-invalid={fieldErrors.authorName ? true : undefined}
              onChange={(e) => {
                setAuthorName(e.target.value);
                clearField("authorName");
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--fg)",
              }}
            />
            <FieldError message={fieldErrors.authorName} />
          </div>

          <div className={fieldErrors.authorEmail ? "field-invalid" : undefined} style={{ flex: "1 1 240px" }}>
            <label htmlFor="c-email" className="tiny muted block" style={{ marginBottom: "4px" }}>
              Work Email (kept private, never published)
            </label>
            <input
              id="c-email"
              type="email"
              placeholder="ramesh@example.com"
              value={authorEmail}
              aria-invalid={fieldErrors.authorEmail ? true : undefined}
              onChange={(e) => {
                setAuthorEmail(e.target.value);
                clearField("authorEmail");
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--fg)",
              }}
            />
            <FieldError message={fieldErrors.authorEmail} />
          </div>
        </div>

        <div className={fieldErrors.content ? "field-invalid" : undefined}>
          <label htmlFor="c-content" className="tiny muted block" style={{ marginBottom: "4px" }}>
            Your Commentary or Question
          </label>
          <textarea
            id="c-content"
            rows={4}
            maxLength={1000}
            placeholder="Share your practical experience or questions regarding this workflow..."
            value={content}
            aria-invalid={fieldErrors.content ? true : undefined}
            onChange={(e) => {
              setContent(e.target.value);
              clearField("content");
            }}
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
          <FieldError message={fieldErrors.content} />
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

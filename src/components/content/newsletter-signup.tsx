"use client";

import { useState } from "react";
import { FieldError } from "@/components/field-error";
import { newsletterSubscribeSchema } from "@/lib/validations/newsletter";
import { readApiError, validationErrorPayload, dropField, type FieldErrors } from "@/lib/validations/feedback";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearField = (key: string) => setFieldErrors((prev) => dropField(prev, key));

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const parsed = newsletterSubscribeSchema.safeParse({ email, consent });
    if (!parsed.success) {
      const failure = validationErrorPayload(parsed.error);
      setFieldErrors(failure.fields);
      setMessage({ type: "error", text: failure.message });
      return;
    }

    setLoading(true);
    setFieldErrors({});

    try {
      const res = await fetch("/api/v1/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email, consent: true }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const failure = readApiError(json, "We couldn't subscribe you just now. Please try again.");
        setFieldErrors(failure.fields);
        throw new Error(failure.message);
      }

      setMessage({
        type: "success",
        text: "You're subscribed. You'll receive factual software and GST compliance briefings.",
      });
      setEmail("");
      setConsent(false);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="panel card--pad"
      style={{
        padding: "28px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        marginTop: "48px",
      }}
    >
      <div className="row between" style={{ flexWrap: "wrap", gap: "20px", alignItems: "center" }}>
        <div style={{ maxWidth: "480px" }}>
          <span className="eyebrow" style={{ color: "var(--primary-text)" }}>
            Monthly Independent Briefing
          </span>
          <h3 style={{ fontSize: "1.35rem", margin: "6px 0 8px" }}>
            Software pricing shifts, GST changes &amp; ERP audit notes.
          </h3>
          <p className="tiny muted" style={{ margin: 0 }}>
            Zero promotional sponsored content. Pure factual analysis for Indian business owners, finance heads, and CAs. Unsubscribe anytime in one click.
          </p>
        </div>

        <form onSubmit={handleSubscribe} noValidate style={{ flex: "1 1 320px", maxWidth: "420px" }}>
          <div className="stack gap-10">
            <div className={fieldErrors.email ? "field-invalid" : undefined}>
              <div className="row gap-8">
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  aria-label="Email address"
                  aria-invalid={fieldErrors.email ? true : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearField("email");
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-pill)",
                    background: "var(--surface-2)",
                    color: "var(--fg)",
                    fontSize: "0.875rem",
                  }}
                />
                <button className="btn btn--primary" type="submit" disabled={loading} style={{ whiteSpace: "nowrap" }}>
                  {loading ? "Joining..." : "Subscribe"}
                </button>
              </div>
              <FieldError message={fieldErrors.email} />
            </div>

            <div className={fieldErrors.consent ? "field-invalid" : undefined}>
              <label className="row gap-8" style={{ cursor: "pointer", fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.4 }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    clearField("consent");
                  }}
                />
                <span>I agree to receive monthly software &amp; GST compliance emails.</span>
              </label>
              <FieldError message={fieldErrors.consent} />
            </div>
          </div>

          {message ? (
            <div
              role="status"
              style={{
                marginTop: "12px",
                fontSize: "0.8rem",
                color: message.type === "success" ? "var(--primary-text)" : "var(--danger)",
              }}
            >
              {message.text}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}

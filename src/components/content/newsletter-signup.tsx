"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setMessage({ type: "error", text: "Please check the box to consent to receiving updates." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to subscribe to newsletter.");
      }

      setMessage({
        type: "success",
        text: "You're subscribed! You'll receive factual software and GST compliance briefings.",
      });
      setEmail("");
      setConsent(false);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
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

        <form onSubmit={handleSubscribe} style={{ flex: "1 1 320px", maxWidth: "420px" }}>
          <div className="stack gap-10">
            <div className="row gap-8">
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <label className="row gap-8" style={{ cursor: "pointer", fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.4 }}>
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>I agree to receive monthly software &amp; GST compliance emails.</span>
            </label>
          </div>

          {message ? (
            <div
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

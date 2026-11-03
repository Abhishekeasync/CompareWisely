"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHead } from "@/components/page-head";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">(token ? "idle" : "error");
  const [errorMessage, setErrorMessage] = useState<string>(
    token ? "" : "No unsubscribe token provided. Please check the link from your email."
  );

  async function handleConfirmUnsubscribe() {
    if (!token) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/v1/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to process unsubscribe request.");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel card--pad" style={{ padding: "32px", textAlign: "center" }}>
      {status === "success" ? (
        <div className="stack gap-16 center">
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "var(--primary-soft)",
              color: "var(--primary-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              margin: "0 auto",
            }}
          >
            ✓
          </div>
          <h2 style={{ fontSize: "1.35rem", margin: 0 }}>You Have Been Unsubscribed</h2>
          <p className="tiny muted">
            Your email has been removed from all newsletter dispatches. You will not receive any further automated emails from CompareWisely.
          </p>
          <Link className="btn btn--primary" href="/">
            Return to Homepage
          </Link>
        </div>
      ) : status === "error" ? (
        <div className="stack gap-16 center">
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "var(--danger-soft)",
              color: "var(--danger)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              margin: "0 auto",
            }}
          >
            !
          </div>
          <h2 style={{ fontSize: "1.35rem", margin: 0 }}>Unsubscribe Request Error</h2>
          <p className="tiny muted" style={{ color: "var(--danger)" }}>
            {errorMessage}
          </p>
          <Link className="btn" href="/">
            Return to Homepage
          </Link>
        </div>
      ) : (
        <div className="stack gap-16 center">
          <h2 style={{ fontSize: "1.35rem", margin: 0 }}>Confirm Unsubscribe</h2>
          <p className="tiny muted">
            Are you sure you want to stop receiving the monthly CompareWisely software market analysis and GST updates?
          </p>
          <div className="row gap-12 center" style={{ marginTop: "12px" }}>
            <button
              className="btn btn--primary"
              type="button"
              disabled={loading}
              onClick={handleConfirmUnsubscribe}
            >
              {loading ? "Processing..." : "Yes, Unsubscribe Me"}
            </button>
            <Link className="btn btn--ghost" href="/">
              Cancel
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewsletterUnsubscribePage() {
  return (
    <>
      <PageHead
        current="Unsubscribe"
        eyebrow="Preferences"
        title="Email Preferences"
        lead="Manage your subscription to CompareWisely software updates and compliance digests."
      />
      <section className="section">
        <div className="container" style={{ maxWidth: "600px" }}>
          <Suspense fallback={<div className="panel card--pad" style={{ padding: "32px", textAlign: "center" }}>Loading preferences...</div>}>
            <UnsubscribeContent />
          </Suspense>
        </div>
      </section>
    </>
  );
}

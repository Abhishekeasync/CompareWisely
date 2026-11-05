"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHead } from "@/components/page-head";
import { SITE_ADMIN_EMAIL } from "@/lib/site";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(SITE_ADMIN_EMAIL);
  const [password, setPassword] = useState("Admin@CompareWisely2026!");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Invalid credentials.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHead
        current="Staff Access"
        eyebrow="CompareWisely Portal"
        title="Admin &amp; Editorial Login"
        lead="Restricted staff portal for catalog auditing, verified pricing updates, and comment moderation."
      />
      <section className="section">
        <div className="container" style={{ maxWidth: "480px" }}>
          <div className="panel card--pad" style={{ padding: "32px" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>Sign In</h2>
            <p className="tiny muted" style={{ marginBottom: "24px" }}>
              Authorized credentials required. Actions are permanently recorded in the audit trail.
            </p>

            {errorMessage ? (
              <div
                style={{
                  background: "var(--danger-soft)",
                  border: "1px solid var(--danger)",
                  padding: "10px 14px",
                  fontSize: "0.85rem",
                  color: "var(--danger)",
                  marginBottom: "20px",
                }}
              >
                {errorMessage}
              </div>
            ) : null}

            <form onSubmit={handleLogin} className="stack gap-16">
              <div>
                <label className="tiny muted block" htmlFor="a-email" style={{ marginBottom: "6px" }}>
                  Staff Email Address
                </label>
                <input
                  id="a-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--fg)",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div>
                <label className="tiny muted block" htmlFor="a-pass" style={{ marginBottom: "6px" }}>
                  Password
                </label>
                <input
                  id="a-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--fg)",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <button
                className="btn btn--primary"
                type="submit"
                disabled={loading}
                style={{ width: "100%", marginTop: "8px", justifyContent: "center" }}
              >
                {loading ? "Authenticating..." : "Access Admin Portal"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

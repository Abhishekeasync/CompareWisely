"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHead } from "@/components/page-head";
import { FieldError } from "@/components/field-error";
import { SITE_ADMIN_EMAIL } from "@/lib/site";
import { loginSchema } from "@/lib/validations/auth";
import { readApiError, validationErrorPayload, dropField, type FieldErrors } from "@/lib/validations/feedback";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(SITE_ADMIN_EMAIL);
  const [password, setPassword] = useState("Admin@CompareWisely2026!");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearField = (key: string) => setFieldErrors((prev) => dropField(prev, key));

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const failure = validationErrorPayload(parsed.error);
      setFieldErrors(failure.fields);
      setErrorMessage(failure.message);
      return;
    }

    setLoading(true);
    setFieldErrors({});

    try {
      const res = await fetch("/api/v1/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const failure = readApiError(json, "That email and password don't match. Check both and try again.");
        setFieldErrors(failure.fields);
        throw new Error(failure.message);
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

            <form onSubmit={handleLogin} className="stack gap-16" noValidate>
              <div className={fieldErrors.email ? "field-invalid" : undefined}>
                <label className="tiny muted block" htmlFor="a-email" style={{ marginBottom: "6px" }}>
                  Staff Email Address
                </label>
                <input
                  id="a-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  aria-invalid={fieldErrors.email ? true : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearField("email");
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--fg)",
                    fontSize: "0.9rem",
                  }}
                />
                <FieldError message={fieldErrors.email} />
              </div>

              <div className={fieldErrors.password ? "field-invalid" : undefined}>
                <label className="tiny muted block" htmlFor="a-pass" style={{ marginBottom: "6px" }}>
                  Password
                </label>
                <input
                  id="a-pass"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  aria-invalid={fieldErrors.password ? true : undefined}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearField("password");
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--fg)",
                    fontSize: "0.9rem",
                  }}
                />
                <FieldError message={fieldErrors.password} />
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

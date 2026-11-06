"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { FieldError } from "@/components/field-error";
import { uiInput as INPUT_STYLE, uiInputMono as MONO_INPUT } from "@/lib/ui-surfaces";
import { comparisonCreateSchema } from "@/lib/validations/comparison";
import { readApiError, validationErrorPayload, dropField, type FieldErrors } from "@/lib/validations/feedback";

interface SoftwareOption {
  id: number;
  name: string;
  slug: string;
}

interface ComparisonBuilderFormProps {
  software: SoftwareOption[];
}

function autoSlug(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--muted)",
        borderBottom: "1px solid var(--border)",
        paddingBottom: "6px",
        marginBottom: "16px",
      }}
    >
      {children}
    </div>
  );
}

export function ComparisonBuilderForm({ software }: ComparisonBuilderFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [verdictSummary, setVerdictSummary] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearError = (key: string) => setFieldErrors((prev) => dropField(prev, key));

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTitle(val);
    clearError("title");
    if (!slug || slug === autoSlug(title)) {
      setSlug(autoSlug(val));
      clearError("slug");
    }
  }

  function toggleProduct(id: number) {
    clearError("productIds");
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev; // max 4
      return [...prev, id];
    });
  }

  function moveProduct(index: number, direction: -1 | 1) {
    setSelectedIds((prev) => {
      const next = [...prev];
      const swap = index + direction;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const payload = {
      title,
      slug,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      verdictSummary: verdictSummary || undefined,
      isPublished,
      productIds: selectedIds,
    };
    const parsed = comparisonCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const failure = validationErrorPayload(parsed.error);
      setFieldErrors(failure.fields);
      setErrorMsg(failure.message);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    try {
      const res = await fetch("/api/v1/admin/comparisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          metaTitle: metaTitle || undefined,
          metaDescription: metaDescription || undefined,
          verdictSummary: verdictSummary || undefined,
          isPublished,
          productIds: selectedIds,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const failure = readApiError(json, "Could not create this comparison. Please try again.");
        setFieldErrors(failure.fields);
        throw new Error(failure.message);
      }

      router.push("/admin/comparisons");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSoftware = selectedIds.map((id) => software.find((s) => s.id === id)!).filter(Boolean);

  return (
    <>
      <PageHead
        current="New Comparison"
        eyebrow="Admin Portal"
        title="Build a New Comparison Page"
        lead="Select 2–4 software products to build a curated head-to-head comparison page. Drag to reorder product slots."
      />
      <section className="section">
        <div className="container" style={{ maxWidth: "900px" }}>
          <form onSubmit={handleSubmit} noValidate>
            <div
              className="panel card--pad"
              style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "28px" }}
            >
              {errorMsg && (
                <div
                  style={{
                    background: "var(--danger-soft)",
                    border: "1px solid var(--danger)",
                    padding: "10px 14px",
                    fontSize: "0.85rem",
                    color: "var(--danger)",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {/* ── Comparison metadata ── */}
              <div>
                <SectionLabel>Comparison Page Details</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div className={fieldErrors.title ? "field-invalid" : undefined}>
                    <label
                      style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "6px" }}
                    >
                      Page Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tally Prime vs Zoho Books vs Busy Accounting 2026"
                      value={title}
                      onChange={handleTitleChange}
                      style={{ ...INPUT_STYLE, fontWeight: 600, fontSize: "1rem" }}
                    />
                    <FieldError message={fieldErrors.title} />
                  </div>

                  <div className={fieldErrors.slug ? "field-invalid" : undefined}>
                    <label
                      style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "6px" }}
                    >
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      placeholder="tally-prime-vs-zoho-books-vs-busy"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        clearError("slug");
                      }}
                      style={MONO_INPUT}
                    />
                    <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                      Will be published at /compare/{slug || "<slug>"}
                    </span>
                    <FieldError message={fieldErrors.slug} />
                  </div>

                  <div className={fieldErrors.verdictSummary ? "field-invalid" : undefined}>
                    <label
                      style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "6px" }}
                    >
                      Editorial Verdict Summary
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Overall editorial summary: who should pick which product and why..."
                      value={verdictSummary}
                      onChange={(e) => {
                        setVerdictSummary(e.target.value);
                        clearError("verdictSummary");
                      }}
                      style={{ ...INPUT_STYLE, fontFamily: "inherit", lineHeight: 1.5 }}
                    />
                    <FieldError message={fieldErrors.verdictSummary} />
                  </div>
                </div>
              </div>

              {/* ── SEO ── */}
              <div>
                <SectionLabel>SEO Metadata</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div className={fieldErrors.metaTitle ? "field-invalid" : undefined}>
                    <label
                      style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "6px" }}
                    >
                      SEO Title{" "}
                      <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                        ({metaTitle.length}/60)
                      </span>
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      placeholder="Leave blank to use page title"
                      value={metaTitle}
                      onChange={(e) => {
                        setMetaTitle(e.target.value);
                        clearError("metaTitle");
                      }}
                      style={INPUT_STYLE}
                    />
                    <FieldError message={fieldErrors.metaTitle} />
                  </div>

                  <div className={fieldErrors.metaDescription ? "field-invalid" : undefined}>
                    <label
                      style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "6px" }}
                    >
                      Meta Description{" "}
                      <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                        ({metaDescription.length}/160)
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      maxLength={160}
                      placeholder="Shown in Google search snippets..."
                      value={metaDescription}
                      onChange={(e) => {
                        setMetaDescription(e.target.value);
                        clearError("metaDescription");
                      }}
                      style={{ ...INPUT_STYLE, fontFamily: "inherit", lineHeight: 1.5 }}
                    />
                    <FieldError message={fieldErrors.metaDescription} />
                  </div>
                </div>
              </div>

              {/* ── Product slot builder ── */}
              <div>
                <SectionLabel>Product Slots (2–4 products)</SectionLabel>

                {/* Selected products in order */}
                {selectedSoftware.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "8px" }}>
                      Selected — drag order determines column position in the matrix:
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {selectedSoftware.map((sw, i) => (
                        <div
                          key={sw.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 12px",
                            background: "var(--primary-soft)",
                            border: "1px solid var(--primary-text)",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              color: "var(--primary-text)",
                              minWidth: "20px",
                            }}
                          >
                            #{i + 1}
                          </span>
                          <span style={{ flex: 1, fontWeight: 600, fontSize: "0.9rem" }}>
                            {sw.name}
                          </span>
                          <button
                            type="button"
                            className="btn btn--sm btn--ghost"
                            disabled={i === 0}
                            onClick={() => moveProduct(i, -1)}
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="btn btn--sm btn--ghost"
                            disabled={i === selectedSoftware.length - 1}
                            onClick={() => moveProduct(i, 1)}
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="btn btn--sm btn--ghost"
                            onClick={() => toggleProduct(sw.id)}
                            style={{ color: "var(--danger)" }}
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product picker */}
                <div
                  style={{
                    border: "1px solid var(--border)",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {software.map((sw) => {
                    const isSelected = selectedIds.includes(sw.id);
                    const isDisabled = !isSelected && selectedIds.length >= 4;
                    return (
                      <label
                        key={sw.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 14px",
                          borderBottom: "1px solid var(--border)",
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          background: isSelected ? "var(--surface-2)" : "var(--surface)",
                          opacity: isDisabled ? 0.5 : 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => toggleProduct(sw.id)}
                          style={{ width: "15px", height: "15px" }}
                        />
                        <span style={{ fontWeight: isSelected ? 600 : 400 }}>{sw.name}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginLeft: "auto" }}>
                          /software/{sw.slug}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <FieldError message={fieldErrors.productIds} />
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "4px" }}>
                  {selectedIds.length} of 4 maximum slots filled
                </div>
              </div>

              {/* ── Publish toggle ── */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "14px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <input
                    id="cmp-published"
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <label htmlFor="cmp-published" style={{ fontSize: "0.9rem", cursor: "pointer" }}>
                    <b>{isPublished ? "Publish immediately" : "Save as draft"}</b>
                    {" "}—{" "}
                    {isPublished
                      ? "Page will be visible at /compare/" + (slug || "<slug>")
                      : "Page will not be indexed or shown publicly."}
                  </label>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "20px",
                    borderTop: "1px solid var(--border)",
                    marginTop: "16px",
                  }}
                >
                  <Link className="btn btn--ghost" href="/admin/comparisons">
                    ← Back to Comparisons
                  </Link>
                  <button
                    className="btn btn--primary"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Creating..."
                      : isPublished
                      ? "Publish Comparison Page"
                      : "Save Draft"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

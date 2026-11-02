"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { AdminNav } from "@/components/admin/admin-nav";
import { isDirectHostedVideoUrl, isManagedArticleMediaUrl } from "@/lib/uploads/article-media-config";
import { MAX_ARTICLE_IMAGES, normalizeArticleImageUrls } from "@/lib/uploads/article-images";
import { isArticleMediaUrl } from "@/lib/validations/media-url";
import { uiInput as INPUT_STYLE, uiInputMono as MONO_INPUT } from "@/lib/ui-surfaces";

interface CategoryOption {
  id: number;
  name: string;
}

interface ArticleEditorFormProps {
  categories: CategoryOption[];
  /** If provided, the editor is in edit mode */
  article?: {
    id: number;
    title: string;
    slug: string;
    articleType: "BLOG" | "FINANCE_UPDATE";
    excerpt?: string | null;
    content: string;
    featuredImageUrl?: string | null;
    imageUrls?: unknown;
    videoUrl?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    canonicalUrl?: string | null;
    categoryId?: number | null;
    isPublished: boolean;
    tags: { tagName: string }[];
  };
}

function autoSlug(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ─── Small section label ──────────────────────────────── */
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

/* ─── Generic labelled field wrapper ───────────────────── */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: "6px" }}>
        <label
          style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--fg)", display: "block" }}
        >
          {label}
        </label>
        {hint && (
          <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Main Editor Component
══════════════════════════════════════════════════════════ */
export function ArticleEditorForm({ categories: initialCategories, article }: ArticleEditorFormProps) {
  const router = useRouter();
  const isEdit = Boolean(article);

  /* ── Core fields ─────────────────────────────────────── */
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [articleType, setArticleType] = useState<"BLOG" | "FINANCE_UPDATE">(
    article?.articleType ?? "BLOG"
  );
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [tagsInput, setTagsInput] = useState(
    article?.tags?.map((t) => t.tagName).join(", ") ?? "GST, Compliance, Accounting"
  );
  const [isPublished, setIsPublished] = useState(article?.isPublished ?? true);

  /* ── Media fields ────────────────────────────────────── */
  const [imageUrls, setImageUrls] = useState<string[]>(() =>
    normalizeArticleImageUrls(article?.imageUrls, article?.featuredImageUrl)
  );
  const [imageUrlDraft, setImageUrlDraft] = useState("");
  const [videoUrl, setVideoUrl] = useState(article?.videoUrl ?? "");
  const [removingImageUrl, setRemovingImageUrl] = useState<string | null>(null);

  /* ── SEO fields ──────────────────────────────────────── */
  const [metaTitle, setMetaTitle] = useState(article?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(article?.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(article?.canonicalUrl ?? "");

  /* ── Category ────────────────────────────────────────── */
  const [categories, setCategories] = useState<CategoryOption[]>(initialCategories);
  const [categoryId, setCategoryId] = useState<string>(
    article?.categoryId ? String(article.categoryId) : ""
  );

  /* ── Inline category creation ────────────────────────── */
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [catCreating, setCatCreating] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  /* ── Form state ──────────────────────────────────────── */
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);

  /* ── Handlers ────────────────────────────────────────── */
  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTitle(val);
    if (!slug || slug === autoSlug(title)) {
      setSlug(autoSlug(val));
    }
    if (!metaTitle) setMetaTitle(val.slice(0, 60));
  }

  function handleNewCatNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setNewCatName(val);
    if (!newCatSlug || newCatSlug === autoSlug(newCatName)) {
      setNewCatSlug(autoSlug(val));
    }
  }

  async function createCategory() {
    setCatCreating(true);
    setCatError(null);
    try {
      const res = await fetch("/api/v1/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName, slug: newCatSlug }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create category.");
      }
      const created: CategoryOption = json.data;
      setCategories((prev) => [...prev, created]);
      setCategoryId(String(created.id));
      setNewCatName("");
      setNewCatSlug("");
      setShowNewCat(false);
    } catch (err: any) {
      setCatError(err.message);
    } finally {
      setCatCreating(false);
    }
  }

  async function uploadArticleMedia(file: File, kind: "image" | "video") {
    setMediaUploadError(null);
    if (kind === "image") setImageUploading(true);
    else setVideoUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);

      const res = await fetch("/api/v1/admin/articles/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Upload failed.");
      }

      const url: string = json.data.url;
      if (kind === "image") {
        setImageUrls((prev) => {
          if (prev.length >= MAX_ARTICLE_IMAGES || prev.includes(url)) {
            return prev;
          }
          return [...prev, url];
        });
      } else {
        setVideoUrl(url);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setMediaUploadError(message);
    } finally {
      if (kind === "image") setImageUploading(false);
      else setVideoUploading(false);
    }
  }

  function handleFeaturedImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      if (imageUrls.length >= MAX_ARTICLE_IMAGES) {
        setMediaUploadError(`You can add up to ${MAX_ARTICLE_IMAGES} images.`);
        return;
      }
      void uploadArticleMedia(file, "image");
    }
  }

  function addImageUrlFromDraft() {
    setMediaUploadError(null);
    const trimmed = imageUrlDraft.trim();
    if (!trimmed) return;
    if (!isArticleMediaUrl(trimmed)) {
      setMediaUploadError("Enter a valid HTTPS URL or uploaded file path.");
      return;
    }
    if (imageUrls.length >= MAX_ARTICLE_IMAGES) {
      setMediaUploadError(`You can add up to ${MAX_ARTICLE_IMAGES} images.`);
      return;
    }
    if (imageUrls.includes(trimmed)) {
      setMediaUploadError("This image is already in the list.");
      return;
    }
    setImageUrls((prev) => [...prev, trimmed]);
    setImageUrlDraft("");
  }

  async function removeArticleImage(url: string) {
    setMediaUploadError(null);
    setRemovingImageUrl(url);
    try {
      if (isManagedArticleMediaUrl(url)) {
        const res = await fetch("/api/v1/admin/articles/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Could not delete upload.");
        }
      }
      setImageUrls((prev) => prev.filter((item) => item !== url));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not remove image.";
      setMediaUploadError(message);
    } finally {
      setRemovingImageUrl(null);
    }
  }

  function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void uploadArticleMedia(file, "video");
  }

  const isHostedVideoFile = isDirectHostedVideoUrl(videoUrl);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title,
      slug,
      articleType,
      categoryId: categoryId ? Number(categoryId) : undefined,
      excerpt: excerpt || undefined,
      content,
      tags,
      isPublished,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      videoUrl: videoUrl || undefined,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      canonicalUrl: canonicalUrl || undefined,
    };

    try {
      const url = isEdit
        ? `/api/v1/admin/articles/${article!.id}`
        : "/api/v1/admin/articles";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to save article.");
      }

      router.push("/admin/articles");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Render ──────────────────────────────────────────── */
  return (
    <>
      <PageHead
        current={isEdit ? "Edit Article" : "New Article"}
        eyebrow="Admin CMS"
        title={isEdit ? "Edit Article or Finance Update" : "Write Article or Finance Update"}
        lead="Create technical guides, comparative benchmarks, or statutory CBIC compliance notices."
      />
      <section className="section">
        <div className="container" style={{ maxWidth: "900px" }}>
          <AdminNav current="articles" />

          <form onSubmit={handleSubmit}>
            <div
              className="panel card--pad"
              style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "28px" }}
            >
              {errorMsg ? (
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
              ) : null}

              {/* ── Publication type & Category ── */}
              <div>
                <SectionLabel>Publication Details</SectionLabel>
                <div className="row gap-12" style={{ flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 200px" }}>
                    <Field label="Publication Type">
                      <select
                        id="art-type"
                        value={articleType}
                        onChange={(e) => setArticleType(e.target.value as any)}
                        style={INPUT_STYLE}
                      >
                        <option value="BLOG">Educational Blog Guide (/blog)</option>
                        <option value="FINANCE_UPDATE">Statutory Update (/finance-updates)</option>
                      </select>
                    </Field>
                  </div>

                  <div style={{ flex: "1 1 220px" }}>
                    <Field label="Category" hint="Select or create a new category below">
                      <div style={{ display: "flex", gap: "8px" }}>
                        <select
                          id="art-cat"
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          style={{ ...INPUT_STYLE, flex: 1 }}
                        >
                          <option value="">— General / Uncategorized —</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn--sm btn--ghost"
                          onClick={() => setShowNewCat((v) => !v)}
                          title="Create a new category"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {showNewCat ? "✕ Cancel" : "+ New"}
                        </button>
                      </div>

                      {showNewCat && (
                        <div
                          style={{
                            marginTop: "10px",
                            padding: "14px",
                            background: "var(--surface-2)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)" }}>
                            Create New Category
                          </span>
                          {catError && (
                            <span style={{ fontSize: "0.78rem", color: "var(--danger)" }}>{catError}</span>
                          )}
                          <input
                            type="text"
                            placeholder="Category name (e.g. GST Compliance)"
                            value={newCatName}
                            onChange={handleNewCatNameChange}
                            style={INPUT_STYLE}
                          />
                          <input
                            type="text"
                            placeholder="URL slug (auto-generated)"
                            value={newCatSlug}
                            onChange={(e) => setNewCatSlug(e.target.value)}
                            style={MONO_INPUT}
                          />
                          <button
                            type="button"
                            className="btn btn--sm btn--primary"
                            disabled={catCreating || !newCatName || !newCatSlug}
                            onClick={createCategory}
                          >
                            {catCreating ? "Creating..." : "Create & Select"}
                          </button>
                        </div>
                      )}
                    </Field>
                  </div>
                </div>
              </div>

              {/* ── Core content ── */}
              <div>
                <SectionLabel>Content</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <Field label="Article Title *">
                    <input
                      id="art-title"
                      type="text"
                      required
                      minLength={5}
                      placeholder="e.g. GSTR-2B Automated Reconciliation in 2026: Tally vs Zoho vs Busy"
                      value={title}
                      onChange={handleTitleChange}
                      style={{ ...INPUT_STYLE, fontWeight: 600, fontSize: "1rem" }}
                    />
                  </Field>

                  <Field label="URL Slug *" hint="Auto-generated from title — only lowercase letters, numbers, hyphens">
                    <input
                      id="art-slug"
                      type="text"
                      required
                      minLength={3}
                      pattern="^[a-z0-9-]+$"
                      placeholder="e.g. gstr-2b-reconciliation-2026"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      style={MONO_INPUT}
                    />
                  </Field>

                  <Field label="Short Excerpt" hint="Max 300 characters — shown on listing cards and used as default meta description">
                    <textarea
                      id="art-excerpt"
                      rows={2}
                      maxLength={300}
                      placeholder="Brief synopsis displayed on listing cards and search results..."
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      style={{ ...INPUT_STYLE, fontFamily: "inherit", lineHeight: 1.5 }}
                    />
                  </Field>

                  <Field label="Article Body *" hint="Markdown supported: ## Headings, **bold**, - lists, > blockquotes">
                    <textarea
                      id="art-content"
                      required
                      rows={16}
                      placeholder={"## The Core Compliance Challenge\n\nExplain technical workflows, statutory notifications, or side-by-side differences...\n\n### Practical Recommendations\n\n1. Zoho Books for cloud...\n2. Tally Prime for offline vouchers..."}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      style={{ ...MONO_INPUT, lineHeight: 1.6 }}
                    />
                  </Field>

                  <Field label="Comma-separated Tags">
                    <input
                      id="art-tags"
                      type="text"
                      placeholder="e.g. GST, E-Invoicing, CBIC, Accounting"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      style={INPUT_STYLE}
                    />
                  </Field>
                </div>
              </div>

              {/* ── Media ── */}
              <div>
                <SectionLabel>Media</SectionLabel>
                {mediaUploadError ? (
                  <div
                    style={{
                      marginBottom: "14px",
                      padding: "8px 12px",
                      fontSize: "0.82rem",
                      color: "var(--danger)",
                      background: "var(--danger-soft)",
                      border: "1px solid var(--danger)",
                    }}
                  >
                    {mediaUploadError}
                  </div>
                ) : null}
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <Field
                    label={`Article Images (${imageUrls.length}/${MAX_ARTICLE_IMAGES})`}
                    hint="Upload JPEG, PNG, WebP, or GIF (max 5 MB each) to S3, or paste a direct HTTPS URL. First image is the hero / Open Graph image."
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                      <label
                        className="btn btn--sm btn--ghost"
                        style={{
                          cursor: imageUrls.length >= MAX_ARTICLE_IMAGES ? "not-allowed" : "pointer",
                          margin: 0,
                          opacity: imageUrls.length >= MAX_ARTICLE_IMAGES ? 0.5 : 1,
                        }}
                      >
                        {imageUploading ? "Uploading…" : "Upload image"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleFeaturedImageFile}
                          disabled={imageUploading || imageUrls.length >= MAX_ARTICLE_IMAGES}
                          style={{ display: "none" }}
                        />
                      </label>
                      <span className="tiny muted">or paste URL</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                      <input
                        id="art-image-url"
                        type="text"
                        placeholder="https://… or /uploads/articles/…"
                        value={imageUrlDraft}
                        onChange={(e) => setImageUrlDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addImageUrlFromDraft();
                          }
                        }}
                        style={{ ...INPUT_STYLE, flex: "1 1 220px" }}
                      />
                      <button
                        type="button"
                        className="btn btn--sm btn--ghost"
                        disabled={!imageUrlDraft.trim() || imageUrls.length >= MAX_ARTICLE_IMAGES}
                        onClick={addImageUrlFromDraft}
                      >
                        Add URL
                      </button>
                    </div>
                    {imageUrls.length > 0 ? (
                      <div
                        style={{
                          marginTop: "14px",
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                          gap: "12px",
                        }}
                      >
                        {imageUrls.map((url, index) => (
                          <div
                            key={url}
                            style={{
                              border: "1px solid var(--border)",
                              padding: "6px",
                              background: "var(--surface-2)",
                              position: "relative",
                            }}
                          >
                            <span
                              className="tiny"
                              style={{
                                position: "absolute",
                                top: "8px",
                                left: "8px",
                                background: "var(--surface)",
                                padding: "2px 6px",
                                border: "1px solid var(--border)",
                                fontWeight: 700,
                              }}
                            >
                              {index === 0 ? "Hero" : `#${index + 1}`}
                            </span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Article image ${index + 1}`}
                              style={{
                                width: "100%",
                                height: "120px",
                                objectFit: "cover",
                                display: "block",
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn--sm btn--ghost"
                              style={{
                                width: "100%",
                                marginTop: "6px",
                                color: "var(--danger)",
                              }}
                              disabled={removingImageUrl === url}
                              onClick={() => void removeArticleImage(url)}
                            >
                              {removingImageUrl === url ? "Removing…" : "Remove"}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </Field>

                  <Field
                    label="Video"
                    hint="Upload MP4 or WebM (max 50 MB) to S3, or paste a YouTube / Vimeo link for embed."
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                      <label className="btn btn--sm btn--ghost" style={{ cursor: "pointer", margin: 0 }}>
                        {videoUploading ? "Uploading…" : "Upload video"}
                        <input
                          type="file"
                          accept="video/mp4,video/webm"
                          onChange={handleVideoFile}
                          disabled={videoUploading}
                          style={{ display: "none" }}
                        />
                      </label>
                      <span className="tiny muted">or paste embed URL</span>
                    </div>
                    <input
                      id="art-video-url"
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=… or /uploads/articles/…"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      style={{ ...INPUT_STYLE, marginTop: "10px" }}
                    />
                    {videoUrl && isHostedVideoFile ? (
                      <div
                        style={{
                          marginTop: "10px",
                          border: "1px solid var(--border)",
                          padding: "6px",
                          background: "var(--surface-2)",
                        }}
                      >
                        <video
                          src={videoUrl}
                          controls
                          style={{ maxWidth: "100%", maxHeight: "220px" }}
                        />
                      </div>
                    ) : videoUrl ? (
                      <div style={{ marginTop: "8px", fontSize: "0.78rem", color: "var(--muted)" }}>
                        ✓ Video link saved — will be embedded on the article page.
                      </div>
                    ) : null}
                  </Field>
                </div>
              </div>

              {/* ── SEO ── */}
              <div>
                <SectionLabel>SEO &amp; Indexing</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <Field
                    label="SEO Title (meta title)"
                    hint={`${metaTitle.length}/60 characters — leave blank to use article title`}
                  >
                    <input
                      id="art-meta-title"
                      type="text"
                      maxLength={60}
                      placeholder="Overrides the browser tab title and Google headline"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      style={INPUT_STYLE}
                    />
                    <div
                      style={{
                        marginTop: "4px",
                        height: "3px",
                        background: "var(--border)",
                        borderRadius: "var(--r-sm)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min((metaTitle.length / 60) * 100, 100)}%`,
                          background:
                            metaTitle.length > 55
                              ? "var(--danger)"
                              : metaTitle.length > 40
                              ? "var(--amber)"
                              : "var(--primary-text)",
                          transition: "width 0.2s",
                        }}
                      />
                    </div>
                  </Field>

                  <Field
                    label="Meta Description"
                    hint={`${metaDescription.length}/160 characters — shown in Google search snippets`}
                  >
                    <textarea
                      id="art-meta-desc"
                      rows={3}
                      maxLength={160}
                      placeholder="Compelling summary shown in Google search results. If blank, the excerpt is used."
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      style={{ ...INPUT_STYLE, fontFamily: "inherit", lineHeight: 1.5 }}
                    />
                    <div
                      style={{
                        marginTop: "4px",
                        height: "3px",
                        background: "var(--border)",
                        borderRadius: "var(--r-sm)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min((metaDescription.length / 160) * 100, 100)}%`,
                          background:
                            metaDescription.length > 150
                              ? "var(--danger)"
                              : metaDescription.length > 120
                              ? "var(--amber)"
                              : "var(--primary-text)",
                          transition: "width 0.2s",
                        }}
                      />
                    </div>
                  </Field>

                  <Field
                    label="Canonical URL"
                    hint="Use only if this article is a copy/syndication of content from another URL"
                  >
                    <input
                      id="art-canonical"
                      type="url"
                      placeholder="https://originalsite.com/original-article-path"
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      style={MONO_INPUT}
                    />
                  </Field>
                </div>
              </div>

              {/* ── Publish toggle & actions ── */}
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
                    id="art-published"
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <label htmlFor="art-published" style={{ fontSize: "0.9rem", cursor: "pointer" }}>
                    <b>{isPublished ? "Publish immediately" : "Save as draft"}</b>
                    {" "}— {isPublished
                      ? "Article will be visible on the public site."
                      : "Article will not be indexed or shown publicly."}
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
                  <Link className="btn btn--ghost" href="/admin/articles">
                    ← Back to Articles
                  </Link>
                  <button className="btn btn--primary" type="submit" disabled={submitting}>
                    {submitting
                      ? "Saving..."
                      : isEdit
                      ? "Save Changes"
                      : isPublished
                      ? "Publish Article"
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { FieldError } from "@/components/field-error";
import { ArticleImageCarousel } from "@/components/content/article-image-carousel";
import { isDirectHostedVideoUrl, isManagedArticleMediaUrl } from "@/lib/uploads/article-media-config";
import { MAX_ARTICLE_IMAGES, normalizeArticleImageUrls } from "@/lib/uploads/article-images";
import { isArticleMediaUrl } from "@/lib/validations/media-url";
import { articleInputSchema, categoryCreateSchema } from "@/lib/validations/content";
import { readApiError, validationErrorPayload, dropField, type FieldErrors } from "@/lib/validations/feedback";
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
function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={error ? "field-invalid" : undefined}>
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
      <FieldError message={error} />
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);

  /* ── Handlers ────────────────────────────────────────── */
  const clearError = (key: string) => setFieldErrors((prev) => dropField(prev, key));

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTitle(val);
    clearError("title");
    if (!slug || slug === autoSlug(title)) {
      setSlug(autoSlug(val));
      clearError("slug");
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
    setCatError(null);
    const parsed = categoryCreateSchema.safeParse({ name: newCatName, slug: newCatSlug });
    if (!parsed.success) {
      setCatError(validationErrorPayload(parsed.error).message);
      return;
    }

    setCatCreating(true);
    try {
      const res = await fetch("/api/v1/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName, slug: newCatSlug }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const failure = readApiError(json, "Could not create that category.");
        throw new Error(failure.message);
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

    const parsed = articleInputSchema.safeParse(payload);
    if (!parsed.success) {
      const failure = validationErrorPayload(parsed.error);
      setFieldErrors(failure.fields);
      setErrorMsg(failure.message);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

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
        const failure = readApiError(json, "Could not save this article. Please try again.");
        setFieldErrors(failure.fields);
        throw new Error(failure.message);
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
          <form onSubmit={handleSubmit} noValidate>
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
                            disabled={catCreating}
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
                  <Field label="Article Title *" error={fieldErrors.title}>
                    <input
                      id="art-title"
                      type="text"
                      minLength={5}
                      placeholder="e.g. GSTR-2B Automated Reconciliation in 2026: Tally vs Zoho vs Busy"
                      value={title}
                      onChange={handleTitleChange}
                      style={{ ...INPUT_STYLE, fontWeight: 600, fontSize: "1rem" }}
                    />
                  </Field>

                  <Field label="URL Slug *" hint="Auto-generated from title — only lowercase letters, numbers, hyphens" error={fieldErrors.slug}>
                    <input
                      id="art-slug"
                      type="text"
                      required
                      minLength={3}
                      pattern="^[a-z0-9-]+$"
                      placeholder="e.g. gstr-2b-reconciliation-2026"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        clearError("slug");
                      }}
                      style={MONO_INPUT}
                    />
                  </Field>

                  <Field label="Short Excerpt" hint="Max 300 characters — shown on listing cards and used as default meta description" error={fieldErrors.excerpt}>
                    <textarea
                      id="art-excerpt"
                      rows={2}
                      maxLength={300}
                      placeholder="Brief synopsis displayed on listing cards and search results..."
                      value={excerpt}
                      onChange={(e) => {
                        setExcerpt(e.target.value);
                        clearError("excerpt");
                      }}
                      style={{ ...INPUT_STYLE, fontFamily: "inherit", lineHeight: 1.5 }}
                    />
                  </Field>

                  <Field label="Article Body *" hint="Markdown supported: ## Headings, **bold**, - lists, > blockquotes" error={fieldErrors.content}>
                    <textarea
                      id="art-content"
                      rows={16}
                      placeholder={"## The Core Compliance Challenge\n\nExplain technical workflows, statutory notifications, or side-by-side differences...\n\n### Practical Recommendations\n\n1. Zoho Books for cloud...\n2. Tally Prime for offline vouchers..."}
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                        clearError("content");
                      }}
                      style={{ ...MONO_INPUT, lineHeight: 1.6 }}
                    />
                  </Field>

                  <Field label="Comma-separated Tags" error={fieldErrors.tags}>
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
                    hint="Upload JPEG, PNG, WebP, or GIF (max 5 MB each) to S3, or paste a direct HTTPS URL. The first image is the hero and Open Graph image. Two or more images show as a carousel on the article."
                    error={fieldErrors.imageUrls}
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
                      <div style={{ marginTop: "14px" }}>
                        <ArticleImageCarousel
                          images={imageUrls}
                          onRemove={(url) => void removeArticleImage(url)}
                          removingUrl={removingImageUrl}
                        />
                      </div>
                    ) : null}
                  </Field>

                  <Field
                    label="Video"
                    hint="Upload MP4 or WebM (max 50 MB) to S3, or paste a YouTube / Vimeo link for embed."
                    error={fieldErrors.videoUrl}
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
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        clearError("videoUrl");
                      }}
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
                    error={fieldErrors.metaTitle}
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
                    error={fieldErrors.metaDescription}
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
                    error={fieldErrors.canonicalUrl}
                  >
                    <input
                      id="art-canonical"
                      type="url"
                      placeholder="https://originalsite.com/original-article-path"
                      value={canonicalUrl}
                      onChange={(e) => {
                        setCanonicalUrl(e.target.value);
                        clearError("canonicalUrl");
                      }}
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

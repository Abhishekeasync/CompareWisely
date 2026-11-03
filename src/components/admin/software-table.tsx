"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PricingVerificationModal } from "./pricing-modal";

interface Category {
  id: number;
  name: string;
  slug?: string;
}

interface AvailableFeature {
  id: number;
  name: string;
  code: string;
  categoryId: number;
  category?: { id: number; name: string; slug: string };
  dataType?: string;
  [key: string]: any;
}

interface FeatureCheckpointItem {
  id?: number;
  featureId?: number;
  featureName: string;
  categoryName: string;
  valueKind: "YES" | "NO" | "PARTIAL" | "PAID_ADDON" | "UNAVAILABLE" | "UNKNOWN";
  textValue: string;
  note: string;
}

interface PricingPlan {
  id: number;
  planName: string;
  displayPrice: string | null;
  priceAmount?: any;
  billingCycle?: any;
  isStartingPrice: boolean;
  verifiedAt: Date | string | null;
  verificationSourceUrl: string | null;
  [key: string]: any;
}

interface SoftwareProduct {
  id: number;
  name: string;
  slug: string;
  mono: string;
  logoUrl?: string | null;
  tagline?: string | null;
  description: string;
  websiteUrl?: string | null;
  trialUrl?: string | null;
  categoryId: number;
  category?: any;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  verifiedAt?: Date | string | null;
  verifiedBy?: any;
  pricingPlans: any[];
  featureValues?: any[];
  pros?: any;
  cons?: any;
  createdAt?: any;
  [key: string]: any;
}

interface AdminSoftwareTableProps {
  initialSoftwareList?: SoftwareProduct[];
  softwareList?: SoftwareProduct[];
  categories?: Category[];
  availableFeatures?: AvailableFeature[];
}

interface SoftwareFormData {
  id?: number;
  name: string;
  slug: string;
  mono: string;
  categoryId: number;
  tagline: string;
  description: string;
  websiteUrl: string;
  trialUrl: string;
  logoUrl: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  prosText: string;
  consText: string;
  startingPrice: string;
}

export function AdminSoftwareTable({
  initialSoftwareList,
  softwareList: fallbackSoftwareList,
  categories = [],
  availableFeatures = [],
}: AdminSoftwareTableProps) {
  const router = useRouter();
  const [list, setList] = useState<SoftwareProduct[]>(
    initialSoftwareList || fallbackSoftwareList || []
  );
  const [prevInitial, setPrevInitial] = useState(initialSoftwareList ?? fallbackSoftwareList);
  const currentInitial = initialSoftwareList ?? fallbackSoftwareList;
  if (currentInitial !== prevInitial) {
    setPrevInitial(currentInitial);
    setList(currentInitial || []);
  }

  const [nowTimestamp] = useState(() => Date.now());

  // Modals & Active state
  const [activeModalSoftware, setActiveModalSoftware] = useState<SoftwareProduct | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SoftwareProduct | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<SoftwareProduct | null>(null);

  // Form tab selection
  const [modalTab, setModalTab] = useState<"details" | "checkpoints" | "verdict">("details");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Action status
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Form State
  const [formData, setFormData] = useState<SoftwareFormData>({
    name: "",
    slug: "",
    mono: "",
    categoryId: categories[0]?.id || 1,
    tagline: "",
    description: "",
    websiteUrl: "",
    trialUrl: "",
    logoUrl: "",
    status: "PUBLISHED",
    prosText: "",
    consText: "",
    startingPrice: "",
  });

  // Feature Checkpoints state
  const [checkpoints, setCheckpoints] = useState<FeatureCheckpointItem[]>([]);

  // New Checkpoint creator state
  const [isAddingNewCheckpoint, setIsAddingNewCheckpoint] = useState(false);
  const [newCpFeatureId, setNewCpFeatureId] = useState<string>("custom");
  const [newCpName, setNewCpName] = useState("");
  const [newCpCategory, setNewCpCategory] = useState("Tax & Compliance");
  const [newCpValueKind, setNewCpValueKind] = useState<
    "YES" | "NO" | "PARTIAL" | "PAID_ADDON" | "UNAVAILABLE" | "UNKNOWN"
  >("YES");
  const [newCpTextValue, setNewCpTextValue] = useState("");

  // Open Create Modal
  function handleOpenCreate() {
    setEditingProduct(null);
    setFormError(null);
    setModalTab("details");
    setIsAddingNewCheckpoint(false);

    setFormData({
      name: "",
      slug: "",
      mono: "",
      categoryId: categories[0]?.id || 1,
      tagline: "",
      description: "",
      websiteUrl: "",
      trialUrl: "",
      logoUrl: "",
      status: "PUBLISHED",
      prosText: "",
      consText: "",
      startingPrice: "",
    });

    // Provide default standard checkpoints from availableFeatures if present
    const defaultCps: FeatureCheckpointItem[] = availableFeatures.slice(0, 8).map((f) => ({
      featureId: f.id,
      featureName: f.name,
      categoryName: f.category?.name || "General Capabilities",
      valueKind: "YES",
      textValue: "",
      note: "",
    }));
    setCheckpoints(defaultCps);
    setIsFormModalOpen(true);
  }

  // Open Edit Modal
  function handleOpenEdit(product: SoftwareProduct) {
    setEditingProduct(product);
    setFormError(null);
    setModalTab("details");
    setIsAddingNewCheckpoint(false);

    const startingPlan =
      product.pricingPlans?.find((p) => p.isStartingPrice) || product.pricingPlans?.[0];
    const pros = Array.isArray(product.pros) ? product.pros.join("\n") : "";
    const cons = Array.isArray(product.cons) ? product.cons.join("\n") : "";

    setFormData({
      id: product.id,
      name: product.name,
      slug: product.slug,
      mono: product.mono || "",
      categoryId: product.categoryId || categories[0]?.id || 1,
      tagline: product.tagline || "",
      description: product.description || "",
      websiteUrl: product.websiteUrl || "",
      trialUrl: product.trialUrl || "",
      logoUrl: product.logoUrl || "",
      status: product.status || "PUBLISHED",
      prosText: pros,
      consText: cons,
      startingPrice: startingPlan?.displayPrice || "",
    });

    // Populate existing checkpoints
    const existingCps: FeatureCheckpointItem[] = (product.featureValues || []).map((fv: any) => ({
      id: fv.id,
      featureId: fv.featureId || fv.feature?.id,
      featureName: fv.feature?.name || "Feature",
      categoryName: fv.feature?.category?.name || "General Capabilities",
      valueKind: fv.valueKind || "YES",
      textValue: fv.textValue || "",
      note: fv.note || "",
    }));

    setCheckpoints(existingCps);
    setIsFormModalOpen(true);
  }

  // Auto-generate slug and mono from name
  function handleNameChange(name: string) {
    if (!editingProduct) {
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const generatedMono = name.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
      setFormData((prev) => ({
        ...prev,
        name,
        slug: generatedSlug,
        mono: prev.mono ? prev.mono : generatedMono,
      }));
    } else {
      setFormData((prev) => ({ ...prev, name }));
    }
  }

  // Checkpoint management helpers
  function handleUpdateCheckpoint(
    index: number,
    field: keyof FeatureCheckpointItem,
    value: any
  ) {
    setCheckpoints((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function handleDeleteCheckpoint(index: number) {
    setCheckpoints((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddNewCheckpoint() {
    let name = newCpName.trim();
    let cat = newCpCategory.trim();
    let featId: number | undefined = undefined;

    if (newCpFeatureId !== "custom") {
      const found = availableFeatures.find((f) => String(f.id) === newCpFeatureId);
      if (found) {
        name = found.name;
        cat = found.category?.name || cat;
        featId = found.id;
      }
    }

    if (!name) {
      alert("Please provide a feature name.");
      return;
    }

    // Check if duplicate
    const exists = checkpoints.some(
      (cp) =>
        (featId && cp.featureId === featId) ||
        cp.featureName.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      alert(`A checkpoint for "${name}" is already in the list.`);
      return;
    }

    const newCp: FeatureCheckpointItem = {
      featureId: featId,
      featureName: name,
      categoryName: cat || "General Capabilities",
      valueKind: newCpValueKind,
      textValue: newCpTextValue.trim(),
      note: "",
    };

    setCheckpoints((prev) => [newCp, ...prev]);
    setNewCpName("");
    setNewCpTextValue("");
    setNewCpFeatureId("custom");
    setIsAddingNewCheckpoint(false);
  }

  function handleLoadAllStandardCheckpoints() {
    const existingNames = new Set(checkpoints.map((c) => c.featureName.toLowerCase()));
    const unadded = availableFeatures.filter(
      (f) => !existingNames.has(f.name.toLowerCase())
    );

    if (unadded.length === 0) {
      alert("All standard features are already present in the checkpoints list.");
      return;
    }

    const additions: FeatureCheckpointItem[] = unadded.map((f) => ({
      featureId: f.id,
      featureName: f.name,
      categoryName: f.category?.name || "General Capabilities",
      valueKind: "YES",
      textValue: "",
      note: "",
    }));

    setCheckpoints((prev) => [...prev, ...additions]);
    showToast(`Added ${additions.length} standard feature checkpoints.`);
  }

  // Submit Create or Edit Form
  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmittingForm(true);
    setFormError(null);

    const pros = formData.prosText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const cons = formData.consText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingProduct) {
        // PATCH existing
        const payload: any = {
          name: formData.name,
          slug: formData.slug,
          mono: formData.mono || formData.name.slice(0, 2).toUpperCase(),
          categoryId: Number(formData.categoryId),
          tagline: formData.tagline || "",
          description: formData.description,
          websiteUrl: formData.websiteUrl || "",
          trialUrl: formData.trialUrl || "",
          logoUrl: formData.logoUrl || "",
          status: formData.status,
          pros,
          cons,
          startingPrice: formData.startingPrice || undefined,
          featureCheckpoints: checkpoints,
        };

        const res = await fetch(`/api/v1/admin/software/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to update software product.");
        }

        setList((prev) =>
          prev.map((item) => (item.id === editingProduct.id ? { ...item, ...json.data } : item))
        );
        showToast(`"${formData.name}" updated with ${checkpoints.length} capability checkpoints.`);
        setIsFormModalOpen(false);
      } else {
        // POST new
        const payload: any = {
          name: formData.name,
          slug: formData.slug,
          mono: formData.mono || formData.name.slice(0, 2).toUpperCase(),
          categoryId: Number(formData.categoryId),
          tagline: formData.tagline || undefined,
          description: formData.description,
          websiteUrl: formData.websiteUrl || undefined,
          trialUrl: formData.trialUrl || undefined,
          logoUrl: formData.logoUrl || undefined,
          status: formData.status,
          pros,
          cons,
          startingPrice: formData.startingPrice || undefined,
          featureCheckpoints: checkpoints,
        };

        const res = await fetch("/api/v1/admin/software", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to create software product.");
        }

        setList((prev) => [json.data, ...prev]);
        showToast(`"${formData.name}" created with ${checkpoints.length} capability checkpoints.`);
        setIsFormModalOpen(false);
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setIsSubmittingForm(false);
    }
  }

  // Quick Status Toggle (Publish / Save as Draft / Archive)
  async function handleToggleStatus(
    product: SoftwareProduct,
    targetStatus: "PUBLISHED" | "DRAFT" | "ARCHIVED"
  ) {
    setActionLoadingId(product.id);
    const action =
      targetStatus === "PUBLISHED" ? "publish" : targetStatus === "DRAFT" ? "draft" : "archive";

    try {
      const res = await fetch(`/api/v1/admin/software/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update status.");
      }

      setList((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, status: targetStatus } : item))
      );

      const statusLabel =
        targetStatus === "PUBLISHED"
          ? "published"
          : targetStatus === "DRAFT"
          ? "saved to draft"
          : "archived";
      showToast(`"${product.name}" was ${statusLabel}.`);
    } catch (err: any) {
      showToast(err.message || "Failed to update status.", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Delete Software
  async function handleDeleteConfirm() {
    if (!deleteConfirmProduct) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/v1/admin/software/${deleteConfirmProduct.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to delete software.");
      }

      setList((prev) => prev.filter((item) => item.id !== deleteConfirmProduct.id));
      showToast(`"${deleteConfirmProduct.name}" permanently deleted.`);
      setDeleteConfirmProduct(null);
    } catch (err: any) {
      showToast(err.message || "Failed to delete software.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  // Filtered List
  const filteredList = useMemo(() => {
    return list.filter((sw) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = sw.name.toLowerCase().includes(query);
        const matchesSlug = sw.slug.toLowerCase().includes(query);
        const matchesTagline = sw.tagline?.toLowerCase().includes(query);
        if (!matchesName && !matchesSlug && !matchesTagline) return false;
      }

      if (statusFilter !== "ALL" && sw.status !== statusFilter) {
        return false;
      }

      if (categoryFilter !== "ALL" && String(sw.categoryId) !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [list, searchQuery, statusFilter, categoryFilter]);

  // Metrics
  const stats = useMemo(() => {
    const total = list.length;
    const published = list.filter((sw) => sw.status === "PUBLISHED").length;
    const draft = list.filter((sw) => sw.status === "DRAFT").length;
    const stale = list.filter(
      (sw) =>
        !sw.verifiedAt ||
        new Date(sw.verifiedAt).getTime() < nowTimestamp - 90 * 24 * 60 * 60 * 1000
    ).length;
    return { total, published, draft, stale };
  }, [list]);

  // Checkpoint stats in modal
  const cpStats = useMemo(() => {
    const supported = checkpoints.filter((c) => c.valueKind === "YES").length;
    const partial = checkpoints.filter((c) => c.valueKind === "PARTIAL").length;
    const addon = checkpoints.filter((c) => c.valueKind === "PAID_ADDON").length;
    const notSupported = checkpoints.filter(
      (c) => c.valueKind === "NO" || c.valueKind === "UNAVAILABLE"
    ).length;
    return { supported, partial, addon, notSupported, total: checkpoints.length };
  }, [checkpoints]);

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "var(--r-md)",
            fontSize: "0.875rem",
            fontWeight: 600,
            background: toast.type === "success" ? "#065f46" : "#991b1b",
            color: "#ffffff",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar with Action & Summary */}
      <div
        className="row between"
        style={{
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div className="row gap-8" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <span
            className="badge"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              padding: "4px 10px",
            }}
          >
            Total: <b>{stats.total}</b>
          </span>
          <span
            className="badge"
            style={{
              background: "var(--primary-soft)",
              color: "var(--primary-text)",
              border: "1px solid var(--primary)",
              padding: "4px 10px",
            }}
          >
            Published: <b>{stats.published}</b>
          </span>
          {stats.draft > 0 && (
            <span
              className="badge"
              style={{
                background: "var(--amber-soft)",
                color: "var(--amber)",
                border: "1px solid var(--amber)",
                padding: "4px 10px",
              }}
            >
              Draft: <b>{stats.draft}</b>
            </span>
          )}
          {stats.stale > 0 && (
            <span
              className="badge"
              style={{
                background: "var(--danger-soft)",
                color: "var(--danger)",
                border: "1px solid var(--danger)",
                padding: "4px 10px",
              }}
            >
              Needs Audit (&gt;90d): <b>{stats.stale}</b>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn btn--primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 600,
            padding: "8px 18px",
          }}
        >
          <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span> Add New Software
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="panel"
        style={{
          padding: "16px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          marginBottom: "20px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: "1 1 280px" }}>
          <input
            type="search"
            placeholder="Search software by name, slug or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              borderRadius: "var(--r-sm)",
              fontSize: "0.875rem",
            }}
          />
        </div>

        <div className="row gap-8" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: "8px 12px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              borderRadius: "var(--r-sm)",
              fontSize: "0.875rem",
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="DRAFT">Draft Only</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                borderRadius: "var(--r-sm)",
                fontSize: "0.875rem",
              }}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {(searchQuery || statusFilter !== "ALL" || categoryFilter !== "ALL") && (
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setCategoryFilter("ALL");
              }}
              style={{ fontSize: "0.8rem", padding: "6px 10px" }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Software Table */}
      <div
        style={{
          overflowX: "auto",
          border: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr
              style={{
                background: "var(--surface-2)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <th style={{ padding: "12px 16px", textAlign: "left" }}>Software Product</th>
              <th style={{ padding: "12px 16px", textAlign: "left" }}>Category</th>
              <th style={{ padding: "12px 16px", textAlign: "left" }}>Starting Price</th>
              <th style={{ padding: "12px 16px", textAlign: "left" }}>Checkpoints</th>
              <th style={{ padding: "12px 16px", textAlign: "left" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "left" }}>Freshness</th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  minWidth: "320px",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "40px 16px",
                    textAlign: "center",
                    color: "var(--muted)",
                  }}
                >
                  <p style={{ margin: "0 0 8px", fontSize: "1rem" }}>
                    No software records found matching your filters.
                  </p>
                  <button
                    type="button"
                    className="btn btn--sm btn--secondary"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("ALL");
                      setCategoryFilter("ALL");
                    }}
                  >
                    Reset Filters
                  </button>
                </td>
              </tr>
            ) : (
              filteredList.map((sw) => {
                const startingPlan =
                  sw.pricingPlans?.find((p) => p.isStartingPrice) || sw.pricingPlans?.[0];
                const isStale =
                  !sw.verifiedAt ||
                  new Date(sw.verifiedAt).getTime() < nowTimestamp - 90 * 24 * 60 * 60 * 1000;
                const isLoading = actionLoadingId === sw.id;
                const cpCount = sw.featureValues?.length || 0;

                return (
                  <tr
                    key={sw.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      opacity: isLoading ? 0.6 : 1,
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    {/* Software info */}
                    <td style={{ padding: "12px 16px" }}>
                      <div className="row gap-8" style={{ alignItems: "center" }}>
                        {sw.logoUrl ? (
                          <img
                            src={sw.logoUrl}
                            alt={sw.name}
                            style={{
                              width: "36px",
                              height: "36px",
                              objectFit: "contain",
                              borderRadius: "var(--r-md)",
                              border: "1px solid var(--border)",
                              background: "var(--surface-2)",
                            }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "36px",
                              height: "36px",
                              borderRadius: "var(--r-md)",
                              background: "var(--surface-2)",
                              border: "1px solid var(--border)",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                              color: "var(--primary-text)",
                              textTransform: "uppercase",
                              flexShrink: 0,
                            }}
                          >
                            {sw.mono || sw.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <div className="row gap-4" style={{ alignItems: "center" }}>
                            <b>{sw.name}</b>
                            {sw.websiteUrl && (
                              <a
                                href={sw.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Visit official website"
                                style={{
                                  color: "var(--muted)",
                                  fontSize: "0.75rem",
                                  textDecoration: "none",
                                }}
                              >
                                ↗
                              </a>
                            )}
                          </div>
                          <span className="tiny muted block">/{sw.slug}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        className="badge"
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          fontSize: "0.78rem",
                        }}
                      >
                        {sw.category?.name || "Uncategorized"}
                      </span>
                    </td>

                    {/* Starting Price */}
                    <td style={{ padding: "12px 16px" }}>
                      <b style={{ color: "var(--text)" }}>{startingPlan?.displayPrice || "N/A"}</b>
                      {startingPlan?.planName && (
                        <span className="tiny muted block">{startingPlan.planName}</span>
                      )}
                    </td>

                    {/* Feature Checkpoints Count */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          borderRadius: "var(--r-sm)",
                          background: cpCount > 0 ? "rgba(16, 185, 129, 0.12)" : "var(--surface-2)",
                          color: cpCount > 0 ? "#10b981" : "var(--muted)",
                          border: `1px solid ${cpCount > 0 ? "#10b981" : "var(--border)"}`,
                        }}
                      >
                        {cpCount} checkpoints
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          borderRadius: "var(--r-sm)",
                          letterSpacing: "0.04em",
                          background:
                            sw.status === "PUBLISHED"
                              ? "var(--primary-soft)"
                              : sw.status === "DRAFT"
                              ? "var(--amber-soft)"
                              : "var(--surface-2)",
                          color:
                            sw.status === "PUBLISHED"
                              ? "var(--primary-text)"
                              : sw.status === "DRAFT"
                              ? "var(--amber)"
                              : "var(--muted)",
                          border: `1px solid ${
                            sw.status === "PUBLISHED"
                              ? "var(--primary)"
                              : sw.status === "DRAFT"
                              ? "var(--amber)"
                              : "var(--border)"
                          }`,
                        }}
                      >
                        {sw.status}
                      </span>
                    </td>

                    {/* Verification Status */}
                    <td style={{ padding: "12px 16px" }}>
                      {sw.verifiedAt ? (
                        <div>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              background: isStale ? "var(--amber-soft)" : "var(--primary-soft)",
                              color: isStale ? "var(--amber)" : "var(--primary-text)",
                              border: `1px solid ${isStale ? "var(--amber)" : "var(--primary)"}`,
                              borderRadius: "var(--r-sm)",
                            }}
                          >
                            {isStale ? "STALE (>90d)" : "VERIFIED"}
                          </span>
                          <span className="tiny muted block" style={{ marginTop: "2px" }}>
                            {new Date(sw.verifiedAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      ) : (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            background: "var(--danger-soft)",
                            color: "var(--danger)",
                            border: "1px solid var(--danger)",
                            borderRadius: "var(--r-sm)",
                          }}
                        >
                          UNVERIFIED
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div
                        className="row gap-4"
                        style={{
                          justifyContent: "flex-end",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        {/* Publish / Draft toggle */}
                        {sw.status === "PUBLISHED" ? (
                          <button
                            type="button"
                            className="btn btn--sm btn--ghost"
                            disabled={isLoading}
                            onClick={() => handleToggleStatus(sw, "DRAFT")}
                            title="Unpublish and move to Draft"
                            style={{
                              fontSize: "0.75rem",
                              padding: "4px 8px",
                              color: "var(--amber)",
                              borderColor: "var(--amber)",
                            }}
                          >
                            Save as Draft
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--sm btn--primary"
                            disabled={isLoading}
                            onClick={() => handleToggleStatus(sw, "PUBLISHED")}
                            title="Publish to public directory"
                            style={{
                              fontSize: "0.75rem",
                              padding: "4px 8px",
                            }}
                          >
                            Publish
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          className="btn btn--sm btn--secondary"
                          onClick={() => handleOpenEdit(sw)}
                          title="Edit details, features checklist, pricing, and pros/cons"
                          style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                        >
                          Edit
                        </button>

                        {/* Audit / Verify Pricing */}
                        <button
                          type="button"
                          className="btn btn--sm btn--ghost"
                          onClick={() => setActiveModalSoftware(sw)}
                          title="Verify or update plan pricing with audit proof"
                          style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                        >
                          Audit Pricing
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          className="btn btn--sm btn--danger"
                          onClick={() => setDeleteConfirmProduct(sw)}
                          title="Permanently delete software product"
                          style={{
                            fontSize: "0.75rem",
                            padding: "4px 8px",
                            background: "transparent",
                            color: "var(--danger)",
                            border: "1px solid var(--danger)",
                          }}
                        >
                          Delete
                        </button>

                        {/* Public Link */}
                        <Link
                          href={`/software/${sw.slug}`}
                          target="_blank"
                          className="btn btn--sm btn--ghost"
                          title="View live public product page"
                          style={{
                            fontSize: "0.75rem",
                            padding: "4px 8px",
                            color: "var(--muted)",
                          }}
                        >
                          View ↗
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: Add / Edit Software ────────────────────────── */}
      {isFormModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            className="panel card--pad"
            style={{
              width: "100%",
              maxWidth: "840px",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "24px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              className="row between"
              style={{ marginBottom: "16px", alignItems: "flex-start" }}
            >
              <div>
                <span className="eyebrow" style={{ color: "var(--primary)" }}>
                  {editingProduct ? "Catalogue Management" : "New Software Record"}
                </span>
                <h3 style={{ fontSize: "1.35rem", margin: "4px 0 0" }}>
                  {editingProduct
                    ? `Edit "${editingProduct.name}"`
                    : "Add New Software to Catalogue"}
                </h3>
              </div>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => setIsFormModalOpen(false)}
                style={{ fontSize: "1.1rem", lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                borderBottom: "1px solid var(--border)",
                marginBottom: "20px",
                paddingBottom: "4px",
              }}
            >
              <button
                type="button"
                onClick={() => setModalTab("details")}
                style={{
                  padding: "8px 16px",
                  fontSize: "0.875rem",
                  fontWeight: modalTab === "details" ? 700 : 500,
                  color: modalTab === "details" ? "var(--primary-text)" : "var(--muted)",
                  background: modalTab === "details" ? "var(--primary-soft)" : "transparent",
                  border: "none",
                  borderRadius: "var(--r-sm)",
                  cursor: "pointer",
                }}
              >
                📋 Product Details
              </button>
              <button
                type="button"
                onClick={() => setModalTab("checkpoints")}
                style={{
                  padding: "8px 16px",
                  fontSize: "0.875rem",
                  fontWeight: modalTab === "checkpoints" ? 700 : 500,
                  color: modalTab === "checkpoints" ? "var(--primary-text)" : "var(--muted)",
                  background: modalTab === "checkpoints" ? "var(--primary-soft)" : "transparent",
                  border: "none",
                  borderRadius: "var(--r-sm)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                ✓ Feature Checkpoints
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "2px 6px",
                    borderRadius: "var(--r-md)",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {checkpoints.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab("verdict")}
                style={{
                  padding: "8px 16px",
                  fontSize: "0.875rem",
                  fontWeight: modalTab === "verdict" ? 700 : 500,
                  color: modalTab === "verdict" ? "var(--primary-text)" : "var(--muted)",
                  background: modalTab === "verdict" ? "var(--primary-soft)" : "transparent",
                  border: "none",
                  borderRadius: "var(--r-sm)",
                  cursor: "pointer",
                }}
              >
                ⚖️ Pros &amp; Cons
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--danger-soft)",
                  color: "var(--danger)",
                  border: "1px solid var(--danger)",
                  borderRadius: "var(--r-sm)",
                  fontSize: "0.85rem",
                  marginBottom: "16px",
                }}
              >
                {formError}
              </div>
            )}

            <form
              onSubmit={handleFormSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* TAB 1: PRODUCT DETAILS */}
              {modalTab === "details" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* Name & Slug */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        Software Name <span style={{ color: "var(--danger)" }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Zoho Books"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "var(--r-sm)",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        URL Slug <span style={{ color: "var(--danger)" }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. zoho-books"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            slug: e.target.value.toLowerCase(),
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "var(--r-sm)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Category, Monogram & Status */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        Category <span style={{ color: "var(--danger)" }}>*</span>
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            categoryId: Number(e.target.value),
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "var(--r-sm)",
                        }}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        Monogram
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="e.g. ZB"
                        value={formData.mono}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            mono: e.target.value.toUpperCase(),
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "var(--r-sm)",
                          textAlign: "center",
                          fontWeight: 700,
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        Publish Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            status: e.target.value as any,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "var(--r-sm)",
                        }}
                      >
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </div>
                  </div>

                  {/* Tagline & Starting Price */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        Tagline
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. GST-compliant cloud accounting for Indian SMBs"
                        value={formData.tagline}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, tagline: e.target.value }))
                        }
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "var(--r-sm)",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        Starting Price
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ₹749/mo"
                        value={formData.startingPrice}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            startingPrice: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "var(--r-sm)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      Product Description <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Comprehensive overview of capabilities, target audience, and market position..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        borderRadius: "var(--r-sm)",
                        fontFamily: "inherit",
                        fontSize: "0.875rem",
                      }}
                    />
                  </div>

                  {/* URLs: Logo, Website, Trial */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        Logo Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://.../logo.png"
                        value={formData.logoUrl}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))
                        }
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "var(--r-sm)",
                          fontSize: "0.8rem",
                        }}
                      />
                      {formData.logoUrl && (
                        <div style={{ marginTop: "4px" }}>
                          <img
                            src={formData.logoUrl}
                            alt="Preview"
                            style={{
                              height: "24px",
                              maxWidth: "80px",
                              objectFit: "contain",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        Website URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={formData.websiteUrl}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            websiteUrl: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "var(--r-sm)",
                          fontSize: "0.8rem",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        Trial / Demo URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/trial"
                        value={formData.trialUrl}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            trialUrl: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "var(--r-sm)",
                          fontSize: "0.8rem",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FEATURE CHECKPOINTS & CAPABILITIES */}
              {modalTab === "checkpoints" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Top Checkpoint Controls */}
                  <div
                    className="row between"
                    style={{
                      alignItems: "center",
                      background: "var(--surface-2)",
                      padding: "10px 14px",
                      borderRadius: "var(--r-md)",
                      border: "1px solid var(--border)",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div className="row gap-8" style={{ alignItems: "center", flexWrap: "wrap" }}>
                      <span className="tiny muted">Summary:</span>
                      <span
                        className="badge"
                        style={{
                          background: "rgba(16, 185, 129, 0.15)",
                          color: "#10b981",
                          fontSize: "0.75rem",
                        }}
                      >
                        ✓ {cpStats.supported} Supported
                      </span>
                      {cpStats.partial > 0 && (
                        <span
                          className="badge"
                          style={{
                            background: "rgba(245, 158, 11, 0.15)",
                            color: "#f59e0b",
                            fontSize: "0.75rem",
                          }}
                        >
                          ◐ {cpStats.partial} Partial
                        </span>
                      )}
                      {cpStats.addon > 0 && (
                        <span
                          className="badge"
                          style={{
                            background: "var(--primary-soft)",
                            color: "var(--primary-text)",
                            fontSize: "0.75rem",
                          }}
                        >
                          + {cpStats.addon} Add-on
                        </span>
                      )}
                      {cpStats.notSupported > 0 && (
                        <span
                          className="badge"
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#ef4444",
                            fontSize: "0.75rem",
                          }}
                        >
                          ✕ {cpStats.notSupported} Not Supported
                        </span>
                      )}
                    </div>

                    <div className="row gap-8">
                      {availableFeatures.length > 0 && (
                        <button
                          type="button"
                          className="btn btn--sm btn--ghost"
                          onClick={handleLoadAllStandardCheckpoints}
                          style={{ fontSize: "0.78rem" }}
                        >
                          + Load All Standard Checkpoints
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn--sm btn--primary"
                        onClick={() => setIsAddingNewCheckpoint((prev) => !prev)}
                        style={{ fontSize: "0.78rem" }}
                      >
                        {isAddingNewCheckpoint ? "✕ Close Add Box" : "+ Add New Checkpoint"}
                      </button>
                    </div>
                  </div>

                  {/* Inline Add New Checkpoint Box */}
                  {isAddingNewCheckpoint && (
                    <div
                      style={{
                        padding: "14px",
                        background: "var(--surface-2)",
                        border: "1px solid var(--primary)",
                        borderRadius: "var(--r-md)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <span className="eyebrow" style={{ color: "var(--primary)" }}>
                        Add New Feature Checkpoint
                      </span>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.5fr 1fr 1fr 1.5fr auto",
                          gap: "8px",
                          alignItems: "flex-end",
                        }}
                      >
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              marginBottom: "2px",
                            }}
                          >
                            Feature Name / Source
                          </label>
                          {availableFeatures.length > 0 ? (
                            <select
                              value={newCpFeatureId}
                              onChange={(e) => {
                                setNewCpFeatureId(e.target.value);
                                if (e.target.value !== "custom") {
                                  const sel = availableFeatures.find(
                                    (f) => String(f.id) === e.target.value
                                  );
                                  if (sel) {
                                    setNewCpName(sel.name);
                                    if (sel.category?.name) setNewCpCategory(sel.category.name);
                                  }
                                }
                              }}
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                                borderRadius: "var(--r-sm)",
                                fontSize: "0.8rem",
                              }}
                            >
                              <option value="custom">✏️ Custom Feature Name...</option>
                              {availableFeatures.map((f) => (
                                <option key={f.id} value={String(f.id)}>
                                  {f.name} ({f.category?.name || "General"})
                                </option>
                              ))}
                            </select>
                          ) : null}

                          {(newCpFeatureId === "custom" || availableFeatures.length === 0) && (
                            <input
                              type="text"
                              placeholder="e.g. E-way Bill Direct Generation"
                              value={newCpName}
                              onChange={(e) => setNewCpName(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                marginTop: "4px",
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                                borderRadius: "var(--r-sm)",
                                fontSize: "0.8rem",
                              }}
                            />
                          )}
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              marginBottom: "2px",
                            }}
                          >
                            Category
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Tax & Compliance"
                            value={newCpCategory}
                            onChange={(e) => setNewCpCategory(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                              color: "var(--text)",
                              borderRadius: "var(--r-sm)",
                              fontSize: "0.8rem",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              marginBottom: "2px",
                            }}
                          >
                            Support Status
                          </label>
                          <select
                            value={newCpValueKind}
                            onChange={(e) => setNewCpValueKind(e.target.value as any)}
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                              color: "var(--text)",
                              borderRadius: "var(--r-sm)",
                              fontSize: "0.8rem",
                            }}
                          >
                            <option value="YES">✓ Supported (YES)</option>
                            <option value="NO">✕ Not Supported (NO)</option>
                            <option value="PARTIAL">◐ Partial Support</option>
                            <option value="PAID_ADDON">+ Paid Add-on</option>
                            <option value="UNAVAILABLE">— Unavailable</option>
                            <option value="UNKNOWN">? Unknown</option>
                          </select>
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              marginBottom: "2px",
                            }}
                          >
                            Details / Plan Note
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Pro tier only · GSTN API"
                            value={newCpTextValue}
                            onChange={(e) => setNewCpTextValue(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                              color: "var(--text)",
                              borderRadius: "var(--r-sm)",
                              fontSize: "0.8rem",
                            }}
                          />
                        </div>

                        <button
                          type="button"
                          className="btn btn--sm btn--primary"
                          onClick={handleAddNewCheckpoint}
                          style={{ padding: "6px 14px", height: "32px", fontSize: "0.8rem" }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Checkpoints Interactive Table */}
                  <div
                    style={{
                      maxHeight: "380px",
                      overflowY: "auto",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      borderRadius: "var(--r-md)",
                    }}
                  >
                    {checkpoints.length === 0 ? (
                      <div
                        style={{
                          padding: "36px 16px",
                          textAlign: "center",
                          color: "var(--muted)",
                        }}
                      >
                        <p style={{ margin: "0 0 10px" }}>
                          No feature checkpoints configured for this software product yet.
                        </p>
                        <button
                          type="button"
                          className="btn btn--sm btn--secondary"
                          onClick={handleLoadAllStandardCheckpoints}
                        >
                          + Load Standard Checkpoints
                        </button>
                      </div>
                    ) : (
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "0.84rem",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              background: "var(--surface-2)",
                              borderBottom: "1px solid var(--border)",
                              position: "sticky",
                              top: 0,
                              zIndex: 2,
                            }}
                          >
                            <th style={{ padding: "8px 12px", textAlign: "left" }}>
                              Feature Checkpoint
                            </th>
                            <th style={{ padding: "8px 12px", textAlign: "left" }}>Category</th>
                            <th
                              style={{
                                padding: "8px 12px",
                                textAlign: "left",
                                width: "160px",
                              }}
                            >
                              Status
                            </th>
                            <th style={{ padding: "8px 12px", textAlign: "left" }}>
                              Detail / Tier Note
                            </th>
                            <th
                              style={{
                                padding: "8px 12px",
                                textAlign: "center",
                                width: "40px",
                              }}
                            ></th>
                          </tr>
                        </thead>
                        <tbody>
                          {checkpoints.map((cp, idx) => {
                            let statusColor = "var(--text)";
                            let statusBg = "var(--surface-2)";

                            if (cp.valueKind === "YES") {
                              statusColor = "#10b981";
                              statusBg = "rgba(16, 185, 129, 0.12)";
                            } else if (
                              cp.valueKind === "NO" ||
                              cp.valueKind === "UNAVAILABLE"
                            ) {
                              statusColor = "#ef4444";
                              statusBg = "rgba(239, 68, 68, 0.12)";
                            } else if (cp.valueKind === "PARTIAL") {
                              statusColor = "#f59e0b";
                              statusBg = "rgba(245, 158, 11, 0.12)";
                            } else if (cp.valueKind === "PAID_ADDON") {
                              statusColor = "var(--primary-text)";
                              statusBg = "var(--primary-soft)";
                            }

                            return (
                              <tr
                                key={idx}
                                style={{
                                  borderBottom: "1px solid var(--border)",
                                }}
                              >
                                {/* Name */}
                                <td style={{ padding: "8px 12px" }}>
                                  <input
                                    type="text"
                                    value={cp.featureName}
                                    onChange={(e) =>
                                      handleUpdateCheckpoint(idx, "featureName", e.target.value)
                                    }
                                    style={{
                                      width: "100%",
                                      padding: "4px 6px",
                                      background: "transparent",
                                      border: "1px solid transparent",
                                      color: "var(--text)",
                                      fontWeight: 600,
                                      borderRadius: "var(--r-sm)",
                                    }}
                                    onFocus={(e) => {
                                      e.target.style.background = "var(--surface-2)";
                                      e.target.style.borderColor = "var(--border)";
                                    }}
                                    onBlur={(e) => {
                                      e.target.style.background = "transparent";
                                      e.target.style.borderColor = "transparent";
                                    }}
                                  />
                                </td>

                                {/* Category */}
                                <td style={{ padding: "8px 12px" }}>
                                  <span
                                    className="badge"
                                    style={{
                                      fontSize: "0.75rem",
                                      background: "var(--surface-2)",
                                      border: "1px solid var(--border)",
                                      color: "var(--muted)",
                                    }}
                                  >
                                    {cp.categoryName || "General"}
                                  </span>
                                </td>

                                {/* Status Picker */}
                                <td style={{ padding: "8px 12px" }}>
                                  <select
                                    value={cp.valueKind}
                                    onChange={(e) =>
                                      handleUpdateCheckpoint(idx, "valueKind", e.target.value)
                                    }
                                    style={{
                                      width: "100%",
                                      padding: "4px 8px",
                                      fontSize: "0.8rem",
                                      fontWeight: 600,
                                      background: statusBg,
                                      color: statusColor,
                                      border: `1px solid ${statusColor}`,
                                      borderRadius: "var(--r-sm)",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <option value="YES">✓ Supported</option>
                                    <option value="NO">✕ Not Supported</option>
                                    <option value="PARTIAL">◐ Partial</option>
                                    <option value="PAID_ADDON">+ Paid Add-on</option>
                                    <option value="UNAVAILABLE">— Unavailable</option>
                                    <option value="UNKNOWN">? Unknown</option>
                                  </select>
                                </td>

                                {/* Details / Note */}
                                <td style={{ padding: "8px 12px" }}>
                                  <input
                                    type="text"
                                    placeholder="Add details, plan limits..."
                                    value={cp.textValue || ""}
                                    onChange={(e) =>
                                      handleUpdateCheckpoint(idx, "textValue", e.target.value)
                                    }
                                    style={{
                                      width: "100%",
                                      padding: "4px 8px",
                                      fontSize: "0.8rem",
                                      background: "var(--surface-2)",
                                      border: "1px solid var(--border)",
                                      color: "var(--text)",
                                      borderRadius: "var(--r-sm)",
                                    }}
                                  />
                                </td>

                                {/* Delete Checkpoint */}
                                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCheckpoint(idx)}
                                    title="Delete this checkpoint from product"
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "var(--danger)",
                                      cursor: "pointer",
                                      fontSize: "1rem",
                                      lineHeight: 1,
                                      padding: "4px 6px",
                                      borderRadius: "var(--r-sm)",
                                    }}
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PROS & CONS */}
              {modalTab === "verdict" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        marginBottom: "4px",
                        color: "#16a34a",
                      }}
                    >
                      ✓ Advantages / Pros (1 per line)
                    </label>
                    <textarea
                      rows={6}
                      placeholder={
                        "Complete GST e-invoicing & e-way bill\nRobust mobile app with offline view\nAutomated bank feeds"
                      }
                      value={formData.prosText}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, prosText: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        borderRadius: "var(--r-sm)",
                        fontFamily: "inherit",
                        fontSize: "0.82rem",
                        lineHeight: 1.5,
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        marginBottom: "4px",
                        color: "#dc2626",
                      }}
                    >
                      ⚠ Limitations / Cons (1 per line)
                    </label>
                    <textarea
                      rows={6}
                      placeholder={
                        "Advanced multi-currency requires Pro plan\nStrict concurrent user limits\nOccasional sync lag on desktop client"
                      }
                      value={formData.consText}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, consText: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        borderRadius: "var(--r-sm)",
                        fontFamily: "inherit",
                        fontSize: "0.82rem",
                        lineHeight: 1.5,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div
                className="row between"
                style={{
                  marginTop: "12px",
                  borderTop: "1px solid var(--border)",
                  paddingTop: "16px",
                  alignItems: "center",
                }}
              >
                <div className="tiny muted">
                  {checkpoints.length} feature checkpoints configured
                </div>

                <div className="row gap-8">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setIsFormModalOpen(false)}
                    disabled={isSubmittingForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={isSubmittingForm}
                  >
                    {isSubmittingForm
                      ? "Saving..."
                      : editingProduct
                      ? "Save Changes"
                      : "Create Software Product"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Confirmation ────────────────────────── */}
      {deleteConfirmProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            className="panel card--pad"
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "24px",
              background: "var(--surface)",
              border: "1px solid var(--danger)",
              borderRadius: "var(--r-md)",
            }}
          >
            <span className="eyebrow" style={{ color: "var(--danger)" }}>
              Danger Zone
            </span>
            <h3 style={{ fontSize: "1.25rem", margin: "6px 0 12px" }}>
              Delete &quot;{deleteConfirmProduct.name}&quot;?
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--muted)",
                lineHeight: 1.5,
                margin: "0 0 20px",
              }}
            >
              This will permanently delete the software record, including its capability
              checkpoints, pricing plans, verification ledger, and comparative data. This action
              cannot be undone.
            </p>

            <div className="row end gap-8">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setDeleteConfirmProduct(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                style={{
                  background: "var(--danger)",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 600,
                }}
              >
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Audit / Verify Pricing ─────────────────────── */}
      <PricingVerificationModal
        software={activeModalSoftware}
        onClose={() => {
          setActiveModalSoftware(null);
          router.refresh();
        }}
      />
    </>
  );
}

"use client";

import { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AuditIcon,
  DraftIcon,
  ExternalIcon,
  MoreIcon,
  PencilIcon,
  PublishIcon,
  TrashIcon,
} from "@/components/icons";
import { PricingVerificationModal } from "./pricing-modal";
import { FieldError } from "@/components/field-error";
import { adminSoftwareWriteSchema } from "@/lib/validations/software";
import { readApiError, validationErrorPayload, dropField, type FieldErrors } from "@/lib/validations/feedback";

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

function isUsableImageSrc(src: string) {
  const value = src.trim();
  if (!value) return false;
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function ProductMark({ software }: { software: SoftwareProduct }) {
  const [broken, setBroken] = useState(false);
  const src = software.logoUrl?.trim() || "";
  const usable = isUsableImageSrc(src) && !broken;

  if (!usable) {
    return (
      <span className="admin-ledger__mark" aria-hidden="true">
        {software.mono || software.name.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      className="admin-ledger__mark"
      src={src}
      alt=""
      width={32}
      height={32}
      unoptimized
      onError={() => setBroken(true)}
    />
  );
}

function SoftwareRowActions({
  software,
  isLoading,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onToggleStatus,
  onEdit,
  onAudit,
  onDelete,
}: {
  software: SoftwareProduct;
  isLoading: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onToggleStatus: (status: "PUBLISHED" | "DRAFT") => void;
  onEdit: () => void;
  onAudit: () => void;
  onDelete: () => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const menuId = `admin-ledger-menu-${software.id}`;

  useLayoutEffect(() => {
    if (!menuOpen) {
      setCoords(null);
      return;
    }

    function place() {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      const r = trigger.getBoundingClientRect();
      const menuW = menu.offsetWidth;
      const menuH = menu.offsetHeight;
      const gap = 6;
      const pad = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const below = r.bottom + gap;
      const above = r.top - gap - menuH;
      const top =
        below + menuH <= vh - pad || above < pad
          ? Math.min(below, Math.max(pad, vh - menuH - pad))
          : above;
      const left = Math.min(Math.max(pad, r.right - menuW), Math.max(pad, vw - menuW - pad));
      setCoords({ top, left });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [menuOpen]);

  useLayoutEffect(() => {
    if (!menuOpen || !coords) return;
    menuRef.current?.querySelector<HTMLElement>("[role='menuitem']")?.focus({ preventScroll: true });
  }, [menuOpen, coords]);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: PointerEvent) {
      const node = event.target as Node;
      if (triggerRef.current?.contains(node) || menuRef.current?.contains(node)) return;
      onCloseMenu();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseMenu();
        triggerRef.current?.focus();
        return;
      }

      if (!menuRef.current) return;
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") {
        return;
      }

      const items = Array.from(menuRef.current.querySelectorAll<HTMLElement>("[role='menuitem']"));
      if (items.length === 0) return;
      event.preventDefault();
      const current = items.indexOf(document.activeElement as HTMLElement);
      let next = 0;
      if (event.key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % items.length;
      if (event.key === "ArrowUp") next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = items.length - 1;
      items[next]?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, onCloseMenu]);

  const menu = menuOpen
    ? createPortal(
        <div
          ref={menuRef}
          id={menuId}
          className="admin-ledger__menu"
          role="menu"
          aria-label="More actions"
          style={{
            top: coords?.top ?? 0,
            left: coords?.left ?? -9999,
            visibility: coords ? "visible" : "hidden",
          }}
        >
          {software.status === "PUBLISHED" ? (
            <button
              type="button"
              className="admin-ledger__menu-item"
              role="menuitem"
              disabled={isLoading}
              onClick={() => {
                onCloseMenu();
                onToggleStatus("DRAFT");
              }}
            >
              <DraftIcon />
              Save as draft
            </button>
          ) : (
            <button
              type="button"
              className="admin-ledger__menu-item"
              role="menuitem"
              disabled={isLoading}
              onClick={() => {
                onCloseMenu();
                onToggleStatus("PUBLISHED");
              }}
            >
              <PublishIcon />
              Publish
            </button>
          )}
          <Link
            href={`/software/${software.slug}`}
            target="_blank"
            rel="noreferrer"
            className="admin-ledger__menu-item"
            role="menuitem"
            onClick={onCloseMenu}
          >
            <ExternalIcon />
            View live
          </Link>
          <div className="admin-ledger__menu-sep" role="separator" />
          <button
            type="button"
            className="admin-ledger__menu-item is-danger"
            role="menuitem"
            onClick={() => {
              onCloseMenu();
              onDelete();
            }}
          >
            <TrashIcon />
            Delete
          </button>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="admin-ledger__acts">
      <button
        type="button"
        className="admin-ledger__tool"
        onClick={onEdit}
        title="Edit"
        aria-label="Edit details and checkpoints"
      >
        <PencilIcon />
      </button>
      <button
        type="button"
        className="admin-ledger__tool"
        onClick={onAudit}
        title="Audit pricing"
        aria-label="Verify or update pricing"
      >
        <AuditIcon />
      </button>
      <button
        ref={triggerRef}
        type="button"
        className={`admin-ledger__tool${menuOpen ? " is-open" : ""}`}
        title="More"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        onClick={onToggleMenu}
      >
        <MoreIcon />
      </button>
      {menu}
    </div>
  );
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
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [checkpointNotice, setCheckpointNotice] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const clearField = (key: string) => setFieldErrors((prev) => dropField(prev, key));

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
    setFieldErrors({});
    setCheckpointNotice(null);
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
    setFieldErrors({});
    setCheckpointNotice(null);
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
      clearField("slug");
    } else {
      setFormData((prev) => ({ ...prev, name }));
    }
    clearField("name");
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

    if (!name || name.length < 2) {
      setCheckpointNotice("Enter a feature name of at least 2 characters.");
      return;
    }

    const exists = checkpoints.some(
      (cp) =>
        (featId && cp.featureId === featId) ||
        cp.featureName.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      setCheckpointNotice(`“${name}” is already in the checkpoint list.`);
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
    setCheckpointNotice(null);
    setIsAddingNewCheckpoint(false);
  }

  function handleLoadAllStandardCheckpoints() {
    const existingNames = new Set(checkpoints.map((c) => c.featureName.toLowerCase()));
    const unadded = availableFeatures.filter(
      (f) => !existingNames.has(f.name.toLowerCase())
    );

    if (unadded.length === 0) {
      showToast("Every standard feature is already in this list.", "error");
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
    setFormError(null);

    const pros = formData.prosText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const cons = formData.consText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name,
      slug: formData.slug,
      mono: formData.mono || undefined,
      categoryId: Number(formData.categoryId),
      tagline: formData.tagline || undefined,
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

    const parsed = adminSoftwareWriteSchema.safeParse(payload);
    if (!parsed.success) {
      const failure = validationErrorPayload(parsed.error);
      setFieldErrors(failure.fields);
      setFormError(failure.message);
      const detailKeys = ["name", "slug", "categoryId", "mono", "tagline", "description", "websiteUrl", "trialUrl", "logoUrl", "startingPrice"];
      if (detailKeys.some((key) => failure.fields[key])) setModalTab("details");
      else if (failure.fields.pros || failure.fields.cons) setModalTab("verdict");
      else if (failure.fields.featureCheckpoints) setModalTab("checkpoints");
      return;
    }

    setIsSubmittingForm(true);
    setFieldErrors({});

    const body = {
      ...parsed.data,
      mono: parsed.data.mono || formData.name.slice(0, 2).toUpperCase(),
      tagline: formData.tagline,
    };

    try {
      const res = await fetch(
        editingProduct ? `/api/v1/admin/software/${editingProduct.id}` : "/api/v1/admin/software",
        {
          method: editingProduct ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        const failure = readApiError(
          json,
          editingProduct
            ? "Could not update this product. Please try again."
            : "Could not create this product. Please try again."
        );
        setFieldErrors(failure.fields);
        if (failure.fields.slug || failure.fields.name || failure.fields.description) setModalTab("details");
        throw new Error(failure.message);
      }

      setList((prev) =>
        editingProduct
          ? prev.map((item) => (item.id === editingProduct.id ? { ...item, ...json.data } : item))
          : [json.data, ...prev]
      );
      showToast(
        `"${formData.name}" ${editingProduct ? "updated" : "created"} with ${checkpoints.length} capability checkpoints.`
      );
      setIsFormModalOpen(false);
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
        throw new Error(readApiError(json, "Could not update the status. Please try again.").message);
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
        throw new Error(readApiError(json, "Could not delete this product. Please try again.").message);
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

      <div className="admin-ledger__head">
        <div className="admin-ledger__meta">
          <span>
            Total <b>{stats.total}</b>
          </span>
          <span>
            Published <b>{stats.published}</b>
          </span>
          {stats.draft > 0 ? (
            <span>
              Draft <b>{stats.draft}</b>
            </span>
          ) : null}
          {stats.stale > 0 ? (
            <span className="is-alert">
              Stale <b>{stats.stale}</b>
            </span>
          ) : null}
        </div>
        <button type="button" onClick={handleOpenCreate} className="btn btn--primary btn--sm">
          Add software
        </button>
      </div>

      <div className="admin-ledger__toolbar">
        <input
          className="admin-ledger__search"
          type="search"
          placeholder="Search name, slug or keyword"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search software"
        />
        <div className="row gap-8" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="admin-ledger__select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED")}
            aria-label="Filter by status"
          >
            <option value="ALL">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          {categories.length > 0 ? (
            <select
              className="admin-ledger__select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="ALL">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : null}
          {searchQuery || statusFilter !== "ALL" || categoryFilter !== "ALL" ? (
            <button
              type="button"
              className="admin-ledger__act"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setCategoryFilter("ALL");
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="admin-ledger__scroller">
        <table className="admin-ledger">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Starting price</th>
              <th>Checks</th>
              <th>Status</th>
              <th>Freshness</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "36px 0", textAlign: "center", color: "var(--muted)" }}>
                  <p style={{ margin: "0 0 12px" }}>No software records match these filters.</p>
                  <button
                    type="button"
                    className="admin-ledger__act"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("ALL");
                      setCategoryFilter("ALL");
                    }}
                  >
                    Reset filters
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
                  <tr key={sw.id} style={{ opacity: isLoading ? 0.55 : 1 }}>
                    <td>
                      <div className="admin-ledger__product">
                        <ProductMark software={sw} />
                        <div>
                          <b>{sw.name}</b>
                          <span className="tiny muted block">/{sw.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="tiny muted">{sw.category?.name || "Uncategorized"}</span>
                    </td>
                    <td>
                      <span>{startingPlan?.displayPrice || "Not listed"}</span>
                      {startingPlan?.planName ? (
                        <span className="tiny muted block">{startingPlan.planName}</span>
                      ) : null}
                    </td>
                    <td>
                      <span className="admin-ledger__count num">{cpCount}</span>
                      <span className="tiny muted block">features</span>
                    </td>
                    <td>
                      <span
                        className={`admin-ledger__status${
                          sw.status === "PUBLISHED" ? " is-live" : sw.status === "DRAFT" ? " is-draft" : ""
                        }`}
                      >
                        {sw.status === "PUBLISHED" ? "Live" : sw.status.toLowerCase()}
                      </span>
                    </td>
                    <td>
                      {sw.verifiedAt ? (
                        <>
                          <span className={`admin-ledger__status${isStale ? " is-stale" : " is-live"}`}>
                            {isStale ? "Stale" : "Verified"}
                          </span>
                          <span className="tiny muted block">
                            {new Date(sw.verifiedAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </>
                      ) : (
                        <span className="admin-ledger__status is-danger" style={{ color: "var(--danger)" }}>
                          Unverified
                        </span>
                      )}
                    </td>
                    <td>
                      <SoftwareRowActions
                        software={sw}
                        isLoading={isLoading}
                        menuOpen={openMenuId === sw.id}
                        onToggleMenu={() => setOpenMenuId(openMenuId === sw.id ? null : sw.id)}
                        onCloseMenu={() => setOpenMenuId(null)}
                        onToggleStatus={(status) => handleToggleStatus(sw, status)}
                        onEdit={() => handleOpenEdit(sw)}
                        onAudit={() => setActiveModalSoftware(sw)}
                        onDelete={() => setDeleteConfirmProduct(sw)}
                      />
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
              noValidate
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
                    <div className={fieldErrors.name ? "field-invalid" : undefined}>
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
                        placeholder="e.g. Zoho Books"
                        value={formData.name}
                        aria-invalid={fieldErrors.name ? true : undefined}
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
                      <FieldError message={fieldErrors.name} />
                    </div>

                    <div className={fieldErrors.slug ? "field-invalid" : undefined}>
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
                        placeholder="e.g. zoho-books"
                        value={formData.slug}
                        aria-invalid={fieldErrors.slug ? true : undefined}
                        onChange={(e) => {
                          clearField("slug");
                          setFormData((prev) => ({
                            ...prev,
                            slug: e.target.value.toLowerCase(),
                          }));
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "var(--r-sm)",
                        }}
                      />
                      <FieldError message={fieldErrors.slug} />
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
                    <div className={fieldErrors.categoryId ? "field-invalid" : undefined}>
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
                        onChange={(e) => {
                          clearField("categoryId");
                          setFormData((prev) => ({
                            ...prev,
                            categoryId: Number(e.target.value),
                          }));
                        }}
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
                      <FieldError message={fieldErrors.categoryId} />
                    </div>

                    <div className={fieldErrors.mono ? "field-invalid" : undefined}>
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
                        maxLength={10}
                        placeholder="e.g. ZB"
                        value={formData.mono}
                        onChange={(e) => {
                          clearField("mono");
                          setFormData((prev) => ({
                            ...prev,
                            mono: e.target.value.toUpperCase(),
                          }));
                        }}
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
                      <FieldError message={fieldErrors.mono} />
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
                    <div className={fieldErrors.tagline ? "field-invalid" : undefined}>
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
                        onChange={(e) => {
                          clearField("tagline");
                          setFormData((prev) => ({ ...prev, tagline: e.target.value }));
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "var(--r-sm)",
                        }}
                      />
                      <FieldError message={fieldErrors.tagline} />
                    </div>

                    <div className={fieldErrors.startingPrice ? "field-invalid" : undefined}>
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
                        onChange={(e) => {
                          clearField("startingPrice");
                          setFormData((prev) => ({
                            ...prev,
                            startingPrice: e.target.value,
                          }));
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "var(--r-sm)",
                        }}
                      />
                      <FieldError message={fieldErrors.startingPrice} />
                    </div>
                  </div>

                  {/* Description */}
                  <div className={fieldErrors.description ? "field-invalid" : undefined}>
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
                      rows={3}
                      placeholder="Comprehensive overview of capabilities, target audience, and market position..."
                      value={formData.description}
                      aria-invalid={fieldErrors.description ? true : undefined}
                      onChange={(e) => {
                        clearField("description");
                        setFormData((prev) => ({ ...prev, description: e.target.value }));
                      }}
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
                    <FieldError message={fieldErrors.description} />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div className={fieldErrors.logoUrl ? "field-invalid" : undefined}>
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
                        onChange={(e) => {
                          clearField("logoUrl");
                          setFormData((prev) => ({ ...prev, logoUrl: e.target.value }));
                        }}
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
                      {isUsableImageSrc(formData.logoUrl) ? (
                        <div style={{ marginTop: "4px" }}>
                          <Image
                            src={formData.logoUrl}
                            alt="Preview"
                            width={80}
                            height={24}
                            unoptimized
                            style={{ height: "24px", width: "auto", maxWidth: "80px", objectFit: "contain" }}
                          />
                        </div>
                      ) : null}
                      <FieldError message={fieldErrors.logoUrl} />
                    </div>

                    <div className={fieldErrors.websiteUrl ? "field-invalid" : undefined}>
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
                        onChange={(e) => {
                          clearField("websiteUrl");
                          setFormData((prev) => ({
                            ...prev,
                            websiteUrl: e.target.value,
                          }));
                        }}
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
                      <FieldError message={fieldErrors.websiteUrl} />
                    </div>

                    <div className={fieldErrors.trialUrl ? "field-invalid" : undefined}>
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
                        onChange={(e) => {
                          clearField("trialUrl");
                          setFormData((prev) => ({
                            ...prev,
                            trialUrl: e.target.value,
                          }));
                        }}
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
                      <FieldError message={fieldErrors.trialUrl} />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FEATURE CHECKPOINTS & CAPABILITIES */}
              {modalTab === "checkpoints" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <FieldError message={fieldErrors.featureCheckpoints} />
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
                      <FieldError message={checkpointNotice} />

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
                              onChange={(e) => {
                                setNewCpName(e.target.value);
                                setCheckpointNotice(null);
                              }}
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
                      onChange={(e) => {
                        clearField("pros");
                        setFormData((prev) => ({ ...prev, prosText: e.target.value }));
                      }}
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
                    <FieldError message={fieldErrors.pros} />
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
                      onChange={(e) => {
                        clearField("cons");
                        setFormData((prev) => ({ ...prev, consText: e.target.value }));
                      }}
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
                    <FieldError message={fieldErrors.cons} />
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

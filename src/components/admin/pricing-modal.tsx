"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PricingVerificationModalProps {
  software: {
    id: number;
    name: string;
    pricingPlans: Array<{
      id: number;
      planName: string;
      displayPrice: string | null;
      verifiedAt: Date | string | null;
      verificationSourceUrl: string | null;
    }>;
  } | null;
  onClose: () => void;
}

export function PricingVerificationModal({ software, onClose }: PricingVerificationModalProps) {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<number | undefined>(
    software?.pricingPlans[0]?.id
  );
  const [newPrice, setNewPrice] = useState<string>(
    software?.pricingPlans[0]?.displayPrice || ""
  );
  const [sourceUrl, setSourceUrl] = useState<string>(
    software?.pricingPlans[0]?.verificationSourceUrl || "https://"
  );
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!software) return null;

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!software) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/v1/admin/software/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          softwareId: software.id,
          planId: selectedPlanId,
          newPrice,
          sourceUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Verification failed.");
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setFeedback(err.message || "Failed to submit verification.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
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
          maxWidth: "520px",
          padding: "28px",
          background: "var(--surface)",
        }}
      >
        <div className="row between" style={{ marginBottom: "16px" }}>
          <div>
            <span className="eyebrow">Audit &amp; Verification</span>
            <h3 style={{ fontSize: "1.25rem", margin: "4px 0 0" }}>
              Verify {software.name} Pricing
            </h3>
          </div>
          <button type="button" className="btn btn--sm btn--ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        {feedback ? (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--danger-soft)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              marginBottom: "16px",
              fontSize: "0.85rem",
            }}
          >
            {feedback}
          </div>
        ) : null}

        <form onSubmit={handleVerify} className="stack gap-16">
          <div>
            <label className="tiny muted block" htmlFor="v-plan" style={{ marginBottom: "4px" }}>
              Select Pricing Plan Tier
            </label>
            <select
              id="v-plan"
              value={selectedPlanId}
              onChange={(e) => {
                const pId = Number(e.target.value);
                setSelectedPlanId(pId);
                const plan = software.pricingPlans.find((p) => p.id === pId);
                if (plan) {
                  setNewPrice(plan.displayPrice || "");
                  if (plan.verificationSourceUrl) setSourceUrl(plan.verificationSourceUrl);
                }
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--fg)",
              }}
            >
              {software.pricingPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.planName} ({plan.displayPrice || "No price set"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="tiny muted block" htmlFor="v-price" style={{ marginBottom: "4px" }}>
              Verified Display Price
            </label>
            <input
              id="v-price"
              type="text"
              required
              placeholder="e.g. from ₹749/month"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--fg)",
              }}
            />
          </div>

          <div>
            <label className="tiny muted block" htmlFor="v-source" style={{ marginBottom: "4px" }}>
              Proof / Vendor Pricing URL (Mandatory)
            </label>
            <input
              id="v-source"
              type="url"
              required
              placeholder="https://vendor.com/pricing"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--fg)",
              }}
            />
          </div>

          <div className="row gap-12" style={{ justifyContent: "flex-end", marginTop: "12px" }}>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? "Saving..." : "Commit Verification &amp; Audit Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

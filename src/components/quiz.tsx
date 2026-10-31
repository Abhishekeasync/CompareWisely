"use client";

import Link from "next/link";
import { useState } from "react";
import type { RecommendationAnswersInput } from "@/lib/validations/recommendation";
import type { RecommendationMatch, RequirementStatus } from "@/lib/types/recommendation";
import { Money } from "./money";

interface Option<T> {
  value: T;
  label: string;
  hint: string;
}

const SIZE_OPTIONS: Option<RecommendationAnswersInput["businessSize"]>[] = [
  { value: "sole", label: "Sole Proprietor / Freelancer", hint: "Single operator or shop, under ₹40L turnover" },
  { value: "small", label: "Small Team (1–10 staff)", hint: "₹40L to ₹1.5 Cr annual revenue, owner-managed" },
  { value: "growing", label: "Growing Business (11–50 staff)", hint: "₹1.5 Cr to ₹10 Cr, departmental operations" },
  { value: "mid", label: "Mid-Market Enterprise (50+ staff)", hint: "Above ₹10 Cr turnover, multi-tier management" },
];

const INDUSTRY_OPTIONS: Option<RecommendationAnswersInput["industry"]>[] = [
  { value: "trading", label: "Wholesale & Retail Trading", hint: "Fast counter billing, barcode scanning, stock tracking" },
  { value: "manufacturing", label: "Manufacturing & Job-Work", hint: "Bills of materials (BOM), production cycles, raw materials" },
  { value: "services", label: "Services & Professional Firms", hint: "Retainers, hourly billing, project expenses, CAs/Agencies" },
  { value: "distribution", label: "Distribution & FMCG / Pharma", hint: "Multi-godown, batch expiry tracking, dealer schemes" },
];

const BUDGET_OPTIONS: Option<RecommendationAnswersInput["budget"]>[] = [
  { value: "low", label: "Under ₹6,000 / year", hint: "Cost-sensitive, micro-business starter budget" },
  { value: "mid", label: "₹6,000 to ₹25,000 / year", hint: "Standard Indian SMB market rate for full compliance" },
  { value: "high", label: "Above ₹25,000 / year", hint: "Enterprise multi-user, multi-branch or customized setup" },
  { value: "unsure", label: "Flexible / Unsure", hint: "Recommend based purely on technical and workflow fit" },
];

const SEAT_OPTIONS: Option<NonNullable<RecommendationAnswersInput["userSeats"]>>[] = [
  { value: "single", label: "1 User (Single PC or Phone)", hint: "Owner or single accountant operating the software" },
  { value: "2_to_5", label: "2 to 5 Users", hint: "Accountant + billing clerk + owner oversight" },
  { value: "6_to_20", label: "6 to 20 Users", hint: "Multi-department access with distinct user permissions" },
  { value: "20_plus", label: "20+ Concurrent Users", hint: "Large corporate finance and warehouse teams" },
];

const VOLUME_OPTIONS: Option<NonNullable<RecommendationAnswersInput["monthlyInvoiceVolume"]>>[] = [
  { value: "under_100", label: "Under 100 invoices / month", hint: "Low volume; typical for consulting and B2B services" },
  { value: "100_to_1000", label: "100 to 1,000 invoices / month", hint: "Moderate volume; steady wholesale or growing business" },
  { value: "1000_plus", label: "1,000+ invoices / month", hint: "High-volume retail counters or daily distribution" },
];

const BANK_OPTIONS: Option<NonNullable<RecommendationAnswersInput["bankAccountsCount"]>>[] = [
  { value: "single", label: "1 Main Current Account", hint: "Standard periodic bank statement reconciliation" },
  { value: "multiple", label: "2 or More Active Bank Accounts", hint: "Requires direct automated bank feeds (ICICI, HDFC, etc.)" },
];

type MustHaveFeature = RecommendationAnswersInput["mustHaveFeatures"][number];

const FEATURE_OPTIONS: Array<{ value: MustHaveFeature; label: string; hint: string }> = [
  { value: "gst", label: "Automated GST & E-Invoicing", hint: "Direct IRN generation, GSTR-1/3B filing & 2B reconciliation" },
  { value: "inventory", label: "Inventory & Batch Expiry", hint: "Multi-godown tracking, batch numbers, barcode labels" },
  { value: "cloud", label: "100% Native Cloud SaaS", hint: "Browser and mobile access from anywhere without remote desktop" },
  { value: "offline", label: "Offline-First Desktop Speed", hint: "Zero dependence on active internet for billing and data entry" },
  { value: "bank_feeds", label: "Live Automated Bank Feeds", hint: "Direct API banking feeds for real-time ledger matching" },
  { value: "payroll", label: "Payroll & HR Compliance", hint: "Salary processing, PF, ESI, and TDS salary computation" },
  { value: "multibranch", label: "Multi-Branch & Multi-GSTIN", hint: "Consolidate multiple state registrations in one portal" },
  { value: "api", label: "Open REST APIs & Webhooks", hint: "Connect your e-commerce shop, CRM, or custom internal tools" },
];

const TOTAL_STEPS = 6;

export function Quiz() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationMatch | null>(null);

  // Form State
  const [businessSize, setBusinessSize] = useState<RecommendationAnswersInput["businessSize"]>("small");
  const [industry, setIndustry] = useState<RecommendationAnswersInput["industry"]>("trading");
  const [budget, setBudget] = useState<RecommendationAnswersInput["budget"]>("mid");
  const [userSeats, setUserSeats] = useState<NonNullable<RecommendationAnswersInput["userSeats"]>>("2_to_5");
  const [monthlyInvoiceVolume, setMonthlyInvoiceVolume] = useState<NonNullable<RecommendationAnswersInput["monthlyInvoiceVolume"]>>("100_to_1000");
  const [bankAccountsCount, setBankAccountsCount] = useState<NonNullable<RecommendationAnswersInput["bankAccountsCount"]>>("multiple");
  const [mustHaveFeatures, setMustHaveFeatures] = useState<MustHaveFeature[]>(["gst", "cloud", "bank_feeds"]);

  function toggleFeature(val: MustHaveFeature) {
    setMustHaveFeatures((prev) =>
      prev.includes(val) ? prev.filter((f) => f !== val) : [...prev, val]
    );
  }

  function reset() {
    setStep(1);
    setResult(null);
    setErrorMsg(null);
    setBusinessSize("small");
    setIndustry("trading");
    setBudget("mid");
    setUserSeats("2_to_5");
    setMonthlyInvoiceVolume("100_to_1000");
    setBankAccountsCount("multiple");
    setMustHaveFeatures(["gst", "cloud", "bank_feeds"]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitWizard() {
    if (mustHaveFeatures.length === 0) {
      setErrorMsg("Please select at least one must-have capability.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const payload: RecommendationAnswersInput = {
      businessSize,
      industry,
      budget,
      userSeats,
      monthlyInvoiceVolume,
      bankAccountsCount,
      mustHaveFeatures,
    };

    try {
      const res = await fetch("/api/v1/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to evaluate software recommendation.");
      }

      setResult(json.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Quiz submission error:", err);
      setErrorMsg(err.message || "An unexpected error occurred while calculating your best fit.");
    } finally {
      setLoading(false);
    }
  }

  // Render Result View
  if (result) {
    const leadAlternative = result.runnersUp[0];
    const compareLink = leadAlternative
      ? `/compare?products=${result.softwareSlug},${leadAlternative.softwareSlug}`
      : `/compare`;

    return (
      <div className="quiz" style={{ maxWidth: "860px", margin: "0 auto" }}>
        <div className="panel card--pad" id="q-result" style={{ padding: "32px" }}>
          {/* Header & Score Ring */}
          <div className="row between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
            <div>
              <span className="eyebrow" style={{ color: "var(--primary-text)" }}>
                Verified Best Fit Match
              </span>
              <div className="row gap-12" style={{ alignItems: "center", marginTop: "8px" }}>
                <span className={`swlogo swlogo--lg swlogo--on ${result.softwareSlug}`} aria-hidden="true">
                  {result.mono}
                </span>
                <div>
                  <h2 style={{ fontSize: "1.75rem", margin: 0, color: "var(--fg)" }}>{result.softwareName}</h2>
                  {result.tagline ? (
                    <p className="tiny muted" style={{ marginTop: "2px", marginBottom: 0 }}>
                      {result.tagline}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Score Badge */}
            <div
              style={{
                border: "2px solid var(--primary-text)",
                background: "var(--primary-soft)",
                padding: "12px 20px",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1, display: "block", color: "var(--primary-text)" }}>
                {result.overallFitScore}%
              </span>
              <span className="tiny" style={{ fontWeight: 600, color: "var(--fg)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {result.matchLevel}
              </span>
            </div>
          </div>

          {/* Pricing & Verification Notice */}
          <div
            className="row between"
            style={{
              padding: "12px 16px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              marginBottom: "28px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span className="tiny">
              <b>Indicative Pricing:</b> {result.startingPrice || "Contact vendor"}
            </span>
            {result.verifiedDate ? (
              <span className="tiny muted">
                Verified against vendor terms: <b>{result.verifiedDate}</b>
              </span>
            ) : null}
          </div>

          {/* Why It Matches */}
          <div style={{ marginBottom: "28px" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Why this matches your requirements:</h3>
            <ul className="stack gap-8" style={{ paddingLeft: "20px", margin: 0 }}>
              {result.matchReasons.map((reason, idx) => (
                <li key={idx} style={{ fontSize: "0.95rem", color: "var(--fg)" }}>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements Audit Table */}
          <div style={{ marginBottom: "28px" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Essential Needs Audit:</h3>
            <div style={{ border: "1px solid var(--border)", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", width: "35%" }}>Required Feature</th>
                    <th style={{ padding: "10px 14px", textAlign: "center", width: "20%" }}>Status</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Factual Evaluation Note</th>
                  </tr>
                </thead>
                <tbody>
                  {result.requirementsAudit.map((item, idx) => {
                    const statusConfig = getStatusBadge(item.status);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>{item.featureName}</td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              background: statusConfig.bg,
                              color: statusConfig.color,
                              border: `1px solid ${statusConfig.border}`,
                            }}
                          >
                            {statusConfig.label}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--fg-soft)" }}>{item.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trade-Offs & Limitations Callout */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderLeft: "4px solid var(--amber)",
              background: "var(--amber-soft)",
              padding: "16px 20px",
              marginBottom: "32px",
            }}
          >
            <span className="eyebrow" style={{ color: "var(--amber)", marginBottom: "6px" }}>
              Factual Trade-Offs & Limitations
            </span>
            <p className="tiny muted" style={{ marginBottom: "10px" }}>
              Every software has architectural trade-offs. Consider these factors before committing:
            </p>
            <ul className="stack gap-6" style={{ paddingLeft: "18px", margin: 0 }}>
              {result.tradeOffs.map((tradeoff, idx) => (
                <li key={idx} style={{ fontSize: "0.9rem", color: "var(--fg)" }}>
                  {tradeoff}
                </li>
              ))}
            </ul>
          </div>

          {/* Runners Up Section */}
          {result.runnersUp.length > 0 ? (
            <div style={{ marginBottom: "32px" }}>
              <span className="eyebrow">Alternative Options to Consider</span>
              <div className="note-rows" style={{ marginTop: "12px" }}>
                {result.runnersUp.map((alt) => (
                  <article key={alt.softwareId} className="note-row" style={{ padding: "14px 16px" }}>
                    <span className={`swlogo ${alt.softwareSlug} swlogo--sm`} aria-hidden="true">
                      {alt.mono}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div className="row between" style={{ alignItems: "baseline" }}>
                        <b style={{ fontSize: "0.95rem" }}>{alt.softwareName}</b>
                        <span className="tiny muted" style={{ fontWeight: 600 }}>
                          Fit Score: {alt.score}%
                        </span>
                      </div>
                      <p className="tiny muted" style={{ margin: "4px 0 0" }}>
                        {alt.differentiatingFactor}
                      </p>
                      {alt.startingPrice ? (
                        <span className="tiny block muted" style={{ marginTop: "2px" }}>
                          Starting from: {alt.startingPrice}
                        </span>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {/* Action CTAs */}
          <div
            className="row gap-12 center"
            style={{
              paddingTop: "16px",
              borderTop: "1px solid var(--border)",
              flexWrap: "wrap",
            }}
          >
            <Link className="btn btn--primary" href={compareLink}>
              Compare with {leadAlternative?.softwareName || "Alternatives"} Side-by-Side
            </Link>
            {result.trialUrl ? (
              <a
                className="btn"
                href={result.trialUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Official Vendor Trial ↗
              </a>
            ) : null}
            <button className="btn btn--ghost" type="button" onClick={reset}>
              Retake Questionnaire
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render 6-Step Wizard Questions
  return (
    <div className="quiz" style={{ maxWidth: "720px", margin: "0 auto" }}>
      <div className="panel card--pad" style={{ padding: "28px" }}>
        {/* Wizard Header */}
        <div className="row between quiz-head" style={{ marginBottom: "16px" }}>
          <div>
            <span className="eyebrow" style={{ color: "var(--primary-text)" }}>
              Step {step} of {TOTAL_STEPS}
            </span>
            <h2 style={{ fontSize: "1.25rem", margin: "4px 0 0", color: "var(--fg)" }}>
              {getStepTitle(step)}
            </h2>
          </div>
          {step > 1 ? (
            <button className="btn btn--sm btn--ghost" type="button" onClick={reset}>
              Start Over
            </button>
          ) : null}
        </div>

        {/* Progress Bar */}
        <div
          className="quiz__bar"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step}
          aria-label="Recommendation wizard progress"
          style={{ marginBottom: "24px" }}
        >
          <i style={{ transform: `scaleX(${step / TOTAL_STEPS})` }} />
        </div>

        {errorMsg ? (
          <div
            style={{
              background: "var(--danger-soft)",
              border: "1px solid var(--danger)",
              padding: "10px 14px",
              marginBottom: "20px",
              fontSize: "0.875rem",
              color: "var(--danger)",
            }}
          >
            {errorMsg}
          </div>
        ) : null}

        {/* Step 1: Business Size */}
        {step === 1 ? (
          <div className="quiz-step">
            <p className="tiny muted quiz-hint">
              Software architecture must fit your organizational scale and daily compliance complexity.
            </p>
            <div className="stack gap-10" role="radiogroup" aria-label="Select business size">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className="quiz-opt"
                  type="button"
                  aria-pressed={businessSize === opt.value}
                  onClick={() => setBusinessSize(opt.value)}
                >
                  <span className="quiz-opt__box" data-multi="0" />
                  <span>
                    <b>{opt.label}</b>
                    <span className="tiny muted block">{opt.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Step 2: Industry */}
        {step === 2 ? (
          <div className="quiz-step">
            <p className="tiny muted quiz-hint">
              Different sectors require distinct ledger workflows, inventory tracking depths, and billing formats.
            </p>
            <div className="stack gap-10" role="radiogroup" aria-label="Select industry">
              {INDUSTRY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className="quiz-opt"
                  type="button"
                  aria-pressed={industry === opt.value}
                  onClick={() => setIndustry(opt.value)}
                >
                  <span className="quiz-opt__box" data-multi="0" />
                  <span>
                    <b>{opt.label}</b>
                    <span className="tiny muted block">{opt.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Step 3: Budget */}
        {step === 3 ? (
          <div className="quiz-step">
            <p className="tiny muted quiz-hint">
              Software investment expectations (annual base subscription or one-time license).
            </p>
            <div className="stack gap-10" role="radiogroup" aria-label="Select budget">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className="quiz-opt"
                  type="button"
                  aria-pressed={budget === opt.value}
                  onClick={() => setBudget(opt.value)}
                >
                  <span className="quiz-opt__box" data-multi="0" />
                  <span>
                    <b>{opt.label}</b>
                    <span className="tiny muted block">{opt.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Step 4: User Seats */}
        {step === 4 ? (
          <div className="quiz-step">
            <p className="tiny muted quiz-hint">
              How many team members need simultaneous access to create bills, review accounts, or enter stock?
            </p>
            <div className="stack gap-10" role="radiogroup" aria-label="Select user seats">
              {SEAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className="quiz-opt"
                  type="button"
                  aria-pressed={userSeats === opt.value}
                  onClick={() => setUserSeats(opt.value)}
                >
                  <span className="quiz-opt__box" data-multi="0" />
                  <span>
                    <b>{opt.label}</b>
                    <span className="tiny muted block">{opt.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Step 5: Volume & Bank Feeds */}
        {step === 5 ? (
          <div className="quiz-step">
            <div style={{ marginBottom: "20px" }}>
              <span className="eyebrow" style={{ marginBottom: "8px" }}>A. Monthly Invoice Volume</span>
              <div className="stack gap-8" role="radiogroup">
                {VOLUME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className="quiz-opt"
                    type="button"
                    aria-pressed={monthlyInvoiceVolume === opt.value}
                    onClick={() => setMonthlyInvoiceVolume(opt.value)}
                  >
                    <span className="quiz-opt__box" data-multi="0" />
                    <span>
                      <b>{opt.label}</b>
                      <span className="tiny muted block">{opt.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="eyebrow" style={{ marginBottom: "8px" }}>B. Bank Account Reconciliation</span>
              <div className="stack gap-8" role="radiogroup">
                {BANK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className="quiz-opt"
                    type="button"
                    aria-pressed={bankAccountsCount === opt.value}
                    onClick={() => setBankAccountsCount(opt.value)}
                  >
                    <span className="quiz-opt__box" data-multi="0" />
                    <span>
                      <b>{opt.label}</b>
                      <span className="tiny muted block">{opt.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Step 6: Must-Have Capabilities */}
        {step === 6 ? (
          <div className="quiz-step">
            <p className="tiny muted quiz-hint">
              Select all capabilities that are absolute dealbreakers for your business (multi-select):
            </p>
            <div className="stack gap-10" role="group" aria-label="Select must have features">
              {FEATURE_OPTIONS.map((opt) => {
                const checked = mustHaveFeatures.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    className="quiz-opt"
                    type="button"
                    aria-pressed={checked}
                    onClick={() => toggleFeature(opt.value)}
                  >
                    <span className="quiz-opt__box" data-multi="1" />
                    <span>
                      <b>{opt.label}</b>
                      <span className="tiny muted block">{opt.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Navigation Buttons */}
        <div className="row between gap-12 quiz-nav" style={{ marginTop: "28px" }}>
          <button
            className={`btn ${step === 1 ? "is-off" : ""}`}
            type="button"
            disabled={step === 1 || loading}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
            >
              Next Step
            </button>
          ) : (
            <button
              className="btn btn--primary"
              type="button"
              disabled={loading || mustHaveFeatures.length === 0}
              onClick={submitWizard}
            >
              {loading ? "Calculating Match..." : "Generate Transparent Evaluation"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getStepTitle(step: number): string {
  switch (step) {
    case 1:
      return "Business Scale & Annual Turnover";
    case 2:
      return "Primary Industry & Operations";
    case 3:
      return "Software Budget Expectations";
    case 4:
      return "Team Seats & Concurrent Access";
    case 5:
      return "Transaction Volume & Banking Complexity";
    case 6:
      return "Non-Negotiable Essential Capabilities";
    default:
      return "Questionnaire";
  }
}

function getStatusBadge(status: RequirementStatus) {
  switch (status) {
    case "MET":
      return {
        label: "MET",
        bg: "rgba(28, 25, 21, 0.08)",
        color: "var(--fg)",
        border: "var(--border-strong)",
      };
    case "PARTIAL":
      return {
        label: "PARTIAL",
        bg: "var(--amber-soft)",
        color: "var(--amber)",
        border: "var(--amber)",
      };
    case "PAID_ADDON":
      return {
        label: "PAID ADD-ON",
        bg: "var(--info-soft)",
        color: "var(--info)",
        border: "var(--info)",
      };
    case "NOT_MET":
      return {
        label: "NOT MET",
        bg: "var(--danger-soft)",
        color: "var(--danger)",
        border: "var(--danger)",
      };
    default:
      return {
        label: "UNKNOWN",
        bg: "var(--surface-2)",
        color: "var(--muted)",
        border: "var(--border)",
      };
  }
}

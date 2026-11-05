"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { DynamicMatrixData } from "@/lib/types/comparison";
import { ChevronIcon } from "@/components/icons";
import { Money } from "@/components/money";
import { CompareValueCell } from "./compare-value-cell";
import { useCompareMatrixLenis } from "./use-compare-matrix-lenis";

type Props = {
  matrix: DynamicMatrixData;
  onRemove?: (slug: string) => void;
  onMove?: (slug: string, direction: -1 | 1) => void;
  showControls?: boolean;
};

export function CompareMatrix({ matrix, onRemove, onMove, showControls = true }: Props) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [diffsOnly, setDiffsOnly] = useState(false);

  const { columns, categories } = matrix;

  if (columns.length < 2) return null;

  const colCount = columns.length;
  const wrapRef = useCompareMatrixLenis([colCount, categories, diffsOnly, collapsed]);

  return (
    <div
      ref={wrapRef}
      className="compare-matrix-wrap"
      style={{ "--compare-cols": colCount } as CSSProperties}
    >
      {/* Matrix Controls Bar */}
      <div className="compare-matrix__toolbar row between">
        <div className="row gap-8">
          <button
            type="button"
            className={`btn btn--sm ${diffsOnly ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setDiffsOnly(!diffsOnly)}
            aria-pressed={diffsOnly}
          >
            {diffsOnly ? "✓ Showing Differences Only" : "Show Differences Only"}
          </button>
          <span className="tiny muted compare-matrix__toolbar-hint">
            {diffsOnly
              ? "Hiding rows where all products are identical"
              : "Comparing all standard capabilities"}
          </span>
        </div>
        <span className="tiny muted compare-matrix__toolbar-tip">
          Tip: Pin or reorder columns to compare side-by-side
        </span>
      </div>

      <div className="vs vs--dynamic" role="table" aria-label="Software comparison">
        <div className="vs__row vs__row--head compare-matrix__head" role="row">
          <div className="vs__corner" role="columnheader">
            <span className="vs__label">Products ({columns.length})</span>
          </div>
          {columns.map((col, index) => (
            <div key={col.slug} className="vs__product" role="columnheader">
              {showControls && onRemove ? (
                <button
                  type="button"
                  className="compare-remove"
                  onClick={() => onRemove(col.slug)}
                  aria-label={`Remove ${col.name} from comparison`}
                >
                  Remove
                </button>
              ) : null}
              <span className={`swlogo swlogo--on ${col.slug.split("-")[0]}`} aria-hidden="true">
                {col.mono || col.name[0]}
              </span>
              <span className="vs__name">{col.name}</span>
              <span className="tiny block">
                <Money value={col.startingPrice} />
              </span>
              <div style={{ marginTop: "4px" }}>
                <Link
                  href={`/software/${col.slug}`}
                  className="tiny"
                  style={{ textDecoration: "underline", color: "var(--primary-text)" }}
                >
                  View profile →
                </Link>
              </div>
              {showControls && onMove ? (
                <div className="compare-reorder row gap-8" style={{ marginTop: "8px" }}>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    disabled={index === 0}
                    onClick={() => onMove(col.slug, -1)}
                    aria-label={`Move ${col.name} earlier`}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    disabled={index === columns.length - 1}
                    onClick={() => onMove(col.slug, 1)}
                    aria-label={`Move ${col.name} later`}
                  >
                    →
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {categories.map((category) => {
          const rawFeatures = category.features;

          const features = diffsOnly
            ? rawFeatures.filter((feat) => feat.isDifferent)
            : rawFeatures;

          const isCollapsed = collapsed[category.id] ?? false;

          return (
            <section key={category.id} className="compare-category" aria-labelledby={`cat-${category.id}`}>
              <button
                type="button"
                id={`cat-${category.id}`}
                className="compare-category__toggle"
                aria-expanded={!isCollapsed}
                onClick={() =>
                  setCollapsed((current) => ({
                    ...current,
                    [category.id]: !isCollapsed,
                  }))
                }
              >
                <span>
                  {category.name}{" "}
                  {diffsOnly ? `(${features.length} differences)` : ""}
                </span>
                <ChevronIcon />
              </button>
              {!isCollapsed ? (
                <div className="compare-category__body">
                  {features.length === 0 && diffsOnly ? (
                    <div style={{ padding: "16px 20px", color: "var(--muted)", fontStyle: "italic", fontSize: "0.88rem" }}>
                      All features in this category are identical across the selected software.
                    </div>
                  ) : (
                    features.map((feat) => (
                      <div
                        key={feat.id}
                        className={`vs__row${feat.code === "starting_price" ? " vs__row--starting-price" : ""}`}
                        role="row"
                      >
                        <div className="vs__label" role="rowheader">
                          {feat.name}
                          {feat.isDifferent ? (
                            <span
                              style={{
                                display: "inline-block",
                                marginLeft: "6px",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                color: "var(--primary-text)",
                              }}
                            >
                              *
                            </span>
                          ) : null}
                        </div>
                        {columns.map((col) => {
                          const cell = feat.values[col.slug];
                          return (
                            <CompareValueCell
                              key={col.slug}
                              valueKind={cell?.valueKind}
                              textValue={cell?.textValue}
                              highlight={feat.isDifferent}
                            />
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
      <p className="trust tiny" style={{ marginTop: "16px" }}>
        Feature rows reflect CompareWisely&apos;s editorial checklist for India MSME accounting software.
        Confirm pricing and capabilities with each vendor before you buy.
      </p>
    </div>
  );
}

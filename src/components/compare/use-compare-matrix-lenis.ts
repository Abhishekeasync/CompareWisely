"use client";

import { useEffect, useRef } from "react";

/**
 * Horizontal pan only when the table is wider than the viewport.
 * Avoids `overflow-x: auto` on the wrapper when unnecessary — that state
 * captures vertical wheel events without scrolling, which blocks Lenis.
 * When pan is required, use `data-lenis-prevent-horizontal` so vertical
 * wheel still drives Lenis page scroll (not full `data-lenis-prevent`).
 */
export function useCompareMatrixLenis(deps: unknown[] = []) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const syncPan = () => {
      const inner = el.querySelector(".vs");
      if (!(inner instanceof HTMLElement)) return;

      const wasPan = el.classList.contains("compare-matrix-wrap--pan");
      if (!wasPan) el.classList.add("compare-matrix-wrap--pan");
      const needsPan = inner.getBoundingClientRect().width > el.clientWidth + 1;
      el.classList.toggle("compare-matrix-wrap--pan", needsPan);
      el.dataset.scrollMode = needsPan ? "pan" : "flow";
      if (needsPan) {
        el.setAttribute("data-lenis-prevent-horizontal", "");
      } else {
        el.removeAttribute("data-lenis-prevent-horizontal");
      }
    };

    syncPan();
    const ro = new ResizeObserver(syncPan);
    ro.observe(el);
    const table = el.querySelector(".vs");
    if (table instanceof HTMLElement) ro.observe(table);

    return () => ro.disconnect();
  }, deps);

  return wrapRef;
}

function cellSignature(
  values: Record<string, { valueKind?: string; textValue?: string | null }>,
  slug: string,
) {
  const cell = values[slug];
  return `${cell?.valueKind ?? ""}\0${cell?.textValue ?? ""}`;
}

/** Highlight only cells whose value differs from at least one other column. */
export function highlightCompareCell(
  values: Record<string, { valueKind?: string; textValue?: string | null }>,
  slug: string,
  slugs: string[],
  rowDiffers: boolean,
): boolean {
  if (!rowDiffers || slugs.length < 2) return false;
  const mine = cellSignature(values, slug);
  return slugs.some((other) => other !== slug && cellSignature(values, other) !== mine);
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import type Lenis from "lenis";
import type { DynamicMatrixData } from "@/lib/types/comparison";
import { PageHead } from "@/components/page-head";
import { ChevronIcon, SearchIcon } from "@/components/icons";
import { Money } from "@/components/money";
import { CompareMatrix } from "./compare-matrix";

const MAX_COMPARE_PRODUCTS = 4;
const MIN_COMPARE_PRODUCTS = 2;
/** Clears fixed nav + mobile tab bar when scrolling to the matrix via Lenis */
const COMPARE_MATRIX_SCROLL_OFFSET = -70;

function scrollCompareMatrix(lenis: Lenis | null | undefined) {
  const target = document.getElementById("compare-matrix");
  if (!target) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (lenis && !reduce) {
    lenis.scrollTo(target, {
      offset: COMPARE_MATRIX_SCROLL_OFFSET,
      duration: 1.0,
    });
    return;
  }

  target.scrollIntoView({
    block: "start",
    behavior: reduce ? "auto" : "smooth",
  });
}

/** Lightweight product shape fetched from /api/v1/software */
interface CatalogProduct {
  id: number;
  slug: string;
  name: string;
  mono: string;
  tagline: string | null;
  websiteUrl: string | null;
  trialUrl: string | null;
  category: { name: string };
  pricingPlans: Array<{ displayPrice: string | null; isStartingPrice: boolean }>;
}

/** Popular comparisons fetched from the database */
interface PopularComparison {
  slug: string;
  title: string;
  verdictSummary: string | null;
  products: Array<{
    slug: string;
    name: string;
    mono: string;
  }>;
}

export function CompareWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lenis = useLenis();

  // Parse selected product slugs from the URL
  const selectedSlugs = useMemo(() => {
    const param = searchParams.get("products");
    if (!param?.trim()) return ["tally-prime", "zoho-books"];
    const slugs = param
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const unique = [...new Set(slugs)];
    return unique.slice(0, MAX_COMPARE_PRODUCTS);
  }, [searchParams]);

  // State
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [matrix, setMatrix] = useState<DynamicMatrixData | null>(null);
  const [popularComparisons, setPopularComparisons] = useState<PopularComparison[]>([]);
  const [query, setQuery] = useState("");
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollAfterMatrixRef = useRef(false);

  // Fetch the full product catalog once
  useEffect(() => {
    fetch("/api/v1/software")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCatalog(json.data);
      })
      .catch(console.error);
  }, []);

  // Fetch popular curated comparisons once
  useEffect(() => {
    fetch("/api/v1/compare/popular")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((json) => {
        if (json?.success) setPopularComparisons(json.data);
      })
      .catch(() => {
        // Popular comparisons endpoint is optional; fall back to empty
      });
  }, []);

  // Fetch the comparison matrix whenever selectedSlugs changes
  useEffect(() => {
    if (selectedSlugs.length < MIN_COMPARE_PRODUCTS) {
      setMatrix(null);
      setLoading(false);
      return;
    }

    let isCurrent = true;
    setLoading(true);
    fetch(`/api/v1/compare/matrix?ids=${selectedSlugs.join(",")}`)
      .then((res) => res.json())
      .then((json) => {
        if (!isCurrent) return;
        if (json.success) setMatrix(json.data);
        else setMatrix(null);
      })
      .catch(() => {
        if (isCurrent) setMatrix(null);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedSlugs]);

  const scrollToMatrix = useCallback(() => {
    scrollCompareMatrix(lenis);
  }, [lenis]);

  useEffect(() => {
    if (!scrollAfterMatrixRef.current || loading) return;
    scrollAfterMatrixRef.current = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollCompareMatrix(lenis));
    });
  }, [loading, lenis, matrix]);

  const syncUrl = useCallback(
    (slugs: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("products", slugs.join(","));
      router.replace(`/compare?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // Resolve selected products from the catalog
  const selectedProducts = useMemo(
    () =>
      selectedSlugs
        .map((slug) => catalog.find((p) => p.slug === slug))
        .filter((p): p is CatalogProduct => p !== undefined),
    [selectedSlugs, catalog],
  );

  const showMatrix = selectedSlugs.length >= MIN_COMPARE_PRODUCTS;

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const blocked = new Set(selectedSlugs);
    return catalog
      .filter((item) => {
        if (blocked.has(item.slug)) return false;
        if (!q) return true;
        return `${item.name} ${item.tagline || ""} ${item.slug}`
          .toLowerCase()
          .includes(q);
      })
      .slice(0, 8);
  }, [query, selectedSlugs, catalog]);

  function updateSelection(slugs: string[]) {
    syncUrl(slugs);
  }

  function pickProduct(slug: string) {
    let next: string[] | null = null;

    if (activeSlot !== null) {
      const duplicateElsewhere = selectedSlugs.some(
        (existing, index) => index !== activeSlot && existing === slug,
      );
      if (duplicateElsewhere) return;
      const draft = [...selectedSlugs];
      if (activeSlot < draft.length) {
        draft[activeSlot] = slug;
        next = draft;
      } else if (draft.length < MAX_COMPARE_PRODUCTS) {
        draft.push(slug);
        next = draft;
      }
    } else if (!selectedSlugs.includes(slug) && selectedSlugs.length < MAX_COMPARE_PRODUCTS) {
      next = [...selectedSlugs, slug];
    }

    if (!next) return;
    setQuery("");
    setActiveSlot(null);
    updateSelection(next);
  }

  function clearSlot(index: number) {
    const next = selectedSlugs.filter((_, idx) => idx !== index);
    updateSelection(next);
  }

  function removeBySlug(slug: string) {
    updateSelection(selectedSlugs.filter((s) => s !== slug));
  }

  function moveBySlug(slug: string, direction: -1 | 1) {
    const index = selectedSlugs.indexOf(slug);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= selectedSlugs.length) return;
    const next = [...selectedSlugs];
    [next[index], next[target]] = [next[target], next[index]];
    updateSelection(next);
  }

  function loadPopular(slugs: string[]) {
    scrollAfterMatrixRef.current = true;
    updateSelection(slugs.slice(0, MAX_COMPARE_PRODUCTS));
  }

  const slots = Array.from(
    { length: MAX_COMPARE_PRODUCTS },
    (_, index) => selectedProducts[index] ?? null,
  );

  return (
    <>
      <PageHead
        current="Compare"
        eyebrow="Tool"
        title="What products would you like to compare?"
        lead="Pick up to four accounting products and review pricing, GST depth, and platform fit side by side. Prices are starting points — confirm them with the vendor."
      />

      <section className="section">
        <div className="container compare-hub">
          <div className="compare-picker">
            <div className="compare-picker__head row between gap-12">
              <p className="tiny muted">
                <b>{selectedSlugs.length}</b> of {MAX_COMPARE_PRODUCTS} slots filled
                {activeSlot !== null ? (
                  <>
                    {" "}
                    · choosing for <b>slot {activeSlot + 1}</b>
                  </>
                ) : null}
              </p>
              {activeSlot !== null ? (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setActiveSlot(null);
                    setQuery("");
                  }}
                >
                  Cancel selection
                </button>
              ) : null}
            </div>

            <div className="compare-slots" aria-label="Selected products">
              {slots.map((product, index) => {
                const isActive = activeSlot === index;
                const startingPrice = product?.pricingPlans?.find((p) => p.isStartingPrice)?.displayPrice;
                return (
                  <div
                    key={index}
                    className={`compare-slot${product ? " compare-slot--filled" : ""}${isActive ? " compare-slot--active" : ""}`}
                  >
                    <div className="compare-slot__head row between gap-8">
                      <p className="compare-slot__label">Product {index + 1}</p>
                      <span
                        className="compare-slot__indicator"
                        aria-hidden="true"
                        data-active={isActive ? "true" : product ? "filled" : "false"}
                      />
                    </div>
                    {product ? (
                      <>
                        <div className="compare-slot__product row gap-12">
                          <span
                            className={`swlogo swlogo--lg ${product.slug.split("-")[0]}`}
                            aria-hidden="true"
                          >
                            {product.mono || product.name[0]}
                          </span>
                          <div className="compare-slot__meta grow">
                            <b className="compare-slot__name">{product.name}</b>
                            <span className="tiny muted compare-slot__price">
                              from <Money value={startingPrice || "Contact vendor"} />
                            </span>
                          </div>
                        </div>
                        <div className="compare-slot__actions row gap-8">
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => {
                              setActiveSlot(index);
                              setQuery("");
                            }}
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => clearSlot(index)}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="compare-slot__empty"
                        onClick={() => {
                          setActiveSlot(index);
                          setQuery("");
                        }}
                      >
                        <span className="compare-slot__empty-icon" aria-hidden="true">
                          +
                        </span>
                        <span>Add a product</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="compare-toolbar">
              <div className="catalog-search compare-search">
                <span className="compare-search__icon" aria-hidden="true">
                  <SearchIcon />
                </span>
                <label className="sr-only" htmlFor="compare-search-input">
                  Search products to add
                </label>
                <input
                  id="compare-search-input"
                  className="catalog-search__input"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={
                    activeSlot !== null
                      ? `Search to fill slot ${activeSlot + 1}…`
                      : selectedSlugs.length >= MAX_COMPARE_PRODUCTS
                        ? "Maximum products selected"
                        : "Search accounting software to add…"
                  }
                  disabled={selectedSlugs.length >= MAX_COMPARE_PRODUCTS && activeSlot === null}
                  aria-describedby="compare-search-hint"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="btn btn--primary btn--sm catalog-search__submit"
                  disabled={!showMatrix}
                  onClick={scrollToMatrix}
                >
                  Compare {selectedSlugs.length}
                </button>
              </div>
              <p id="compare-search-hint" className="tiny muted compare-search__hint">
                {activeSlot !== null
                  ? `Choosing a result replaces product slot ${activeSlot + 1}. Duplicates are ignored.`
                  : `Select up to ${MAX_COMPARE_PRODUCTS} products, or pick a curated pairing below.`}
                {!showMatrix ? (
                  <>
                    {" "}
                    Add at least {MIN_COMPARE_PRODUCTS} products to open the matrix.
                  </>
                ) : null}
              </p>
              {searchResults.length > 0 && query.trim() ? (
                <ul
                  className="compare-search__results"
                  role="listbox"
                  aria-label="Search results"
                >
                  {searchResults.map((item) => {
                    const price = item.pricingPlans?.find((p) => p.isStartingPrice)?.displayPrice;
                    return (
                      <li key={item.slug}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={false}
                          className="compare-search__hit"
                          onClick={() => pickProduct(item.slug)}
                        >
                          <span
                            className={`swlogo swlogo--sm ${item.slug.split("-")[0]}`}
                            aria-hidden="true"
                          >
                            {item.mono || item.name[0]}
                          </span>
                          <span className="grow">
                            <b>{item.name}</b>
                            <span className="tiny muted block">{item.tagline}</span>
                          </span>
                          <span className="tiny">
                            <Money value={price || "Contact vendor"} />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : query.trim() ? (
                <p className="compare-empty muted">No matching products. Try another name.</p>
              ) : null}
            </div>
          </div>

          {/* Popular Comparisons */}
          <div className="compare-popular">
            <div className="compare-popular__head row between gap-12">
              <h2 className="section-head">Popular comparisons</h2>
              <span className="tiny muted">One click loads the matrix</span>
            </div>
            <div className="path-grid compare-popular__list">
              {popularComparisons.length > 0
                ? popularComparisons.map((comp, index) => (
                    <button
                      key={comp.slug}
                      type="button"
                      className="path-card compare-popular__card"
                      onClick={() => loadPopular(comp.products.map((p) => p.slug))}
                    >
                      <span className="path-card__index mono">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="compare-popular__body">
                        <div className="compare-popular__names row gap-8">
                          {comp.products.map((p, productIndex) => (
                            <span key={p.slug} className="row gap-8 compare-popular__product">
                              {productIndex > 0 ? (
                                <span className="compare-popular__vs muted" aria-hidden="true">
                                  vs
                                </span>
                              ) : null}
                              <span
                                className={`swlogo swlogo--sm ${p.slug.split("-")[0]}`}
                                aria-hidden="true"
                              >
                                {p.mono || p.name[0]}
                              </span>
                              <b>{p.name}</b>
                            </span>
                          ))}
                        </div>
                        <p className="muted tiny compare-popular__blurb">
                          {comp.verdictSummary || `Compare ${comp.title}`}
                        </p>
                      </div>
                      <span className="path-card__go">
                        Load comparison
                        <ChevronIcon />
                      </span>
                    </button>
                  ))
                : /* Fallback: hardcoded popular comparisons using known slugs */
                  [
                    {
                      slugs: ["tally-prime", "zoho-books"],
                      title: "Tally Prime vs Zoho Books",
                      blurb: "Offline depth and CA familiarity vs cloud automation and bank feeds.",
                    },
                    {
                      slugs: ["busy-accounting", "marg-erp"],
                      title: "Busy vs Marg ERP 9+",
                      blurb: "Affordable distribution accounting vs batch-heavy pharma and FMCG.",
                    },
                    {
                      slugs: ["vyapar", "zoho-books"],
                      title: "Vyapar vs Zoho Books",
                      blurb: "Phone-first invoicing vs a fuller cloud books stack.",
                    },
                  ].map((item, index) => (
                    <button
                      key={item.slugs.join("-")}
                      type="button"
                      className="path-card compare-popular__card"
                      onClick={() => loadPopular(item.slugs)}
                    >
                      <span className="path-card__index mono">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="compare-popular__body">
                        <div className="compare-popular__names row gap-8">
                          {item.slugs.map((slug, productIndex) => {
                            const product = catalog.find((p) => p.slug === slug);
                            return (
                              <span key={slug} className="row gap-8 compare-popular__product">
                                {productIndex > 0 ? (
                                  <span className="compare-popular__vs muted" aria-hidden="true">
                                    vs
                                  </span>
                                ) : null}
                                <span
                                  className={`swlogo swlogo--sm ${slug.split("-")[0]}`}
                                  aria-hidden="true"
                                >
                                  {product?.mono || slug[0].toUpperCase()}
                                </span>
                                <b>{product?.name || slug}</b>
                              </span>
                            );
                          })}
                        </div>
                        <p className="muted tiny compare-popular__blurb">{item.blurb}</p>
                      </div>
                      <span className="path-card__go">
                        Load comparison
                        <ChevronIcon />
                      </span>
                    </button>
                  ))}
            </div>
            <p className="tiny muted compare-popular__foot">
              Curated pairings for India MSME accounting software.{" "}
              <Link href="/compare/tally-prime-vs-zoho-books">Read the flagship Tally vs Zoho article</Link>.
            </p>
          </div>

          <div id="compare-matrix" className="compare-results">
            {loading ? (
              <p className="compare-empty muted" role="status">
                Loading comparison matrix…
              </p>
            ) : matrix && showMatrix ? (
              <CompareMatrix
                matrix={matrix}
                onRemove={removeBySlug}
                onMove={moveBySlug}
              />
            ) : (
              <p className="compare-empty muted" role="status">
                Your comparison table appears here once you select two or more products.
              </p>
            )}
          </div>
        </div>
      </section>

      {showMatrix ? (
        <div className="compare-bar" role="region" aria-label="Compare actions">
          <div className="container compare-bar__inner row between gap-12">
            <span className="tiny">
              Comparing <b>{selectedSlugs.length}</b> products
            </span>
            <button type="button" className="btn btn--primary btn--sm" onClick={scrollToMatrix}>
              View table
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

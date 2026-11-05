"use client";

import Link from "next/link";

type Props = {
  href: string;
  selected: boolean;
  label: string;
  count?: number;
};

function closeParentFacet(link: HTMLAnchorElement) {
  const facet = link.closest("details.catalog-facet");
  if (facet instanceof HTMLDetailsElement) {
    facet.open = false;
  }
}

export function CatalogOptionLink({ href, selected, label, count }: Props) {
  return (
    <Link
      href={href}
      className="catalog-opt"
      aria-current={selected ? "true" : undefined}
      onClick={(event) => closeParentFacet(event.currentTarget)}
    >
      <span className="catalog-opt__label">{label}</span>
      {count !== undefined ? (
        <span className="catalog-opt__count" aria-label={`${count} products`}>
          {count}
        </span>
      ) : null}
      <span className="catalog-opt__indicator" aria-hidden="true" />
    </Link>
  );
}

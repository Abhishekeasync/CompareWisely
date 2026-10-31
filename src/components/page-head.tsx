import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronIcon } from "./icons";

export function PageHead({
  eyebrow,
  title,
  lead,
  current,
  variant,
  after,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  current?: string;
  variant?: "catalog";
  after?: ReactNode;
}) {
  return (
    <div className={`pagehead${variant === "catalog" ? " pagehead--catalog" : ""}`}>
      <div className="container">
        {current ? (
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <ChevronIcon />
            <span>{current}</span>
          </nav>
        ) : null}
        {eyebrow ? <span className={`eyebrow${current ? " eyebrow--after" : ""}`}>{eyebrow}</span> : null}
        <h1 className="page-title">{title}</h1>
        {lead ? <p className="lead">{lead}</p> : null}
        {after}
      </div>
    </div>
  );
}

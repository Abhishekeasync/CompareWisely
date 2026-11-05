"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV } from "@/lib/catalog";
import { MenuIcon } from "./icons";
import { SiteBrand } from "./site-brand";

type Props = {
  drawerOpen: boolean;
  onToggleDrawer: () => void;
};

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ drawerOpen, onToggleDrawer }: Props) {
  const pathname = usePathname();
  const onQuiz = pathname === "/find-your-best-fit";

  return (
    <header className="nav">
      <div className="container nav__inner">
        <div className="nav__cluster">
          <SiteBrand />
          <nav className="nav__links" aria-label="Primary">
            {PRIMARY_NAV.map((item) => {
              const current = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  className="nav__link"
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="nav__actions">
          <Link
            className="btn btn--primary btn--sm nav__cta"
            href="/find-your-best-fit"
            aria-current={onQuiz ? "page" : undefined}
          >
            Find your best fit
          </Link>
          <button
            className="icon-btn nav__hamburger"
            type="button"
            aria-expanded={drawerOpen}
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            onClick={onToggleDrawer}
          >
            <MenuIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

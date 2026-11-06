"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, AdminSignOut, isAdminNavActive } from "@/components/admin/admin-nav";
import { PRIMARY_NAV } from "@/lib/catalog";
import { isAdminPath } from "@/lib/site";
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
  const onAdmin = isAdminPath(pathname);
  const onAdminApp = onAdmin && pathname !== "/admin/login";
  const onQuiz = pathname === "/find-your-best-fit";

  return (
    <header className={`nav${onAdmin ? " nav--admin" : ""}`}>
      <div className="container nav__inner">
        <div className="nav__cluster">
          <SiteBrand href={onAdminApp ? "/admin" : "/"} />
          {onAdminApp ? (
            <nav className="nav__links" aria-label="Operations">
              {ADMIN_NAV.map((item) => {
                const current = isAdminNavActive(pathname, item.href);
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
          ) : onAdmin ? (
            <span className="nav__admin-mark">Operations</span>
          ) : (
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
          )}
        </div>
        {onAdminApp ? (
          <div className="nav__actions">
            <AdminSignOut />
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
        ) : onAdmin ? null : (
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
        )}
      </div>
    </header>
  );
}

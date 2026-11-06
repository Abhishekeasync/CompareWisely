"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, AdminSignOut, isAdminNavActive } from "@/components/admin/admin-nav";
import { PRIMARY_NAV } from "@/lib/catalog";
import { isAdminPath } from "@/lib/site";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MobileDrawer({ open, onClose }: Props) {
  const pathname = usePathname();
  if (!open) return null;

  const onAdminApp = isAdminPath(pathname) && pathname !== "/admin/login";

  return (
    <div className="drawer" data-open="true">
      <button className="drawer__scrim" type="button" aria-label="Close menu" onClick={onClose} />
      <nav className="drawer__panel" aria-label="Mobile">
        <p className="menu__label">{onAdminApp ? "Operations" : "Menu"}</p>
        {onAdminApp
          ? ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                className="drawer__link"
                href={item.href}
                aria-current={isAdminNavActive(pathname, item.href) ? "page" : undefined}
                onClick={onClose}
              >
                {item.label}
              </Link>
            ))
          : PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                className="drawer__link"
                href={item.href}
                aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
                onClick={onClose}
              >
                {item.label}
              </Link>
            ))}
        {onAdminApp ? (
          <AdminSignOut className="nav__out drawer__out" onAfter={onClose} />
        ) : (
          <Link className="btn btn--primary" href="/find-your-best-fit" onClick={onClose}>
            Find your best fit
          </Link>
        )}
      </nav>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV } from "@/lib/catalog";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MobileDrawer({ open, onClose }: Props) {
  const pathname = usePathname();
  if (!open) return null;

  return (
    <div className="drawer" data-open="true">
      <button className="drawer__scrim" type="button" aria-label="Close menu" onClick={onClose} />
      <nav className="drawer__panel" aria-label="Mobile">
        <p className="menu__label">Menu</p>
        {PRIMARY_NAV.map((item) => (
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
        <Link className="btn btn--primary" href="/find-your-best-fit" onClick={onClose}>
          Find your best fit
        </Link>
      </nav>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/software", label: "Software" },
  { href: "/admin/comparisons", label: "Comparisons" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/comments", label: "Comments" },
  // { href: "/admin/audit-logs", label: "Audit" },
] as const;

export function isAdminNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSignOut({
  className,
  onAfter,
}: {
  className?: string;
  onAfter?: () => void;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/v1/admin/auth/logout", { method: "POST" });
    onAfter?.();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button type="button" className={className ?? "nav__out"} onClick={handleLogout}>
      Sign out
    </button>
  );
}

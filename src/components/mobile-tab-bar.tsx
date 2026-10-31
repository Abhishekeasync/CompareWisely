"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BlogIcon, CompareIcon, HomeIcon, TargetIcon, UpdatesIcon } from "./icons";

const TABS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/compare", label: "Compare", icon: CompareIcon },
  { href: "/blog", label: "Blog", icon: BlogIcon },
  { href: "/finance-updates", label: "Updates", icon: UpdatesIcon },
  { href: "/find-your-best-fit", label: "Best fit", icon: TargetIcon },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="tabbar" aria-label="Mobile sections">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const current = tab.href === "/" ? pathname === "/" : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link key={tab.href} className="tabbar__item" href={tab.href} aria-current={current ? "page" : undefined}>
            <Icon />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

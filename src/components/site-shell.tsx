"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { MobileTabBar } from "./mobile-tab-bar";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

const MobileDrawer = dynamic(
  () => import("./mobile-drawer").then((m) => ({ default: m.MobileDrawer })),
  { ssr: false },
);

export function SiteShell({ year, children }: { year: number; children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    if (drawerOpen) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.body.style.overflow = "";
    }
    return () => {
      lenis?.start();
      document.body.style.overflow = "";
    };
  }, [drawerOpen, lenis]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader drawerOpen={drawerOpen} onToggleDrawer={() => setDrawerOpen((open) => !open)} />
      {drawerOpen ? <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} /> : null}
      <main id="main">{children}</main>
      <SiteFooter year={year} />
      <MobileTabBar />
    </>
  );
}

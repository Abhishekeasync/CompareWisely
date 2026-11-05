"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import "lenis/dist/lenis.css";

interface SmoothScrollProviderProps {
  children: ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const pathname = usePathname();
  const lenisRef = useRef<any>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Monitor prefers-reduced-motion media query
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduceMotion(mediaQuery.matches);
    updateMotion();

    mediaQuery.addEventListener("change", updateMotion);
    return () => mediaQuery.removeEventListener("change", updateMotion);
  }, []);

  // Reset scroll to top on pathname change (route transitions) unless hash is present
  useEffect(() => {
    if (typeof window !== "undefined" && !window.location.hash) {
      lenisRef.current?.lenis?.scrollTo(0, { immediate: true });
    }
  }, [pathname]);

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        duration: reduceMotion ? 0 : 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: !reduceMotion,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.0,
        syncTouch: false, // Preserve 100% native momentum on mobile touchscreens
        allowNestedScroll: true,
        autoRaf: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}

export { useLenis };


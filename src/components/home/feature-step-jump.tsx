"use client";

import type { ReactNode } from "react";
import { useLenis } from "lenis/react";

export function FeatureStepJump({
  index,
  total,
  children,
}: {
  index: number;
  total: number;
  children: ReactNode;
}) {
  const lenis = useLenis();

  return (
    <button
      type="button"
      className="feat-stage__hit"
      onClick={() => {
        const track = document.querySelector(".feat-stage__track");
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const wide = window.matchMedia("(min-width: 900px) and (min-height: 700px)").matches;
        if (!(track instanceof HTMLElement) || !wide || reduce) {
          const targetEl = document.getElementById(`feature-step-${index}`);
          if (targetEl) {
            if (lenis && !reduce) {
              lenis.scrollTo(targetEl, { duration: 0.9 });
            } else {
              targetEl.scrollIntoView({
                block: "start",
                behavior: reduce ? "auto" : "smooth",
              });
            }
          }
          return;
        }
        const scrollable = Math.max(0, track.offsetHeight - window.innerHeight);
        const top = track.getBoundingClientRect().top + window.scrollY;
        const targetPos = top + (scrollable * (index + 0.12)) / total;
        if (lenis && !reduce) {
          lenis.scrollTo(targetPos, { duration: 0.9 });
        } else {
          window.scrollTo({
            top: targetPos,
            behavior: reduce ? "auto" : "smooth",
          });
        }
      }}
    >
      {children}
    </button>
  );
}

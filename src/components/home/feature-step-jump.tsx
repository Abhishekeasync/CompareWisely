"use client";

import type { ReactNode } from "react";

export function FeatureStepJump({
  index,
  total,
  children,
}: {
  index: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="feat-stage__hit"
      onClick={() => {
        const track = document.querySelector(".feat-stage__track");
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const wide = window.matchMedia("(min-width: 900px) and (min-height: 700px)").matches;
        if (!(track instanceof HTMLElement) || !wide || reduce) {
          document.getElementById(`feature-step-${index}`)?.scrollIntoView({
            block: "start",
            behavior: reduce ? "auto" : "smooth",
          });
          return;
        }
        const scrollable = Math.max(0, track.offsetHeight - window.innerHeight);
        const top = track.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: top + (scrollable * (index + 0.12)) / total,
          behavior: "smooth",
        });
      }}
    >
      {children}
    </button>
  );
}

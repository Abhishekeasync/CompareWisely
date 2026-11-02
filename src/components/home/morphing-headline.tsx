"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PRODUCT_LOGOS } from "@/lib/product-logos";

const PILL_IN = [
  { label: "Tally", logo: PRODUCT_LOGOS.tally, delay: "80ms" },
  { label: "Zoho", logo: PRODUCT_LOGOS.zoho, delay: "280ms" },
] as const;

const CYCLE = [
  { label: "Easync", logo: PRODUCT_LOGOS.easync },
  { label: "Busy", logo: PRODUCT_LOGOS.busy },
  { label: "Vyapar", logo: PRODUCT_LOGOS.vyapar },
  { label: "Marg", logo: PRODUCT_LOGOS.marg },
  { label: "Odoo", logo: PRODUCT_LOGOS.odoo },
] as const;

function PillMark({ logo }: { logo: string }) {
  return <img className="hero-pill__logo" src={logo} alt="" />;
}

export function MorphingHeadline() {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(true);
  const [width, setWidth] = useState<number>();
  const pillRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const paused = useRef(false);
  const item = CYCLE[index];

  useLayoutEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;

    const measure = () => {
      const previous = pill.style.width;
      pill.style.width = "max-content";
      const next = Math.ceil(pill.getBoundingClientRect().width);
      pill.style.width = previous;
      setWidth(next);
    };

    measure();
    let cancelled = false;
    const img = pill.querySelector("img");
    const onLoad = () => {
      if (!cancelled) measure();
    };
    img?.addEventListener("load", onLoad);
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
      img?.removeEventListener("load", onLoad);
    };
  }, [index]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    let swapTimer = 0;
    const step = () => {
      if (paused.current) return;
      setShown(false);
      swapTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % CYCLE.length);
        setShown(true);
      }, 220);
    };

    const interval = window.setInterval(step, 2600);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(swapTimer);
    };
  }, []);

  return (
    <h1>
      <span className="sr-only">Compare Tally, Zoho and Easync Books in one view.</span>
      <span aria-hidden="true">
        {[
          "Compare ",
          <span key="tally" className="hero-pill" style={{ animationDelay: PILL_IN[0].delay }}>
            <PillMark logo={PILL_IN[0].logo} />
          </span>,
          ", ",
          <span key="zoho" className="hero-pill" style={{ animationDelay: PILL_IN[1].delay }}>
            <PillMark logo={PILL_IN[1].logo} />
          </span>,
          " ",
          <br key="break" className="hero__break" />,
          "and ",
          <span
            key="cycle"
            ref={pillRef}
            className="hero-pill hero-pill--morph"
            style={{ animationDelay: "520ms", width: width ? `${width}px` : undefined }}
            onMouseEnter={() => {
              paused.current = true;
            }}
            onMouseLeave={() => {
              paused.current = false;
            }}
          >
            <span ref={innerRef} className="hero-pill__swap" data-state={shown ? "in" : "out"}>
              <PillMark logo={item.logo} />
            </span>
          </span>,
          " in one view.",
        ]}
      </span>
    </h1>
  );
}

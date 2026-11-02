"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { ChevronIcon } from "@/components/icons";
import { AsterDiceHeading } from "@/components/home/aster-dice-heading";
import {
  ComparisonGlanceMatrix,
  type ComparisonGlance,
} from "@/components/home/comparison-glance";

export type { ComparisonGlance };

function stageRange(track: HTMLElement) {
  const nav = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 0;
  const pin = track.querySelector(".feat-stage__pin");
  const pinHeight = pin instanceof HTMLElement ? pin.offsetHeight : window.innerHeight - nav;
  const scrollable = Math.max(0, track.offsetHeight - pinHeight);
  const origin = track.getBoundingClientRect().top + window.scrollY - nav;
  const passed = Math.min(Math.max(window.scrollY - origin, 0), scrollable);
  return { scrollable, origin, passed };
}

type Feature = {
  id: string;
  index: string;
  label: string;
  title: string;
  body: string;
  href: string;
  action: string;
};

const NOTES = [
  {
    kicker: "GST · 12 min",
    title: "GSTR-2B reconciliation",
    body: "How Tally, Zoho and Busy treat purchase reconciliation when 2B and the books disagree.",
  },
  {
    kicker: "CBIC",
    title: "E-invoicing in 2026",
    body: "The turnover threshold note. Confirm the live rule before a filing process changes.",
  },
] as const;

const QUIZ_ASKS = [
  ["Business scale", "Sole operator to a 50+ team"],
  ["Industry", "Trading to distribution"],
  ["Budget", "Under ₹6,000 a year, or open"],
  ["Team seats", "One seat to twenty or more"],
  ["Invoices and banking", "Volume and bank accounts"],
  ["Must-have capabilities", "GST, inventory, cloud, payroll"],
] as const;

function featuresFor(comparison: ComparisonGlance): Feature[] {
  return [
    {
      id: "fit",
      index: "01",
      label: "Fit",
      title: "Six questions, one named product",
      body: "An MSME owner names scale, industry, budget, seats, invoice volume, and the capabilities they will not drop. The result names a product and the trade-off.",
      href: "/find-your-best-fit",
      action: "Start the quiz",
    },
    {
      id: "compare",
      index: "02",
      label: "Compare",
      title: "Tally against Zoho",
      body: "A chartered accountant sets offline inventory and the familiar workflow next to cloud bank feeds and mobile access.",
      href: comparison.href,
      action: "Open the comparison",
    },
    {
      id: "notes",
      index: "03",
      label: "Notes",
      title: "Check the compliance notes",
      body: "A finance team reads the e-invoicing and filing notes, then confirms the live rule before a process changes.",
      href: "/finance-updates",
      action: "Read the note",
    },
  ];
}

function FeatureVisual({ feature, comparison }: { feature: Feature; comparison: ComparisonGlance }) {
  if (feature.id === "compare") {
    return (
      <div className="feat-card">
        <h3>{comparison.title}</h3>
        <ComparisonGlanceMatrix
          title={comparison.title}
          products={comparison.products}
          sections={comparison.sections}
          previewRows={4}
        />
        <Link className="path-card__go feat-card__more" href={comparison.href}>
          View more
          <ChevronIcon />
        </Link>
      </div>
    );
  }

  if (feature.id === "notes") {
    return (
      <div className="feat-card">
        <h3>Confirm the rule, then the process</h3>
        <div className="feat-card__notes">
          {NOTES.map((note) => (
            <div key={note.title}>
              <span>{note.kicker}</span>
              <b>{note.title}</b>
              <p>{note.body}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="feat-card">
      <h3>What the quiz asks</h3>
      <ol className="feat-asks">
        {QUIZ_ASKS.map(([name, detail], index) => (
          <li key={name}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <b>{name}</b>
              <p>{detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function FeatureStage({ comparison }: { comparison: ComparisonGlance }) {
  const features = featuresFor(comparison);
  const trackRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [active, setActive] = useState(0);
  const [segment, setSegment] = useState(0);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 900px) and (min-height: 700px)");
    const sync = () => setLive(wide.matches && !reduce.matches);
    sync();
    wide.addEventListener("change", sync);
    reduce.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      reduce.removeEventListener("change", sync);
    };
  }, []);

  useLayoutEffect(() => {
    if (!live) return;
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const { scrollable, passed } = stageRange(track);
      const ratio = scrollable <= 0 ? 0 : passed / scrollable;
      const scaled = ratio * features.length;
      const index = Math.min(features.length - 1, Math.floor(scaled));
      const local = index === features.length - 1 ? 1 : scaled - index;
      setActive(index);
      setSegment(local);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [live, features.length]);

  function select(index: number) {
    if (!live || !trackRef.current) {
      setActive(index);
      return;
    }
    const track = trackRef.current;
    const { scrollable, origin } = stageRange(track);
    const target = origin + (scrollable * (index + 0.04)) / features.length;
    window.scrollTo({ top: target, behavior: "smooth" });
  }

  function fillFor(index: number) {
    if (!live) return index === active ? 1 : 0;
    if (index < active) return 1;
    if (index > active) return 0;
    return Math.min(1, segment);
  }

  return (
    <section className={`feat-stage${live ? " is-live" : ""}`} aria-labelledby="roles-heading">
      <div className="container">
        <header className="feat-stage__intro">
          <AsterDiceHeading id="roles-heading" text="Start from the decision" />
          <p>Same catalog. Three entries, depending on who is choosing.</p>
        </header>
        <div className="feat-stage__track" ref={trackRef}>
          <div className="feat-stage__pin">
            <ol className="feat-stage__list">
              {features.map((feature, index) => (
                <li key={feature.id} className={`feat-stage__item${index === active ? " is-active" : ""}`}>
                  <span className="feat-stage__rail" aria-hidden="true">
                    <i style={{ transform: `scaleY(${fillFor(index)})` }} />
                  </span>
                  <button
                    type="button"
                    className="feat-stage__hit"
                    aria-pressed={index === active}
                    aria-controls={`feature-copy-${feature.id}`}
                    onClick={() => select(index)}
                  >
                    <span className="feat-stage__kicker">
                      <span className="feat-stage__index">{feature.index}</span>
                      {feature.label}
                    </span>
                    <span className="feat-stage__title">{feature.title}</span>
                  </button>
                  <div className="feat-stage__copy" id={`feature-copy-${feature.id}`}>
                    <div className="feat-stage__copy-inner">
                      <p>{feature.body}</p>
                      <Link className="feat-stage__go" href={feature.href}>
                        {feature.action}
                        <ChevronIcon />
                      </Link>
                    </div>
                  </div>
                  <div className="feat-stage__inline">
                    <FeatureVisual feature={feature} comparison={comparison} />
                  </div>
                </li>
              ))}
            </ol>

            <div className="feat-stage__canvas" aria-hidden="true" inert>
              {features.map((feature, index) => (
                <div key={feature.id} className={`feat-stage__canvas-item${index === active ? " is-on" : ""}`}>
                  <FeatureVisual feature={feature} comparison={comparison} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

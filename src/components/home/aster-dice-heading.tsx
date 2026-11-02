"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const STAGGER_MS = 46;
const ROLL_MS = 920;
const ROLL_EASING = "cubic-bezier(0.34, 1.18, 0.64, 1)";

export function AsterDiceHeading({
  id,
  text,
  className,
}: {
  id?: string;
  text: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const words = text.split(" ");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(reduce.matches);
    sync();
    reduce.addEventListener("change", sync);
    return () => reduce.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;
    const animations: Animation[] = [];
    const timers: number[] = [];

    const run = () => {
      if (cancelled) return;
      const prisms = root.querySelectorAll<HTMLElement>(".aster-dice__prism");
      prisms.forEach((prism, index) => {
        const cell = prism.parentElement;
        const sizer = cell?.querySelector<HTMLElement>(".aster-dice__sizer");
        const delay = index * STAGGER_MS;

        const start = () => {
          if (cancelled) return;
          if (sizer) sizer.style.visibility = "hidden";
          prism.style.visibility = "visible";
          const anim = prism.animate(
            [{ transform: "rotateX(-270deg)" }, { transform: "rotateX(0deg)" }],
            {
              duration: ROLL_MS,
              easing: ROLL_EASING,
              fill: "forwards",
            },
          );
          animations.push(anim);
        };

        if (delay === 0) start();
        else timers.push(window.setTimeout(start, delay));
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        run();
        observer.disconnect();
      },
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" },
    );

    observer.observe(root);
    return () => {
      cancelled = true;
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
      animations.forEach((anim) => anim.cancel());
    };
  }, [reduceMotion, text]);

  if (reduceMotion) {
    return (
      <h2 id={id} className={className}>
        {text}
      </h2>
    );
  }

  let charOffset = 0;

  return (
    <h2 id={id} className={className} ref={rootRef}>
      <span className="sr-only">{text}</span>
      <span className="aster-dice" aria-hidden="true">
        {words.map((word, wordIndex) => {
          const wordStart = charOffset;
          charOffset += word.length;

          return (
            <span key={`${word}-${wordIndex}`} className="aster-dice__word">
              {[...word].map((char, charIndex) => (
                <span key={`${char}-${charIndex}`} className="aster-dice__cell">
                  <span className="aster-dice__sizer">{char}</span>
                  <span className="aster-dice__prism" style={{ "--dice-i": wordStart + charIndex } as CSSProperties}>
                    {Array.from({ length: 4 }, (_, face) => (
                      <span key={face} className="aster-dice__face">
                        {char}
                      </span>
                    ))}
                  </span>
                </span>
              ))}
              {wordIndex < words.length - 1 ? <span className="aster-dice__space"> </span> : null}
            </span>
          );
        })}
      </span>
    </h2>
  );
}

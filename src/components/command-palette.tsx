"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { SEARCH_INDEX, type SearchItem } from "@/lib/catalog";
import { KindIcon, SearchIcon } from "./icons";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CommandPalette({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_INDEX.slice(0, 7);
    return SEARCH_INDEX.filter((item) =>
      `${item.title} ${item.subtitle} ${item.group}`.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  function move(delta: number) {
    if (!results.length) return;
    setCursor((current) => (current + delta + results.length) % results.length);
  }

  let lastGroup = "";

  return (
    <div className="cmdk" data-open="true" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button className="cmdk__scrim" type="button" aria-label="Close search" onClick={onClose} />
      <div className="cmdk__box">
        <div className="cmdk__input">
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            placeholder="Search comparisons, blogs, updates…"
            aria-label="Search query"
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                move(1);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                move(-1);
              } else if (event.key === "Enter") {
                event.preventDefault();
                const item = results[cursor];
                if (item?.href) {
                  onClose();
                  router.push(item.href);
                }
              }
            }}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="cmdk__results" id={titleId} data-lenis-prevent>
          {results.length === 0 ? (
            <div className="cmdk__empty">No results for “{query.trim()}”. Try “Tally”, “GST” or “e-invoice”.</div>
          ) : (
            results.map((item, index) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              return (
                <ResultRow
                  key={`${item.group}-${item.title}`}
                  item={item}
                  showGroup={showGroup}
                  active={index === cursor}
                  onClose={onClose}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ResultRow({
  item,
  showGroup,
  active,
  onClose,
}: {
  item: SearchItem;
  showGroup: boolean;
  active: boolean;
  onClose: () => void;
}) {
  const body = (
    <>
      {showGroup ? <div className="cmdk__group">{item.group}</div> : null}
      {item.href ? (
        <Link className={`cmdk__item${active ? " is-cursor" : ""}`} href={item.href} onClick={onClose}>
          <span className="menu__ic">
            <KindIcon kind={item.kind} />
          </span>
          <span className="grow">
            <b>{item.title}</b>
            <span>{item.subtitle}</span>
          </span>
          <kbd>↵</kbd>
        </Link>
      ) : (
        <div className={`cmdk__item${active ? " is-cursor" : ""}`} aria-disabled="true">
          <span className="menu__ic">
            <KindIcon kind={item.kind} />
          </span>
          <span className="grow">
            <b>{item.title}</b>
            <span>{item.subtitle}</span>
          </span>
        </div>
      )}
    </>
  );
  return body;
}

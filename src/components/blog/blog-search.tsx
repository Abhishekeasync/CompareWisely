"use client";

import { SearchIcon } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";

export function BlogSearch({
  search,
  category,
  basePath = "/blog",
}: {
  search: string;
  category?: string;
  basePath?: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const [value, setValue] = useState(search);
  const [trackedSearch, setTrackedSearch] = useState(search);
  const [pending, startTransition] = useTransition();

  if (trackedSearch !== search) {
    setTrackedSearch(search);
    setValue(search);
  }

  useEffect(() => {
    const next = value.trim();
    if (next === search) return;

    const handle = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (next) params.set("search", next);
      if (category) params.set("category", category);
      const href = params.size ? `${basePath}?${params.toString()}` : basePath;
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    }, 220);

    return () => window.clearTimeout(handle);
  }, [value, search, category, basePath, router]);

  return (
    <form className="blog-search" action={basePath} method="get" role="search">
      {category ? <input type="hidden" name="category" value={category} /> : null}
      <label className="sr-only" htmlFor={inputId}>
        Search articles
      </label>
      <SearchIcon />
      <input
        id={inputId}
        name="search"
        type="search"
        value={value}
        placeholder="Search by title or topic..."
        autoComplete="off"
        enterKeyHint="search"
        maxLength={120}
        aria-busy={pending || undefined}
        onChange={(event) => setValue(event.target.value)}
      />
      {value ? (
        <button type="button" className="blog-search__clear" onClick={() => setValue("")}>
          Clear
        </button>
      ) : null}
    </form>
  );
}

export const BLOG_PAGE_SIZE = 9;
const FIRST_PAGE_COUNT = BLOG_PAGE_SIZE + 1;

export function readingMinutesFromChars(chars: number): number {
  if (!Number.isFinite(chars) || chars <= 0) return 1;
  const words = Math.max(1, Math.round(chars / 5));
  return Math.max(1, Math.round(words / 200));
}

export function blogPageCount(total: number): number {
  if (total <= 0) return 0;
  if (total <= FIRST_PAGE_COUNT) return 1;
  return 1 + Math.ceil((total - FIRST_PAGE_COUNT) / BLOG_PAGE_SIZE);
}

export function blogSlice(page: number): { limit: number; offset: number; featured: boolean } {
  const safe = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  if (safe === 1) {
    return { limit: FIRST_PAGE_COUNT, offset: 0, featured: true };
  }
  return {
    limit: BLOG_PAGE_SIZE,
    offset: FIRST_PAGE_COUNT + (safe - 2) * BLOG_PAGE_SIZE,
    featured: false,
  };
}

export function blogPageNumbers(current: number, totalPages: number): Array<number | "gap"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const sequence: Array<number | "gap"> = [];

  for (const page of sorted) {
    const previous = sequence[sequence.length - 1];
    if (typeof previous === "number" && page - previous > 1) sequence.push("gap");
    sequence.push(page);
  }

  return sequence;
}

export function parseBlogQuery(input: { search?: string; category?: string; page?: string }) {
  const search = (input.search ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 120);
  const rawCategory = (input.category ?? "").trim().toLowerCase();
  const category = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawCategory) ? rawCategory : undefined;
  const parsed = Number.parseInt(input.page ?? "1", 10);
  const page = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 500) : 1;
  return { search, category, page };
}

export function blogHref(options: {
  base?: string;
  search?: string;
  category?: string;
  page?: number;
  hash?: boolean;
}): string {
  const params = new URLSearchParams();
  const search = options.search?.trim();
  if (search) params.set("search", search);
  if (options.category) params.set("category", options.category);
  if (options.page && options.page > 1) params.set("page", String(options.page));
  const query = params.toString();
  const base = options.base || "/blog";
  const path = query ? `${base}?${query}` : base;
  return options.hash ? `${path}#articles` : path;
}

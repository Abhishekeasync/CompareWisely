import { SOFTWARE, SOFTWARE_BY_ID, type SoftwareId } from "./catalog";
import { MAX_COMPARE_PRODUCTS, MIN_COMPARE_PRODUCTS } from "./compare-data";

const ID_SET = new Set(SOFTWARE.map((item) => item.id));

export function isSoftwareId(value: string): value is SoftwareId {
  return ID_SET.has(value as SoftwareId);
}

export function parseProductIds(raw: string | null | undefined): SoftwareId[] {
  if (!raw?.trim()) return [];
  const seen = new Set<SoftwareId>();
  const ids: SoftwareId[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim();
    if (!isSoftwareId(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_COMPARE_PRODUCTS) break;
  }
  return ids;
}

export function serializeProductIds(ids: SoftwareId[]): string {
  return ids.join(",");
}

export function canCompare(ids: SoftwareId[]): boolean {
  return ids.length >= MIN_COMPARE_PRODUCTS && ids.length <= MAX_COMPARE_PRODUCTS;
}

export function addProductId(ids: SoftwareId[], id: SoftwareId): SoftwareId[] {
  if (ids.includes(id) || ids.length >= MAX_COMPARE_PRODUCTS) return ids;
  return [...ids, id];
}

export function removeProductId(ids: SoftwareId[], id: SoftwareId): SoftwareId[] {
  return ids.filter((item) => item !== id);
}

export function moveProductId(ids: SoftwareId[], id: SoftwareId, direction: -1 | 1): SoftwareId[] {
  const index = ids.indexOf(id);
  if (index < 0) return ids;
  const target = index + direction;
  if (target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function resolveProducts(ids: SoftwareId[]) {
  return ids.map((id) => SOFTWARE_BY_ID[id]).filter(Boolean);
}

export function filterSoftware(query: string, exclude: SoftwareId[]) {
  const q = query.trim().toLowerCase();
  const blocked = new Set(exclude);
  return SOFTWARE.filter((item) => {
    if (blocked.has(item.id)) return false;
    if (!q) return true;
    return `${item.name} ${item.why} ${item.price}`.toLowerCase().includes(q);
  });
}

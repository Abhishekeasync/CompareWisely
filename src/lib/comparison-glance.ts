import type { DynamicMatrixCategory, DynamicMatrixCell } from "@/lib/types/comparison";

export type ComparisonGlanceProduct = {
  name: string;
  price: string;
  logo: string | null;
  tagline?: string;
  mono?: string;
  swClass?: string;
};

export type ComparisonGlanceRow = {
  id: string;
  name: string;
  values: string[];
  differs: boolean;
  long?: boolean;
};

export type ComparisonGlanceSection = {
  id: string;
  name: string;
  rows: ComparisonGlanceRow[];
};

export type ComparisonGlance = {
  title: string;
  href: string;
  products: ComparisonGlanceProduct[];
  sections: ComparisonGlanceSection[];
};

export function formatMatrixCellLabel(cell: DynamicMatrixCell | undefined): string {
  if (!cell || cell.valueKind === "UNKNOWN") return "—";
  if (cell.valueKind === "YES") return cell.textValue?.trim() ? cell.textValue : "Yes";
  if (cell.valueKind === "NO") return cell.textValue?.trim() ? cell.textValue : "No";
  if (cell.valueKind === "UNAVAILABLE") return cell.textValue?.trim() ? cell.textValue : "Not listed";
  if (cell.valueKind === "PARTIAL") return cell.textValue?.trim() ? cell.textValue : "Partial";
  if (cell.valueKind === "PAID_ADDON") return cell.textValue?.trim() ? cell.textValue : "Paid Add-on";
  return cell.textValue?.trim() || "—";
}

export function buildComparisonGlanceSections(
  categories: DynamicMatrixCategory[],
  productSlugs: string[],
): ComparisonGlanceSection[] {
  return categories
    .map((category) => ({
      id: String(category.id),
      name: category.name,
      rows: category.features.map((feature) => {
        const values = productSlugs.map((slug) => formatMatrixCellLabel(feature.values[slug]));
        const long =
          feature.dataType === "TEXT" ||
          feature.code === "starting_price" ||
          feature.code === "best_when" ||
          values.some((value) => value.length > 22 || (value.includes(" ") && value.length > 14));
        return {
          id: String(feature.id),
          name: feature.name,
          values,
          differs: feature.isDifferent,
          long,
        };
      }),
    }))
    .filter((section) => section.rows.length > 0);
}

export function buildLeadComparisonGlance(input: {
  title: string;
  href: string;
  products: ComparisonGlanceProduct[];
  categories: DynamicMatrixCategory[];
  productSlugs: string[];
}): ComparisonGlance {
  return {
    title: input.title,
    href: input.href,
    products: input.products,
    sections: buildComparisonGlanceSections(input.categories, input.productSlugs),
  };
}

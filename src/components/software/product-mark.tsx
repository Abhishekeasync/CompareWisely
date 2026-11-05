import {
  resolveSoftwareProductLogo,
  softwareSwClassFromSlug,
} from "@/lib/product-logos";

type Props = {
  slug: string;
  name: string;
  mono?: string | null;
  logoUrl?: string | null;
  size?: "sm" | "lg";
};

export function SoftwareProductMark({ slug, name, mono, logoUrl, size = "lg" }: Props) {
  const logo = resolveSoftwareProductLogo(slug, logoUrl);
  const swClass = softwareSwClassFromSlug(slug);
  const monoLabel = mono || name[0] || "?";

  if (logo) {
    return (
      <span className={`software-mark software-mark--${size}`}>
        <img src={logo} alt="" />
      </span>
    );
  }

  return (
    <span
      className={`swlogo ${size === "lg" ? "swlogo--lg" : "swlogo--sm"} ${swClass}`.trim()}
      aria-hidden="true"
    >
      {monoLabel}
    </span>
  );
}

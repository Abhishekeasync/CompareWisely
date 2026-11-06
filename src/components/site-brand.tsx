import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

const LOGO = {
  src: "/Logo/Comapre-Wisely-2.png",
  width: 640,
  height: 276,
  aspect: 640 / 276,
} as const;

type SiteBrandProps = {
  className?: string;
  /** Nav uses shell height tokens; footer uses a larger mark. */
  tone?: "nav" | "footer";
  href?: string;
};

export function SiteBrand({ className, tone = "nav", href = "/" }: SiteBrandProps) {
  const rootClass = ["brand", tone === "footer" ? "brand--footer" : "brand--nav", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Link className={rootClass} href={href} aria-label={`${SITE_NAME} home`}>
      <Image
        className="brand__logo"
        src={LOGO.src}
        alt=""
        width={LOGO.width}
        height={LOGO.height}
        sizes={
          tone === "footer"
            ? `(max-width: 640px) 260px, ${Math.round(LOGO.aspect * 80)}px`
            : `(max-width: 640px) 260px, (max-width: 900px) 280px, ${Math.round(LOGO.aspect * 68)}px`
        }
        quality={95}
        priority={tone === "nav"}
      />
    </Link>
  );
}

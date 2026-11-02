import Image from "next/image";

export function ArticleCover({
  src,
  alt,
  label,
  bare = false,
  priority = false,
  sizes,
  variant = "card",
}: {
  src: string | null;
  alt: string;
  label?: string;
  bare?: boolean;
  priority?: boolean;
  sizes: string;
  variant?: "card" | "feature";
}) {
  return (
    <div className={`blog-cover blog-cover--${variant}`}>
      {src ? (
        src.startsWith("/") ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className="blog-cover__img"
          />
        ) : (
          // Remote editorial URLs are author-supplied and not limited to one host.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className="blog-cover__img"
            width={variant === "feature" ? 1280 : 800}
            height={variant === "feature" ? 720 : 500}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
          />
        )
      ) : (
        <div className="blog-cover__fallback" aria-hidden="true">
          {bare || !label ? null : <span>{label}</span>}
        </div>
      )}
    </div>
  );
}

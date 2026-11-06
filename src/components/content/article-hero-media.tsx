import { ArticleImageCarousel } from "@/components/content/article-image-carousel";
import { isDirectHostedVideoUrl } from "@/lib/uploads/article-media-config";
import { normalizeArticleImageUrls } from "@/lib/uploads/article-images";

function youtubeEmbedSrc(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function ArticleHeroMedia({
  featuredImageUrl,
  imageUrls,
  videoUrl,
}: {
  featuredImageUrl?: string | null;
  imageUrls?: unknown;
  videoUrl?: string | null;
}) {
  const images = normalizeArticleImageUrls(imageUrls, featuredImageUrl);

  if (images.length === 0 && !videoUrl) return null;

  const embedSrc =
    videoUrl && !isDirectHostedVideoUrl(videoUrl) ? youtubeEmbedSrc(videoUrl) : null;
  const isHostedVideo = Boolean(videoUrl && isDirectHostedVideoUrl(videoUrl));

  return (
    <div className="stack gap-16" style={{ marginBottom: "32px" }}>
      {images.length > 0 ? <ArticleImageCarousel images={images} /> : null}

      {isHostedVideo ? (
        <div style={{ border: "1px solid var(--border)", background: "#000" }}>
          <video src={videoUrl!} controls style={{ width: "100%", maxHeight: "480px", display: "block" }} />
        </div>
      ) : embedSrc ? (
        <div
          style={{
            position: "relative",
            paddingBottom: "56.25%",
            height: 0,
            border: "1px solid var(--border)",
            background: "#000",
          }}
        >
          <iframe
            src={embedSrc}
            loading="lazy"
            title="Article video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
      ) : null}
    </div>
  );
}

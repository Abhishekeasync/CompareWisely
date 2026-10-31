/** Shared S3 + article media URL helpers. */

export function normalizeS3Prefix(prefix: string): string {
  const trimmed = prefix.trim().replace(/^\/+/, "");
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

export function getArticleMediaStorageConfig() {
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  const region = process.env.AWS_REGION?.trim() || "ap-south-1";
  const prefix = normalizeS3Prefix(process.env.AWS_S3_ARTICLE_PREFIX || "articles/");
  const publicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");

  return {
    useS3: Boolean(bucket),
    bucket: bucket ?? "",
    region,
    prefix,
    publicBaseUrl,
  };
}

export function buildPublicObjectUrl(key: string): string {
  const { bucket, region, publicBaseUrl } = getArticleMediaStorageConfig();
  if (publicBaseUrl) {
    return `${publicBaseUrl}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export function isYoutubeOrVimeoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      host.includes("youtube.com") ||
      host === "youtu.be" ||
      host.includes("vimeo.com")
    );
  } catch {
    return false;
  }
}

/** Local disk path or S3/HTTPS URL pointing at a direct video file (not YouTube/Vimeo). */
export function isDirectHostedVideoUrl(url: string): boolean {
  if (!url) return false;
  if (/^\/uploads\/articles\/[\w.-]+$/.test(url)) return true;
  if (isYoutubeOrVimeoUrl(url)) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    return /\.(mp4|webm)(\?.*)?$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

const LOCAL_ARTICLE_MEDIA_PATH = /^\/uploads\/articles\/([\w.-]+)$/;

/** URLs uploaded through this app (S3 or local disk) — safe to delete from storage. */
export function isManagedArticleMediaUrl(url: string): boolean {
  if (LOCAL_ARTICLE_MEDIA_PATH.test(url)) return true;

  const { useS3, bucket, region, prefix, publicBaseUrl } = getArticleMediaStorageConfig();
  if (!useS3) return false;

  try {
    const parsed = new URL(url);
    if (publicBaseUrl && url.startsWith(`${publicBaseUrl}/`)) {
      const key = url.slice(publicBaseUrl.length + 1);
      return key.startsWith(prefix);
    }
    const virtualHost = `${bucket}.s3.${region}.amazonaws.com`;
    if (parsed.hostname === virtualHost) {
      const key = parsed.pathname.replace(/^\//, "");
      return key.startsWith(prefix);
    }
  } catch {
    return false;
  }

  return false;
}

/** S3 object key or local filename under public/uploads/articles. */
export function resolveManagedArticleMediaTarget(url: string): { storage: "s3"; key: string } | { storage: "local"; filename: string } | null {
  const localMatch = url.match(LOCAL_ARTICLE_MEDIA_PATH);
  if (localMatch) {
    return { storage: "local", filename: localMatch[1] };
  }

  if (!isManagedArticleMediaUrl(url)) return null;

  const { publicBaseUrl, prefix } = getArticleMediaStorageConfig();
  if (publicBaseUrl && url.startsWith(`${publicBaseUrl}/`)) {
    return { storage: "s3", key: url.slice(publicBaseUrl.length + 1) };
  }

  try {
    const parsed = new URL(url);
    const key = parsed.pathname.replace(/^\//, "");
    if (key.startsWith(prefix)) {
      return { storage: "s3", key };
    }
  } catch {
    return null;
  }

  return null;
}

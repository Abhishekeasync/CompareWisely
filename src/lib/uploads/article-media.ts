import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  buildPublicObjectUrl,
  getArticleMediaStorageConfig,
  resolveManagedArticleMediaTarget,
} from "@/lib/uploads/article-media-config";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "articles");
const PUBLIC_PREFIX = "/uploads/articles";

const IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

const VIDEO_TYPES = new Map<string, string>([
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
]);

export const ARTICLE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const ARTICLE_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

let s3Client: S3Client | null = null;

function getS3Client(region: string): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({ region });
  }
  return s3Client;
}

function validateArticleMediaFile(file: File, kind: "image" | "video"): string {
  const typeMap = kind === "image" ? IMAGE_TYPES : VIDEO_TYPES;
  const ext = typeMap.get(file.type);
  if (!ext) {
    throw new Error("UNSUPPORTED_FILE_TYPE");
  }

  const maxBytes = kind === "image" ? ARTICLE_IMAGE_MAX_BYTES : ARTICLE_VIDEO_MAX_BYTES;
  if (file.size > maxBytes) {
    throw new Error("FILE_TOO_LARGE");
  }

  if (file.size === 0) {
    throw new Error("EMPTY_FILE");
  }

  return ext;
}

async function saveArticleMediaToLocal(
  buffer: Buffer,
  ext: string,
  kind: "image" | "video"
): Promise<{ url: string; kind: "image" | "video" }> {
  const filename = `${crypto.randomUUID()}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return { url: `${PUBLIC_PREFIX}/${filename}`, kind };
}

async function saveArticleMediaToS3(
  buffer: Buffer,
  ext: string,
  contentType: string,
  kind: "image" | "video"
): Promise<{ url: string; kind: "image" | "video" }> {
  const { bucket, region, prefix } = getArticleMediaStorageConfig();
  if (!bucket) {
    throw new Error("S3_NOT_CONFIGURED");
  }

  const filename = `${crypto.randomUUID()}${ext}`;
  const key = `${prefix}${filename}`;

  try {
    await getS3Client(region).send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  } catch {
    throw new Error("S3_UPLOAD_FAILED");
  }

  return { url: buildPublicObjectUrl(key), kind };
}

export async function saveArticleMediaFile(
  file: File,
  kind: "image" | "video"
): Promise<{ url: string; kind: "image" | "video" }> {
  const ext = validateArticleMediaFile(file, kind);
  const buffer = Buffer.from(await file.arrayBuffer());
  const config = getArticleMediaStorageConfig();

  if (config.useS3) {
    return saveArticleMediaToS3(buffer, ext, file.type, kind);
  }

  return saveArticleMediaToLocal(buffer, ext, kind);
}

export async function deleteArticleMediaFile(url: string): Promise<void> {
  const target = resolveManagedArticleMediaTarget(url);
  if (!target) {
    throw new Error("NOT_MANAGED_MEDIA");
  }

  if (target.storage === "local") {
    const filePath = path.join(UPLOAD_DIR, target.filename);
    try {
      await unlink(filePath);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        throw new Error("DELETE_FAILED");
      }
    }
    return;
  }

  const { bucket, region } = getArticleMediaStorageConfig();
  if (!bucket) {
    throw new Error("S3_NOT_CONFIGURED");
  }

  try {
    await getS3Client(region).send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: target.key,
      })
    );
  } catch {
    throw new Error("S3_DELETE_FAILED");
  }
}

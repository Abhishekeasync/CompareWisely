import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import {
  ARTICLE_IMAGE_MAX_BYTES,
  ARTICLE_VIDEO_MAX_BYTES,
  deleteArticleMediaFile,
  saveArticleMediaFile,
} from "@/lib/uploads/article-media";
import { articleMediaUrlSchema } from "@/lib/validations/media-url";
import { z } from "zod";

function errStatus(msg: string) {
  return msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
}

function friendlyMessage(code: string): string {
  switch (code) {
    case "UNSUPPORTED_FILE_TYPE":
      return "Unsupported file type. Use JPEG, PNG, WebP, or GIF for images; MP4 or WebM for video.";
    case "FILE_TOO_LARGE":
      return `File is too large. Images max ${ARTICLE_IMAGE_MAX_BYTES / (1024 * 1024)} MB; video max ${ARTICLE_VIDEO_MAX_BYTES / (1024 * 1024)} MB.`;
    case "EMPTY_FILE":
      return "The selected file is empty.";
    case "MISSING_FILE":
      return "No file was uploaded.";
    case "INVALID_KIND":
      return "Upload kind must be image or video.";
    case "S3_NOT_CONFIGURED":
      return "S3 is not configured. Set AWS_S3_BUCKET (and AWS credentials) in the environment.";
    case "S3_UPLOAD_FAILED":
      return "Could not upload to S3. Check bucket name, IAM permissions, and AWS credentials.";
    case "NOT_MANAGED_MEDIA":
      return "This URL is not an uploaded file managed by the app.";
    case "DELETE_FAILED":
    case "S3_DELETE_FAILED":
      return "Could not delete the file from storage.";
    case "INVALID_URL":
      return "A valid image or media URL is required.";
    default:
      return code;
  }
}

export async function POST(request: NextRequest) {
  await connection();

  try {
    await requireAuth(["ADMIN", "EDITOR"]);

    const formData = await request.formData();
    const kindRaw = formData.get("kind");
    const kind = kindRaw === "image" || kindRaw === "video" ? kindRaw : null;
    if (!kind) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_KIND", message: friendlyMessage("INVALID_KIND") },
        },
        { status: 400 }
      );
    }

    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "MISSING_FILE", message: friendlyMessage("MISSING_FILE") },
        },
        { status: 400 }
      );
    }

    const saved = await saveArticleMediaFile(fileEntry, kind);

    return NextResponse.json({
      success: true,
      data: saved,
      message: kind === "image" ? "Image uploaded." : "Video uploaded.",
    });
  } catch (error: unknown) {
    const code = error instanceof Error ? error.message : "UPLOAD_FAILED";
    const clientErrors = new Set([
      "UNSUPPORTED_FILE_TYPE",
      "FILE_TOO_LARGE",
      "EMPTY_FILE",
      "S3_NOT_CONFIGURED",
    ]);
    const status =
      code === "S3_UPLOAD_FAILED" ? 502 : clientErrors.has(code) ? 400 : errStatus(code);

    return NextResponse.json(
      {
        success: false,
        error: {
          code,
          message: friendlyMessage(code),
        },
      },
      { status }
    );
  }
}

const deleteBodySchema = z.object({
  url: articleMediaUrlSchema,
});

export async function DELETE(request: NextRequest) {
  await connection();

  try {
    await requireAuth(["ADMIN", "EDITOR"]);

    const body = await request.json();
    const parsed = deleteBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_URL", message: friendlyMessage("INVALID_URL") },
        },
        { status: 400 }
      );
    }

    await deleteArticleMediaFile(parsed.data.url);

    return NextResponse.json({
      success: true,
      message: "Upload deleted from storage.",
    });
  } catch (error: unknown) {
    const code = error instanceof Error ? error.message : "DELETE_FAILED";
    const clientErrors = new Set(["NOT_MANAGED_MEDIA", "INVALID_URL", "S3_NOT_CONFIGURED"]);
    const status =
      code === "S3_DELETE_FAILED" || code === "DELETE_FAILED"
        ? 502
        : clientErrors.has(code)
          ? 400
          : errStatus(code);

    return NextResponse.json(
      {
        success: false,
        error: { code, message: friendlyMessage(code) },
      },
      { status }
    );
  }
}

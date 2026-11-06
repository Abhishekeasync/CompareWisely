import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { unsubscribeNewsletter } from "@/lib/services/newsletter.service";
import { newsletterUnsubscribeSchema } from "@/lib/validations/newsletter";
import { validationErrorPayload } from "@/lib/validations/feedback";

export async function POST(request: NextRequest) {
  await connection();

  try {
    const body = await request.json();
    const parseResult = newsletterUnsubscribeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: validationErrorPayload(parseResult.error) },
        { status: 400 }
      );
    }

    const unsubscribed = await unsubscribeNewsletter(parseResult.data.token);

    return NextResponse.json({
      success: true,
      data: unsubscribed,
      message: "You have been successfully unsubscribed.",
    });
  } catch (error: any) {
    console.error("POST /api/v1/newsletter/unsubscribe error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message === "Invalid or expired unsubscribe token."
            ? "This unsubscribe link is invalid or has expired. Use the latest link from your email."
            : "We couldn't update your email preferences. Please try again.",
        },
      },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { unsubscribeNewsletter } from "@/lib/services/newsletter.service";
import { newsletterUnsubscribeSchema } from "@/lib/validations/newsletter";

export async function POST(request: NextRequest) {
  await connection();

  try {
    const body = await request.json();
    const parseResult = newsletterUnsubscribeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Valid unsubscribe token is required.",
          },
        },
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
          message: error.message || "Failed to process unsubscribe request.",
        },
      },
      { status: 400 }
    );
  }
}

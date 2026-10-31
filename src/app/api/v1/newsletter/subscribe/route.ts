import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { subscribeNewsletter } from "@/lib/services/newsletter.service";
import { newsletterSubscribeSchema } from "@/lib/validations/newsletter";

export async function POST(request: NextRequest) {
  await connection();

  try {
    const body = await request.json();
    const parseResult = newsletterSubscribeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Invalid email or missing consent.",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const subscriber = await subscribeNewsletter(parseResult.data.email, ip);

    return NextResponse.json(
      {
        success: true,
        data: subscriber,
        message: "Successfully subscribed to CompareWisely finance & software updates.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST /api/v1/newsletter/subscribe error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to subscribe to newsletter.",
        },
      },
      { status: 500 }
    );
  }
}

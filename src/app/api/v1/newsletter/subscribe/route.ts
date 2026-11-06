import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { subscribeNewsletter } from "@/lib/services/newsletter.service";
import { newsletterSubscribeSchema } from "@/lib/validations/newsletter";
import { validationErrorPayload } from "@/lib/validations/feedback";

export async function POST(request: NextRequest) {
  await connection();

  try {
    const body = await request.json();
    const parseResult = newsletterSubscribeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: validationErrorPayload(parseResult.error) },
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
          message: "We couldn't subscribe you just now. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}

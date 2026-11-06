import { NextRequest, NextResponse } from "next/server";
import { recommendationAnswersSchema } from "@/lib/validations/recommendation";
import { validationErrorPayload } from "@/lib/validations/feedback";
import { calculateRecommendation } from "@/lib/services/recommendation.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = recommendationAnswersSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: validationErrorPayload(parseResult.error) },
        { status: 400 }
      );
    }

    const recommendation = await calculateRecommendation(parseResult.data);

    return NextResponse.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    console.error("API /api/v1/recommendation error:", error);
    const raw = error instanceof Error ? error.message : "";
    const emptyCatalogue = raw === "No published software products available for recommendation.";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: emptyCatalogue
            ? "No published software is available to match against yet."
            : "We couldn't calculate a match just now. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}

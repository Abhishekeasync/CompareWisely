import { NextRequest, NextResponse } from "next/server";
import { recommendationAnswersSchema } from "@/lib/validations/recommendation";
import { calculateRecommendation } from "@/lib/services/recommendation.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = recommendationAnswersSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid questionnaire input data.",
            details: parseResult.error.flatten(),
          },
        },
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
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to calculate recommendation.",
        },
      },
      { status: 500 }
    );
  }
}

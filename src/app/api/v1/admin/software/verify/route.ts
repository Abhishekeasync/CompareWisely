import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { markPricingVerified } from "@/lib/services/admin.service";
import { pricingVerifySchema } from "@/lib/validations/software";
import { readApiError, validationErrorPayload } from "@/lib/validations/feedback";

export async function POST(request: NextRequest) {
  await connection();

  try {
    const session = await requireAuth(["ADMIN", "EDITOR"]);
    const body = await request.json();

    const parsed = pricingVerifySchema.safeParse({
      softwareId: Number(body.softwareId),
      planId: body.planId ? Number(body.planId) : undefined,
      newPrice: typeof body.newPrice === "string" ? body.newPrice : "",
      sourceUrl: typeof body.sourceUrl === "string" ? body.sourceUrl : "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: validationErrorPayload(parsed.error) },
        { status: 400 }
      );
    }

    const result = await markPricingVerified({
      softwareId: parsed.data.softwareId,
      planId: parsed.data.planId,
      newPrice: parsed.data.newPrice,
      sourceUrl: parsed.data.sourceUrl,
      userId: session.id,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Pricing verified and saved to the audit log.",
    });
  } catch (error: unknown) {
    const raw = error instanceof Error ? error.message : "";
    const notFound = raw === "Software product not found.";
    const failure = readApiError(
      { error: { code: raw, message: raw } },
      notFound ? "That product could not be found." : "Could not save this verification. Please try again."
    );
    const status = raw === "UNAUTHORIZED" ? 401 : raw === "FORBIDDEN" ? 403 : notFound ? 404 : 500;
    return NextResponse.json(
      { success: false, error: { code: raw || "INTERNAL_ERROR", message: failure.message } },
      { status }
    );
  }
}

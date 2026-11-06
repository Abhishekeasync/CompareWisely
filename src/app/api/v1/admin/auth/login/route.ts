import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { authenticateUser, signSessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { loginSchema } from "@/lib/validations/auth";
import { validationErrorPayload } from "@/lib/validations/feedback";

export async function POST(request: NextRequest) {
  await connection();

  try {
    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: validationErrorPayload(parseResult.error) },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "That email and password don't match. Check both and try again.",
          },
        },
        { status: 401 }
      );
    }

    const token = signSessionToken(user);
    const response = NextResponse.json({
      success: true,
      data: user,
      message: "Authentication successful.",
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/v1/admin/auth/login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "We couldn't sign you in. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}

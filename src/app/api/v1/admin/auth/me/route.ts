import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { getCurrentSession } from "@/lib/services/auth.service";

export async function GET(request: NextRequest) {
  await connection();

  const user = await getCurrentSession();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "No active session.",
        },
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: user,
  });
}

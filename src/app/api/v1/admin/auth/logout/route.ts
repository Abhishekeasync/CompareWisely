import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/services/auth.service";

export async function POST(request: NextRequest) {
  await connection();

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });

  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { getAdminDashboardStats } from "@/lib/services/admin.service";

export async function GET(request: NextRequest) {
  await connection();

  try {
    await requireAuth(["ADMIN", "EDITOR", "MODERATOR"]);
    const stats = await getAdminDashboardStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.message,
          message: error.message,
        },
      },
      { status }
    );
  }
}

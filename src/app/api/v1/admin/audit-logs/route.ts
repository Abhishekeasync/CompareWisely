import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { getAuditLogs } from "@/lib/services/admin.service";

export async function GET(request: NextRequest) {
  await connection();

  try {
    await requireAuth(["ADMIN"]);
    const logs = await getAuditLogs();

    return NextResponse.json({
      success: true,
      data: logs,
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

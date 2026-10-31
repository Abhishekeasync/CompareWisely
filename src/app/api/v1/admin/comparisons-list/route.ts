import { NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import { getAdminComparisons } from "@/lib/services/admin.service";

export async function GET() {
  await connection();

  try {
    await requireAuth(["ADMIN", "EDITOR"]);
    const comparisons = await getAdminComparisons();

    return NextResponse.json({ success: true, data: comparisons });
  } catch (error: any) {
    const status =
      error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { success: false, error: { code: error.message, message: error.message } },
      { status }
    );
  }
}

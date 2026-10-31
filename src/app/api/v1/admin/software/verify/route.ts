import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAuth } from "@/lib/services/auth.service";
import {
  getAllSoftwareForAdmin,
  getCommentsForAdmin,
  moderateComment,
  markPricingVerified,
  getAuditLogs,
  getAdminDashboardStats,
} from "@/lib/services/admin.service";
import { CommentStatus } from "@prisma/client";

// POST /api/v1/admin/software/verify
export async function POST(request: NextRequest) {
  await connection();

  try {
    const session = await requireAuth(["ADMIN", "EDITOR"]);
    const body = await request.json();

    const { softwareId, planId, newPrice, sourceUrl } = body;

    if (!softwareId || !sourceUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Software ID and source verification URL are required.",
          },
        },
        { status: 400 }
      );
    }

    const result = await markPricingVerified({
      softwareId: Number(softwareId),
      planId: planId ? Number(planId) : undefined,
      newPrice: newPrice || undefined,
      sourceUrl,
      userId: session.id,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Software pricing verified successfully.",
    });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.message,
          message: error.message || "Failed to verify pricing.",
        },
      },
      { status }
    );
  }
}

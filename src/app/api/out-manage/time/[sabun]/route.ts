import { NextRequest, NextResponse } from "next/server";
import { requireAccessPrincipal } from "@/server/auth/session";
import { listOutManageTimeDetail } from "@/server/data/out-manage-store";
import { ApiError, toErrorResponse } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sabun: string }> },
): Promise<NextResponse> {
  try {
    const principal = await requireAccessPrincipal(request);
    const { sabun } = await context.params;
    const sdate = request.nextUrl.searchParams.get("sdate") ?? "";
    const edate = request.nextUrl.searchParams.get("edate") ?? "";

    if (!sabun.trim() || !sdate.trim() || !edate.trim()) {
      throw new ApiError(400, "sabun, sdate, edate are required");
    }

    const content = await listOutManageTimeDetail(
      principal.enterCd,
      sabun,
      sdate,
      edate,
    );
    return NextResponse.json(
      { content },
      {
        status: 200,
        headers: { "x-ssms-backend": "next-native" },
      },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}


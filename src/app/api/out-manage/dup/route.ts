import { NextRequest, NextResponse } from "next/server";
import { requireAccessPrincipal } from "@/server/auth/session";
import { findOutManageDuplicateText } from "@/server/data/out-manage-store";
import { ApiError, toErrorResponse } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const principal = await requireAccessPrincipal(request);
    const sabun = request.nextUrl.searchParams.get("sabun") ?? "";
    const sdate = request.nextUrl.searchParams.get("sdate") ?? "";
    const edate = request.nextUrl.searchParams.get("edate") ?? "";
    const oriSdate = request.nextUrl.searchParams.get("oriSdate");

    if (!sabun.trim() || !sdate.trim() || !edate.trim()) {
      throw new ApiError(400, "sabun, sdate, edate are required");
    }

    const dupData = await findOutManageDuplicateText(
      principal.enterCd,
      sabun,
      sdate,
      edate,
      oriSdate,
    );
    return NextResponse.json(
      { dupData },
      {
        status: 200,
        headers: { "x-ssms-backend": "next-native" },
      },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}


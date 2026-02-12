import { NextRequest, NextResponse } from "next/server";
import { requireAccessPrincipal } from "@/server/auth/session";
import { listCodes } from "@/server/data/code-store";
import { ApiError, toErrorResponse } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const principal = await requireAccessPrincipal(request);
    const grcodeCd = request.nextUrl.searchParams.get("grcodeCd")?.trim() ?? "";
    if (!grcodeCd) {
      throw new ApiError(400, "grcodeCd is required");
    }

    const rows = await listCodes(principal.enterCd, grcodeCd);
    return NextResponse.json(rows, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}


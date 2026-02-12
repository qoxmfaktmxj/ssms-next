import { NextRequest, NextResponse } from "next/server";
import { requireAccessPrincipal } from "@/server/auth/session";
import { listInfraSummary } from "@/server/data/infra-store";
import { toErrorResponse } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const principal = await requireAccessPrincipal(request);
    const keyword = request.nextUrl.searchParams.get("keyword") ?? "";
    const taskGubunCd = request.nextUrl.searchParams.get("taskGubunCd") ?? "";
    const rows = await listInfraSummary(principal.enterCd, keyword, taskGubunCd);
    return NextResponse.json(rows, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}


import { NextRequest, NextResponse } from "next/server";
import { requireAccessPrincipal } from "@/server/auth/session";
import { listDevelopProjects } from "@/server/data/develop-project-store";
import { toErrorResponse } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const principal = await requireAccessPrincipal(request);
    const keyword = request.nextUrl.searchParams.get("keyword") ?? "";
    const startDate = request.nextUrl.searchParams.get("startDate") ?? "";
    const endDate = request.nextUrl.searchParams.get("endDate") ?? "";
    const rows = await listDevelopProjects(
      principal.enterCd,
      keyword,
      startDate,
      endDate,
    );
    return NextResponse.json(rows, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}


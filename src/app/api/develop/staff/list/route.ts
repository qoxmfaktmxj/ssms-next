import { NextRequest, NextResponse } from "next/server";
import { requireAccessPrincipal } from "@/server/auth/session";
import { listDevelopStaff } from "@/server/data/develop-staff-store";
import { toErrorResponse } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const principal = await requireAccessPrincipal(request);
    const page = Number(request.nextUrl.searchParams.get("page") ?? "0");
    const size = Number(request.nextUrl.searchParams.get("size") ?? "20");
    const startDate = request.nextUrl.searchParams.get("startDate") ?? "";
    const endDate = request.nextUrl.searchParams.get("endDate") ?? "";

    const result = await listDevelopStaff(
      principal.enterCd,
      Number.isFinite(page) ? page : 0,
      Number.isFinite(size) ? size : 20,
      startDate,
      endDate,
    );
    return NextResponse.json(result, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}


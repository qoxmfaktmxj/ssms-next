import { NextRequest, NextResponse } from "next/server";
import { requireAccessPrincipal } from "@/server/auth/session";
import { listUsers } from "@/server/data/user-store";
import { toErrorResponse } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const principal = await requireAccessPrincipal(request);
    const page = Number(request.nextUrl.searchParams.get("page") ?? "0");
    const size = Number(request.nextUrl.searchParams.get("size") ?? "25");
    const keyword = request.nextUrl.searchParams.get("keyword") ?? "";
    const orgNm = request.nextUrl.searchParams.get("orgNm") ?? "";
    const roleCd = request.nextUrl.searchParams.get("roleCd") ?? "";

    const result = await listUsers(
      principal.enterCd,
      Number.isFinite(page) ? page : 0,
      Number.isFinite(size) ? size : 25,
      keyword,
      orgNm,
      roleCd,
    );

    return NextResponse.json(result, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

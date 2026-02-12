import { NextRequest, NextResponse } from "next/server";
import { requireAccessPrincipal } from "@/server/auth/session";
import { searchCodes } from "@/server/data/code-store";
import { toErrorResponse } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const principal = await requireAccessPrincipal(request);
    const page = Number(request.nextUrl.searchParams.get("page") ?? "0");
    const size = Number(request.nextUrl.searchParams.get("size") ?? "20");
    const grcodeCd = request.nextUrl.searchParams.get("grcodeCd") ?? "";
    const code = request.nextUrl.searchParams.get("code") ?? "";
    const codeNm = request.nextUrl.searchParams.get("codeNm") ?? "";

    const result = await searchCodes(
      principal.enterCd,
      Number.isFinite(page) ? page : 0,
      Number.isFinite(size) ? size : 20,
      grcodeCd,
      code,
      codeNm,
    );

    return NextResponse.json(result, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}


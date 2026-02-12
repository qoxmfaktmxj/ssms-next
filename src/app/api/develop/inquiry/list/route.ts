import { NextRequest, NextResponse } from "next/server";
import { requireAccessPrincipal } from "@/server/auth/session";
import { listDevelopInquiries } from "@/server/data/develop-inquiry-store";
import { toErrorResponse } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const principal = await requireAccessPrincipal(request);
    const keyword = request.nextUrl.searchParams.get("keyword") ?? "";
    const inProceedCode = request.nextUrl.searchParams.get("inProceedCode") ?? "";
    const rows = await listDevelopInquiries(
      principal.enterCd,
      keyword,
      inProceedCode,
    );
    return NextResponse.json(rows, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}


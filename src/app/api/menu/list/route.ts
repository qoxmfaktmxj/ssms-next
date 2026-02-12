import { NextRequest, NextResponse } from "next/server";
import { requireAccessPrincipal } from "@/server/auth/session";
import { searchMenus } from "@/server/data/menu-store";
import { toErrorResponse } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const principal = await requireAccessPrincipal(request);
    const keyword = request.nextUrl.searchParams.get("keyword") ?? "";
    const rows = await searchMenus(principal.enterCd, keyword);
    return NextResponse.json(
      {
        content: rows,
      },
      {
        status: 200,
        headers: { "x-ssms-backend": "next-native" },
      },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}

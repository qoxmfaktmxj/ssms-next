import { NextRequest, NextResponse } from "next/server";
import { requireAccessPrincipal } from "@/server/auth/session";
import { listSystemLogs } from "@/server/data/log-store";
import { toErrorResponse } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAccessPrincipal(request);
    const page = Number(request.nextUrl.searchParams.get("page") ?? "0");
    const size = Number(request.nextUrl.searchParams.get("size") ?? "20");
    const sabun = request.nextUrl.searchParams.get("sabun") ?? "";
    const actionType = request.nextUrl.searchParams.get("actionType") ?? "";

    const result = await listSystemLogs(
      Number.isFinite(page) ? page : 0,
      Number.isFinite(size) ? size : 20,
      sabun,
      actionType,
    );
    return NextResponse.json(result, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}


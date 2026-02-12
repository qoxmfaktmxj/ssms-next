import { NextRequest, NextResponse } from "next/server";
import { requireAccessPrincipal } from "@/server/auth/session";
import { listInfraMaster } from "@/server/data/infra-store";
import { toErrorResponse } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const principal = await requireAccessPrincipal(request);
    const companyCd = request.nextUrl.searchParams.get("companyCd") ?? "";
    const taskGubunCd = request.nextUrl.searchParams.get("taskGubunCd") ?? "";
    if (!companyCd.trim() || !taskGubunCd.trim()) {
      return NextResponse.json([], {
        status: 200,
        headers: { "x-ssms-backend": "next-native" },
      });
    }

    const rows = await listInfraMaster(
      principal.enterCd,
      companyCd.trim(),
      taskGubunCd.trim(),
    );
    return NextResponse.json(rows, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}


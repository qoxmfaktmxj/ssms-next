import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { insertInfraMasters } from "@/server/data/infra-store";
import { toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.object({
  companyCd: z.string().min(1),
  taskGubunCd: z.string().min(1),
  devGbCdList: z.array(z.string().min(1)).default([]),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const principal = await requireAccessPrincipal(request);
  const ipAddress = getClientIp(request);
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed" },
        { status: 400, headers: { "x-ssms-backend": "next-native" } },
      );
    }

    const result = await insertInfraMasters(
      principal.enterCd,
      parsed.data.companyCd.trim(),
      parsed.data.taskGubunCd.trim(),
      parsed.data.devGbCdList.map((value) => value.trim()).filter(Boolean),
      principal.sabun,
    );

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "INFRA_MASTER_INSERT",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: true,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "INFRA_MASTER_INSERT",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}


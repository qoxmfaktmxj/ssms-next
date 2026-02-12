import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { insertOutManage } from "@/server/data/out-manage-store";
import { toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.object({
  sabun: z.string().min(1),
  sdate: z.string().min(1),
  edate: z.string().min(1),
  totCnt: z.number().nullable().optional(),
  svcCnt: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  oriSdate: z.string().nullable().optional(),
});

const trimToNull = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeDate = (value: string): string => value.trim().replaceAll("-", "");

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

    const created = await insertOutManage(
      principal.enterCd,
      {
        sabun: parsed.data.sabun.trim(),
        sdate: normalizeDate(parsed.data.sdate),
        edate: normalizeDate(parsed.data.edate),
        totCnt: parsed.data.totCnt ?? null,
        svcCnt: parsed.data.svcCnt ?? null,
        note: trimToNull(parsed.data.note),
        oriSdate: trimToNull(parsed.data.oriSdate),
      },
      principal.sabun,
    );

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "OUT_MANAGE_INSERT",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: true,
    });

    return NextResponse.json(created, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "OUT_MANAGE_INSERT",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}


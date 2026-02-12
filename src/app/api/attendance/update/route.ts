import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { updateAttendance } from "@/server/data/attendance-store";
import { ApiError, toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.object({
  id: z.number().int(),
  sabun: z.string().min(1),
  sdate: z.string().min(1),
  edate: z.string().min(1),
  gntCd: z.string().nullable().optional(),
  statusCd: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  applyDate: z.string().nullable().optional(),
});

const trimToNull = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeDate = (value: string | null | undefined): string | null => {
  const raw = trimToNull(value);
  if (!raw) {
    return null;
  }
  return raw.replaceAll("-", "");
};

export async function PUT(request: NextRequest): Promise<NextResponse> {
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

    const updated = await updateAttendance(
      principal.enterCd,
      {
        id: parsed.data.id,
        sabun: parsed.data.sabun.trim(),
        sdate: normalizeDate(parsed.data.sdate) ?? "",
        edate: normalizeDate(parsed.data.edate) ?? "",
        gntCd: trimToNull(parsed.data.gntCd),
        statusCd: trimToNull(parsed.data.statusCd),
        note: trimToNull(parsed.data.note),
        applyDate: normalizeDate(parsed.data.applyDate),
      },
      principal.sabun,
    );
    if (!updated) {
      throw new ApiError(404, "Attendance row not found");
    }

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "ATTENDANCE_UPDATE",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: true,
    });

    return NextResponse.json(updated, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "ATTENDANCE_UPDATE",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}


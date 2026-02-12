import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import {
  deleteOutManageTimeDetails,
  listOutManageTimeSummary,
  saveOutManageTimeDetail,
} from "@/server/data/out-manage-store";
import { toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const upsertSchema = z.object({
  id: z.number().int().nullable().optional(),
  sabun: z.string().min(1),
  gntCd: z.string().nullable().optional(),
  applyDate: z.string().nullable().optional(),
  statusCd: z.string().nullable().optional(),
  sdate: z.string().min(1),
  edate: z.string().min(1),
  applyCnt: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
});

const deleteSchema = z.object({
  deleteList: z
    .array(
      z.object({
        id: z.number().int(),
        sabun: z.string().optional(),
      }),
    )
    .default([]),
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const principal = await requireAccessPrincipal(request);
    const searchYmd = request.nextUrl.searchParams.get("searchYmd") ?? "";
    const searchName = request.nextUrl.searchParams.get("searchName") ?? "";
    const content = await listOutManageTimeSummary(
      principal.enterCd,
      searchYmd,
      searchName,
    );
    return NextResponse.json(
      { content },
      {
        status: 200,
        headers: { "x-ssms-backend": "next-native" },
      },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const principal = await requireAccessPrincipal(request);
  const ipAddress = getClientIp(request);
  try {
    const parsed = upsertSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed" },
        { status: 400, headers: { "x-ssms-backend": "next-native" } },
      );
    }

    const saved = await saveOutManageTimeDetail(
      principal.enterCd,
      {
        id: parsed.data.id ?? null,
        sabun: parsed.data.sabun.trim(),
        gntCd: trimToNull(parsed.data.gntCd),
        applyDate: normalizeDate(parsed.data.applyDate),
        statusCd: trimToNull(parsed.data.statusCd),
        sdate: normalizeDate(parsed.data.sdate) ?? "",
        edate: normalizeDate(parsed.data.edate) ?? "",
        applyCnt: parsed.data.applyCnt ?? null,
        note: trimToNull(parsed.data.note),
      },
      principal.sabun,
    );

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "OUT_MANAGE_TIME_SAVE",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: true,
    });

    return NextResponse.json(saved, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "OUT_MANAGE_TIME_SAVE",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const principal = await requireAccessPrincipal(request);
  const ipAddress = getClientIp(request);
  try {
    const parsed = deleteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed" },
        { status: 400, headers: { "x-ssms-backend": "next-native" } },
      );
    }

    const ids = parsed.data.deleteList.map((row) => row.id);
    const deleted = await deleteOutManageTimeDetails(principal.enterCd, ids);

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "OUT_MANAGE_TIME_DELETE",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: true,
    });

    return NextResponse.json(deleted, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "OUT_MANAGE_TIME_DELETE",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}


import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { updateDevelopManagement } from "@/server/data/develop-management-store";
import { ApiError, toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.object({
  requestCompanyCd: z.string().min(1),
  requestYm: z.string().min(1),
  requestSeq: z.number().int(),
  statusCd: z.string().nullable().optional(),
  requestNm: z.string().nullable().optional(),
  requestContent: z.string().nullable().optional(),
  managerSabun: z.string().nullable().optional(),
  developerSabun: z.string().nullable().optional(),
  outsideYn: z.string().nullable().optional(),
  paidYn: z.string().nullable().optional(),
  paidContent: z.string().nullable().optional(),
  taxBillYn: z.string().nullable().optional(),
  startYm: z.string().nullable().optional(),
  endYm: z.string().nullable().optional(),
  paidMm: z.number().nullable().optional(),
  realMm: z.number().nullable().optional(),
  content: z.string().nullable().optional(),
  sdate: z.string().nullable().optional(),
  edate: z.string().nullable().optional(),
  partCd: z.string().nullable().optional(),
});

const trimToNull = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeYm = (value: string | null | undefined): string | null => {
  const raw = trimToNull(value);
  if (!raw) {
    return null;
  }
  return raw.replaceAll("-", "").slice(0, 6);
};

const normalizeYmd = (value: string | null | undefined): string | null => {
  const raw = trimToNull(value);
  if (!raw) {
    return null;
  }
  return raw.replaceAll("-", "").slice(0, 8);
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

    const updated = await updateDevelopManagement(
      principal.enterCd,
      {
        requestCompanyCd: parsed.data.requestCompanyCd.trim(),
        requestYm: normalizeYm(parsed.data.requestYm) ?? "",
        requestSeq: parsed.data.requestSeq,
        statusCd: trimToNull(parsed.data.statusCd),
        requestNm: trimToNull(parsed.data.requestNm),
        requestContent: trimToNull(parsed.data.requestContent),
        managerSabun: trimToNull(parsed.data.managerSabun),
        developerSabun: trimToNull(parsed.data.developerSabun),
        outsideYn: trimToNull(parsed.data.outsideYn),
        paidYn: trimToNull(parsed.data.paidYn),
        paidContent: trimToNull(parsed.data.paidContent),
        taxBillYn: trimToNull(parsed.data.taxBillYn),
        startYm: normalizeYm(parsed.data.startYm),
        endYm: normalizeYm(parsed.data.endYm),
        paidMm: parsed.data.paidMm ?? null,
        realMm: parsed.data.realMm ?? null,
        content: trimToNull(parsed.data.content),
        sdate: normalizeYmd(parsed.data.sdate),
        edate: normalizeYmd(parsed.data.edate),
        partCd: trimToNull(parsed.data.partCd),
      },
      principal.sabun,
    );
    if (!updated) {
      throw new ApiError(404, "Develop management row not found");
    }

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "DEVELOP_MANAGEMENT_UPDATE",
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
      actionType: "DEVELOP_MANAGEMENT_UPDATE",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}


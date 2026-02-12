import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { updateDevelopInquiry } from "@/server/data/develop-inquiry-store";
import { ApiError, toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.object({
  inSeq: z.number().int(),
  requestCompanyCd: z.string().min(1),
  inContent: z.string().min(1),
  proceedHopeDt: z.string().nullable().optional(),
  estRealMm: z.number().nullable().optional(),
  salesNm: z.string().nullable().optional(),
  chargeNm: z.string().nullable().optional(),
  inProceedCode: z.string().nullable().optional(),
  confirmYn: z.string().nullable().optional(),
  projectNm: z.string().nullable().optional(),
  remark: z.string().nullable().optional(),
});

const trimToNull = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeYmd = (value: string | null | undefined): string | null => {
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

    const updated = await updateDevelopInquiry(
      principal.enterCd,
      {
        inSeq: parsed.data.inSeq,
        requestCompanyCd: parsed.data.requestCompanyCd.trim(),
        inContent: parsed.data.inContent.trim(),
        proceedHopeDt: normalizeYmd(parsed.data.proceedHopeDt),
        estRealMm: parsed.data.estRealMm ?? null,
        salesNm: trimToNull(parsed.data.salesNm),
        chargeNm: trimToNull(parsed.data.chargeNm),
        inProceedCode: trimToNull(parsed.data.inProceedCode),
        confirmYn: trimToNull(parsed.data.confirmYn),
        projectNm: trimToNull(parsed.data.projectNm),
        remark: trimToNull(parsed.data.remark),
      },
      principal.sabun,
    );
    if (!updated) {
      throw new ApiError(404, "Develop inquiry row not found");
    }

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "DEVELOP_INQUIRY_UPDATE",
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
      actionType: "DEVELOP_INQUIRY_UPDATE",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}


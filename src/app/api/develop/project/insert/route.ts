import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { createDevelopProject } from "@/server/data/develop-project-store";
import { toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.object({
  projectId: z.number().int().nullable().optional(),
  projectNm: z.string().min(1),
  requestCompanyCd: z.string().min(1),
  partCd: z.string().min(1),
  inputManPower: z.string().nullable().optional(),
  contractStdDt: z.string().nullable().optional(),
  contractEndDt: z.string().nullable().optional(),
  developStdDt: z.string().nullable().optional(),
  developEndDt: z.string().nullable().optional(),
  inspectionYn: z.string().nullable().optional(),
  taxBillYn: z.string().nullable().optional(),
  realMm: z.number().nullable().optional(),
  contractPrice: z.number().nullable().optional(),
  fileSeq: z.number().nullable().optional(),
  remark: z.string().nullable().optional(),
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

    const created = await createDevelopProject(
      principal.enterCd,
      {
        projectId: null,
        projectNm: parsed.data.projectNm.trim(),
        requestCompanyCd: parsed.data.requestCompanyCd.trim(),
        partCd: parsed.data.partCd.trim(),
        inputManPower: trimToNull(parsed.data.inputManPower),
        contractStdDt: normalizeYm(parsed.data.contractStdDt),
        contractEndDt: normalizeYm(parsed.data.contractEndDt),
        developStdDt: normalizeYmd(parsed.data.developStdDt),
        developEndDt: normalizeYmd(parsed.data.developEndDt),
        inspectionYn: trimToNull(parsed.data.inspectionYn),
        taxBillYn: trimToNull(parsed.data.taxBillYn),
        realMm: parsed.data.realMm ?? null,
        contractPrice: parsed.data.contractPrice ?? null,
        fileSeq: parsed.data.fileSeq ?? null,
        remark: trimToNull(parsed.data.remark),
      },
      principal.sabun,
    );

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "DEVELOP_PROJECT_INSERT",
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
      actionType: "DEVELOP_PROJECT_INSERT",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}


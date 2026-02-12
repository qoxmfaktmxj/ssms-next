import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { updateCode } from "@/server/data/code-store";
import { ApiError, toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.object({
  grcodeCd: z.string().min(1),
  code: z.string().min(1),
  codeNm: z.string().min(1),
  codeEngNm: z.string().nullable().optional(),
  seq: z.number().int().nullable().optional(),
  useYn: z.string().optional(),
  note1: z.string().nullable().optional(),
  note2: z.string().nullable().optional(),
  note3: z.string().nullable().optional(),
  note4: z.string().nullable().optional(),
  numNote: z.string().nullable().optional(),
  erpCode: z.string().nullable().optional(),
});

const normalizeUseYn = (value: string | undefined): string =>
  value?.trim().toUpperCase() === "N" ? "N" : "Y";

const trimToNull = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

    const updated = await updateCode(
      principal.enterCd,
      {
        grcodeCd: parsed.data.grcodeCd.trim(),
        code: parsed.data.code.trim(),
        codeNm: parsed.data.codeNm.trim(),
        codeEngNm: trimToNull(parsed.data.codeEngNm),
        seq: parsed.data.seq ?? null,
        useYn: normalizeUseYn(parsed.data.useYn),
        note1: trimToNull(parsed.data.note1),
        note2: trimToNull(parsed.data.note2),
        note3: trimToNull(parsed.data.note3),
        note4: trimToNull(parsed.data.note4),
        numNote: trimToNull(parsed.data.numNote),
        erpCode: trimToNull(parsed.data.erpCode),
      },
      principal.sabun,
    );

    if (!updated) {
      throw new ApiError(404, "Code not found");
    }

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "CODE_UPDATE",
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
      actionType: "CODE_UPDATE",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}


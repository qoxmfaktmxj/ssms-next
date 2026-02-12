import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { insertInfraSections } from "@/server/data/infra-store";
import { toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.array(
  z.object({
    companyCd: z.string().min(1),
    taskGubunCd: z.string().min(1),
    devGbCd: z.string().min(1),
    sectionId: z.string().nullable().optional(),
    seq: z.number().int().nullable().optional(),
    title: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    columnNm: z.string().nullable().optional(),
    columnSeq: z.string().nullable().optional(),
    contents: z.string().nullable().optional(),
  }),
);

const trimToNull = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

    const result = await insertInfraSections(
      principal.enterCd,
      parsed.data.map((row) => ({
        companyCd: row.companyCd.trim(),
        taskGubunCd: row.taskGubunCd.trim(),
        devGbCd: row.devGbCd.trim(),
        sectionId: trimToNull(row.sectionId),
        seq: row.seq ?? null,
        title: trimToNull(row.title),
        type: trimToNull(row.type),
        columnNm: trimToNull(row.columnNm),
        columnSeq: trimToNull(row.columnSeq),
        contents: trimToNull(row.contents),
      })),
      principal.sabun,
    );

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "INFRA_SECTION_INSERT",
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
      actionType: "INFRA_SECTION_INSERT",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}


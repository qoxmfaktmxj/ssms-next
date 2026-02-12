import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import {
  companyExists,
  insertCompanies,
  type CompanyUpsertInput,
} from "@/server/data/company-store";
import { ApiError, toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.array(
  z.object({
    companyCd: z.string().min(1),
    companyNm: z.string().min(1),
    companyGrpCd: z.string().nullable().optional(),
    objectDiv: z.string().nullable().optional(),
    manageDiv: z.string().nullable().optional(),
    representCompany: z.string().nullable().optional(),
    sdate: z.string().nullable().optional(),
    indutyCd: z.string().nullable().optional(),
    zip: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    homepage: z.string().nullable().optional(),
  }),
);

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

const normalizeInput = (rows: z.infer<typeof schema>): CompanyUpsertInput[] =>
  rows.map((row) => ({
    companyCd: row.companyCd.trim(),
    companyNm: row.companyNm.trim(),
    companyGrpCd: trimToNull(row.companyGrpCd),
    objectDiv: trimToNull(row.objectDiv),
    manageDiv: trimToNull(row.manageDiv),
    representCompany: trimToNull(row.representCompany),
    sdate: normalizeDate(row.sdate),
    indutyCd: trimToNull(row.indutyCd),
    zip: trimToNull(row.zip),
    address: trimToNull(row.address),
    homepage: trimToNull(row.homepage),
  }));

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

    const rows = normalizeInput(parsed.data);
    for (const row of rows) {
      if (await companyExists(principal.enterCd, row.companyCd)) {
        throw new ApiError(409, `Company already exists: ${row.companyCd}`);
      }
    }

    const created = await insertCompanies(principal.enterCd, rows, principal.sabun);

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "COMPANY_INSERT",
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
      actionType: "COMPANY_INSERT",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}


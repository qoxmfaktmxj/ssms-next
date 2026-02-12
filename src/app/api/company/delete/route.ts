import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { deleteCompanies } from "@/server/data/company-store";
import { toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.object({
  enterCd: z.string().nullable().optional(),
  companyCds: z.array(z.string().min(1)).default([]),
});

export async function DELETE(request: NextRequest): Promise<NextResponse> {
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

    const companyCds = Array.from(
      new Set(parsed.data.companyCds.map((value) => value.trim()).filter(Boolean)),
    );
    const succeeded = await deleteCompanies(principal.enterCd, companyCds);
    const failed = Math.max(companyCds.length - succeeded, 0);

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "COMPANY_DELETE",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: true,
    });

    return NextResponse.json(
      { succeeded, failed },
      {
        status: 200,
        headers: { "x-ssms-backend": "next-native" },
      },
    );
  } catch (error) {
    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "COMPANY_DELETE",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}


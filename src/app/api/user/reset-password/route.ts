import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { resetUserPassword } from "@/server/data/user-store";
import { toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.object({
  sabun: z.string().min(1),
  enterCd: z.string().optional(),
});

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

    const sabun = parsed.data.sabun.trim();
    const hashedPassword = await bcrypt.hash(sabun, 10);
    const changed = await resetUserPassword(
      principal.enterCd,
      sabun,
      hashedPassword,
      principal.sabun,
    );

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "USER_RESET_PASSWORD",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: true,
    });

    return NextResponse.json(
      { succeeded: changed ? 1 : 0, failed: changed ? 0 : 1 },
      {
        status: 200,
        headers: { "x-ssms-backend": "next-native" },
      },
    );
  } catch (error) {
    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "USER_RESET_PASSWORD",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}


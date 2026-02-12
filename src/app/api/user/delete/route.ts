import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { deleteUsers } from "@/server/data/user-store";
import { toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.array(
  z.object({
    sabun: z.string().min(1),
  }),
);

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

    const sabuns = parsed.data.map((row) => row.sabun.trim()).filter(Boolean);
    const uniqueSabuns = Array.from(new Set(sabuns));
    const succeeded = await deleteUsers(principal.enterCd, uniqueSabuns);
    const failed = Math.max(uniqueSabuns.length - succeeded, 0);

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "USER_DELETE",
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
      actionType: "USER_DELETE",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}

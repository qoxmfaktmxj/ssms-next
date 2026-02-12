import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { deleteMenus } from "@/server/data/menu-store";
import { toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.object({
  deleteList: z
    .array(
      z.object({
        menuId: z.number().int().positive(),
      }),
    )
    .default([]),
});

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const ipAddress = getClientIp(request);
  const principal = await requireAccessPrincipal(request);
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed" },
        { status: 400, headers: { "x-ssms-backend": "next-native" } },
      );
    }

    const menuIds = parsed.data.deleteList.map((item) => item.menuId);
    const succeeded = await deleteMenus(principal.enterCd, menuIds);
    const failed = Math.max(menuIds.length - succeeded, 0);

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "MENU_DELETE",
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
      actionType: "MENU_DELETE",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}

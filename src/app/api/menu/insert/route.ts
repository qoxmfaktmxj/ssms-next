import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { insertMenu } from "@/server/data/menu-store";
import { toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.object({
  menuId: z.number().int().positive(),
  parentMenuId: z.number().int().positive().nullable().optional(),
  menuLabel: z.string().min(1),
  menuPath: z.string().nullable().optional(),
  menuIcon: z.string().nullable().optional(),
  seq: z.number().int().nullable().optional(),
  useYn: z.string().optional(),
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

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    const created = await insertMenu(principal.enterCd, {
      menuId: parsed.data.menuId,
      parentMenuId: parsed.data.parentMenuId ?? null,
      menuLabel: parsed.data.menuLabel.trim(),
      menuPath: trimToNull(parsed.data.menuPath),
      menuIcon: trimToNull(parsed.data.menuIcon),
      seq: parsed.data.seq ?? null,
      useYn: normalizeUseYn(parsed.data.useYn),
      chkid: principal.sabun,
    });

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "MENU_INSERT",
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
      actionType: "MENU_INSERT",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}

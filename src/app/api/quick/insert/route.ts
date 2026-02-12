import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import {
  clearQuickMenus,
  findValidProgramMenuIds,
  saveQuickMenus,
} from "@/server/data/quick-store";
import { toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.array(
  z.object({
    menuId: z.number().int().positive(),
    seq: z.number().int().positive().optional(),
  }),
);

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

    const sorted = [...parsed.data].sort((a, b) => {
      const seqA = a.seq ?? Number.MAX_SAFE_INTEGER;
      const seqB = b.seq ?? Number.MAX_SAFE_INTEGER;
      return seqA - seqB;
    });
    const requestedIds = Array.from(new Set(sorted.map((row) => row.menuId)));

    await clearQuickMenus(principal.enterCd, principal.sabun);
    if (requestedIds.length === 0) {
      return NextResponse.json(
        { succeeded: 0, failed: 0 },
        {
          status: 200,
          headers: { "x-ssms-backend": "next-native" },
        },
      );
    }

    const validIds = await findValidProgramMenuIds(principal.enterCd, requestedIds);
    const saveIds = requestedIds.filter((menuId) => validIds.has(menuId));
    const succeeded = await saveQuickMenus(
      principal.enterCd,
      principal.sabun,
      saveIds,
      principal.sabun,
    );
    const failed = Math.max(requestedIds.length - succeeded, 0);

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "QUICK_SAVE",
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
      actionType: "QUICK_SAVE",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}


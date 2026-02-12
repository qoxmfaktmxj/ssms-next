import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { createUser, userExists } from "@/server/data/user-store";
import { ApiError, toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const schema = z.object({
  sabun: z.string().min(1),
  name: z.string().min(1),
  orgCd: z.string().min(1),
  orgNm: z.string().min(1),
  mailId: z.string().nullable().optional(),
  jikweeNm: z.string().nullable().optional(),
  useYn: z.string().optional(),
  handPhone: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  roleCd: z.string().min(1),
});

const trimToNull = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeUseYn = (value: string | undefined): string =>
  value?.trim().toUpperCase() === "N" ? "N" : "Y";

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
    const exists = await userExists(principal.enterCd, sabun);
    if (exists) {
      throw new ApiError(409, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(sabun, 10);
    const created = await createUser(
      principal.enterCd,
      {
        sabun,
        name: parsed.data.name.trim(),
        orgCd: parsed.data.orgCd.trim(),
        orgNm: parsed.data.orgNm.trim(),
        mailId: trimToNull(parsed.data.mailId),
        jikweeNm: trimToNull(parsed.data.jikweeNm),
        useYn: normalizeUseYn(parsed.data.useYn),
        handPhone: trimToNull(parsed.data.handPhone),
        note: trimToNull(parsed.data.note),
        roleCd: parsed.data.roleCd.trim(),
      },
      hashedPassword,
      principal.sabun,
    );

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "USER_INSERT",
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
      actionType: "USER_INSERT",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}

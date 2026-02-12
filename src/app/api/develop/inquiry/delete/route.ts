import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { deleteDevelopInquiries } from "@/server/data/develop-inquiry-store";
import { toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const rowSchema = z.object({
  inSeq: z.number().int(),
});

const schema = z.union([
  z.array(rowSchema),
  z.object({
    deleteList: z.array(rowSchema),
  }),
  rowSchema,
]);

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

    const rows = Array.isArray(parsed.data)
      ? parsed.data
      : "deleteList" in parsed.data
        ? parsed.data.deleteList
        : [parsed.data];

    const result = await deleteDevelopInquiries(
      principal.enterCd,
      rows.map((row) => row.inSeq),
    );

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "DEVELOP_INQUIRY_DELETE",
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
      actionType: "DEVELOP_INQUIRY_DELETE",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}

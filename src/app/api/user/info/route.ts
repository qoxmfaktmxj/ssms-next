import { NextRequest, NextResponse } from "next/server";
import { requireAccessPrincipal } from "@/server/auth/session";
import { findUserByCredentials } from "@/server/data/auth-store";
import { ApiError, toErrorResponse } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const principal = await requireAccessPrincipal(request);
    const user = await findUserByCredentials(principal.enterCd, principal.sabun);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return NextResponse.json(
      {
        enterCd: user.enterCd,
        sabun: user.sabun,
        name: user.name,
        roleCd: user.roleCd,
        orgCd: user.orgCd,
        orgNm: user.orgNm,
        mailId: user.mailId,
        jikweeNm: user.jikweeNm,
        useYn: user.useYn,
        handPhone: user.handPhone,
        note: user.note,
      },
      {
        status: 200,
        headers: { "x-ssms-backend": "next-native" },
      },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}

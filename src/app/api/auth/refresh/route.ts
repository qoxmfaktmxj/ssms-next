import { NextRequest, NextResponse } from "next/server";
import { applyAccessCookie } from "@/server/auth/cookies";
import { issueAccessToken } from "@/server/auth/tokens";
import { verifyToken } from "@/server/auth/tokens";
import { findUserByCredentials } from "@/server/data/auth-store";
import { ApiError, toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ipAddress = getClientIp(request);
  const refreshToken = request.cookies.get("refreshToken")?.value;

  try {
    if (!refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const principal = await verifyToken(refreshToken);
    if (!principal) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const user = await findUserByCredentials(principal.enterCd, principal.sabun);
    if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const accessToken = await issueAccessToken(principal);
    const response = new NextResponse(null, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
    applyAccessCookie(response, accessToken);

    await saveSystemLog({
      sabun: principal.sabun,
      actionType: "REFRESH",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: true,
    });
    return response;
  } catch (error) {
    await saveSystemLog({
      sabun: null,
      actionType: "REFRESH",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}

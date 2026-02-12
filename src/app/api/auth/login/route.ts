import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { applyAuthCookies } from "@/server/auth/cookies";
import { issueAccessToken, issueRefreshToken } from "@/server/auth/tokens";
import {
  findUserByCredentials,
  updateUserRefreshToken,
} from "@/server/data/auth-store";
import { toErrorResponse } from "@/server/http/errors";
import { getClientIp } from "@/server/http/request";
import { saveSystemLog } from "@/server/log/system-log";

export const runtime = "nodejs";

const loginSchema = z.object({
  enterCd: z.string().min(1),
  sabun: z.string().min(1),
  password: z.string().min(1),
});

const unauthorized = (
  message: string,
): NextResponse<{ statusCode: string; message: string }> =>
  NextResponse.json(
    { statusCode: "401", message },
    {
      status: 401,
      headers: { "x-ssms-backend": "next-native" },
    },
  );

export async function POST(request: NextRequest): Promise<NextResponse> {
  let sabunForLog: string | null = null;
  const ipAddress = getClientIp(request);

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed" },
        { status: 400, headers: { "x-ssms-backend": "next-native" } },
      );
    }

    const enterCd = parsed.data.enterCd.trim();
    const sabun = parsed.data.sabun.trim();
    const password = parsed.data.password;
    sabunForLog = sabun;

    const user = await findUserByCredentials(enterCd, sabun);
    if (!user) {
      await saveSystemLog({
        sabun,
        actionType: "LOGIN",
        requestUrl: request.nextUrl.pathname,
        ipAddress,
        success: false,
        errorMessage: "ID error",
      });
      return unauthorized("ID error");
    }

    const passwordMatched = await bcrypt.compare(password, user.password);
    if (!passwordMatched) {
      await saveSystemLog({
        sabun,
        actionType: "LOGIN",
        requestUrl: request.nextUrl.pathname,
        ipAddress,
        success: false,
        errorMessage: "PASSWORD error",
      });
      return unauthorized("PASSWORD error");
    }

    const principal = { sabun: user.sabun, enterCd: user.enterCd };
    const [accessToken, refreshToken] = await Promise.all([
      issueAccessToken(principal),
      issueRefreshToken(principal),
    ]);

    await updateUserRefreshToken(user.enterCd, user.sabun, refreshToken);
    await saveSystemLog({
      sabun,
      actionType: "LOGIN",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: true,
    });

    const response = NextResponse.json(
      { statusCode: "200", message: "Login success" },
      {
        status: 200,
        headers: { "x-ssms-backend": "next-native" },
      },
    );
    applyAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (error) {
    await saveSystemLog({
      sabun: sabunForLog,
      actionType: "LOGIN",
      requestUrl: request.nextUrl.pathname,
      ipAddress,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unexpected error",
    });
    return toErrorResponse(error);
  }
}

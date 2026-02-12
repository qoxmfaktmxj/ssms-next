import type { NextResponse } from "next/server";
import { serverEnv } from "@/server/config/env";

const baseCookie = {
  httpOnly: true,
  secure: serverEnv.secureCookie,
  sameSite: "lax" as const,
  path: "/",
};

export const applyAuthCookies = (
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
): void => {
  response.cookies.set("accessToken", accessToken, {
    ...baseCookie,
    maxAge: serverEnv.jwtAccessTtlSeconds,
  });
  response.cookies.set("refreshToken", refreshToken, {
    ...baseCookie,
    maxAge: serverEnv.jwtRefreshTtlSeconds,
  });
};

export const applyAccessCookie = (response: NextResponse, accessToken: string): void => {
  response.cookies.set("accessToken", accessToken, {
    ...baseCookie,
    maxAge: serverEnv.jwtAccessTtlSeconds,
  });
};

export const clearAuthCookies = (response: NextResponse): void => {
  response.cookies.set("accessToken", "", {
    ...baseCookie,
    maxAge: 0,
  });
  response.cookies.set("refreshToken", "", {
    ...baseCookie,
    maxAge: 0,
  });
};

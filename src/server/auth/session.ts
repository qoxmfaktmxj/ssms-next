import type { NextRequest } from "next/server";
import { verifyToken } from "@/server/auth/tokens";
import type { AuthPrincipal } from "@/server/auth/types";
import { ApiError } from "@/server/http/errors";

export const getAccessPrincipal = async (
  request: NextRequest,
): Promise<AuthPrincipal | null> => {
  const token = request.cookies.get("accessToken")?.value;
  return verifyToken(token);
};

export const getRefreshPrincipal = async (
  request: NextRequest,
): Promise<AuthPrincipal | null> => {
  const token = request.cookies.get("refreshToken")?.value;
  return verifyToken(token);
};

export const requireAccessPrincipal = async (
  request: NextRequest,
): Promise<AuthPrincipal> => {
  const principal = await getAccessPrincipal(request);
  if (!principal) {
    throw new ApiError(401, "Unauthorized");
  }
  return principal;
};

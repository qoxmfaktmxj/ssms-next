import { jwtVerify, SignJWT } from "jose";
import { serverEnv } from "@/server/config/env";
import type { AuthPrincipal } from "@/server/auth/types";

const key = new TextEncoder().encode(serverEnv.jwtSecret);

const subjectFromPrincipal = (principal: AuthPrincipal): string =>
  `${principal.sabun}:${principal.enterCd}`;

const principalFromSubject = (subject: string | undefined): AuthPrincipal | null => {
  if (!subject) {
    return null;
  }
  const [sabun, enterCd] = subject.split(":");
  if (!sabun || !enterCd) {
    return null;
  }
  return { sabun, enterCd };
};

const signToken = async (principal: AuthPrincipal, ttlSeconds: number): Promise<string> =>
  new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subjectFromPrincipal(principal))
    .setIssuedAt()
    .setExpirationTime(`${Math.max(1, ttlSeconds)}s`)
    .sign(key);

export const issueAccessToken = (principal: AuthPrincipal): Promise<string> =>
  signToken(principal, serverEnv.jwtAccessTtlSeconds);

export const issueRefreshToken = (principal: AuthPrincipal): Promise<string> =>
  signToken(principal, serverEnv.jwtRefreshTtlSeconds);

export const verifyToken = async (token: string | undefined | null): Promise<AuthPrincipal | null> => {
  if (!token) {
    return null;
  }
  try {
    const payload = await jwtVerify(token, key);
    return principalFromSubject(payload.payload.sub);
  } catch {
    return null;
  }
};

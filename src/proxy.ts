import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = new Set(["/login"]);

const isStaticAsset = (pathname: string): boolean => {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  );
};

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api") || isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const hasSession =
    request.cookies.has("accessToken") || request.cookies.has("refreshToken");
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  if (!hasSession && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};

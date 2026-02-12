import type { NextRequest } from "next/server";

export const getClientIp = (request: NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    if (first && first.trim()) {
      return first.trim();
    }
  }
  return request.headers.get("x-real-ip") ?? "127.0.0.1";
};

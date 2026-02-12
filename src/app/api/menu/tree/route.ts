import { NextRequest, NextResponse } from "next/server";
import { requireAccessPrincipal } from "@/server/auth/session";
import { findActiveMenus } from "@/server/data/menu-store";
import { buildMenuTree } from "@/server/data/menu-tree";
import { toErrorResponse } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const principal = await requireAccessPrincipal(request);
    const rows = await findActiveMenus(principal.enterCd);
    const tree = buildMenuTree(rows);
    return NextResponse.json(tree, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

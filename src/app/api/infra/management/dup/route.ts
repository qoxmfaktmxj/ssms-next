import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAccessPrincipal } from "@/server/auth/session";
import { countInfraMasterDuplicates } from "@/server/data/infra-store";
import { toErrorResponse } from "@/server/http/errors";

export const runtime = "nodejs";

const schema = z.object({
  companyCd: z.string().min(1),
  taskGubunCd: z.string().min(1),
  devGbCdList: z.array(z.string().min(1)).default([]),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const principal = await requireAccessPrincipal(request);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(0, {
        status: 200,
        headers: { "x-ssms-backend": "next-native" },
      });
    }

    const devGbCdList = Array.from(
      new Set(parsed.data.devGbCdList.map((value) => value.trim()).filter(Boolean)),
    );
    const count = await countInfraMasterDuplicates(
      principal.enterCd,
      parsed.data.companyCd.trim(),
      parsed.data.taskGubunCd.trim(),
      devGbCdList,
    );
    return NextResponse.json(count, {
      status: 200,
      headers: { "x-ssms-backend": "next-native" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}


import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const notImplemented = async (
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> => {
  const params = await context.params;
  const joinedPath = params.path.join("/");
  return NextResponse.json(
    {
      message: `No native handler for /api/${joinedPath}`,
    },
    {
      status: 404,
      headers: { "x-ssms-backend": "next-native" },
    },
  );
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  return notImplemented(context);
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  return notImplemented(context);
}

export async function PUT(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  return notImplemented(context);
}

export async function PATCH(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  return notImplemented(context);
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  return notImplemented(context);
}

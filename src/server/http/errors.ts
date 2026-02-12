import { NextResponse } from "next/server";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const toErrorResponse = (error: unknown): NextResponse => {
  if (!(error instanceof ApiError)) {
    // Keep stack traces in server logs while returning stable API payload.
    console.error("[ssms-next-api] unexpected error", error);
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { message: error.message },
      {
        status: error.status,
        headers: { "x-ssms-backend": "next-native" },
      },
    );
  }

  return NextResponse.json(
    { message: "Unexpected server error" },
    {
      status: 500,
      headers: { "x-ssms-backend": "next-native" },
    },
  );
};

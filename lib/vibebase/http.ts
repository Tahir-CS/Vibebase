import { NextResponse } from "next/server";
import { VibebaseError } from "@/lib/vibebase/errors";

export function errorResponse(error: unknown, actionId: string) {
  if (error instanceof VibebaseError) {
    return NextResponse.json({ error: { code: error.code, message: error.message, actionId } }, { status: error.status });
  }
  return NextResponse.json(
    { error: { code: "UPSTREAM_FAILURE", message: "The requested operation could not be completed.", actionId } },
    { status: 500 }
  );
}

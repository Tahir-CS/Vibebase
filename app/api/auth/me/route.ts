import { NextRequest, NextResponse } from "next/server";
import { hasPersistentDatabase } from "@/lib/persistent/db";
import { requireFounder } from "@/lib/persistent/session";
import { errorResponse } from "@/lib/vibebase/http";

export async function GET(request: NextRequest) {
  if (!hasPersistentDatabase()) return NextResponse.json({ data: null, message: "Local demo mode" });
  try {
    return NextResponse.json({ data: { founder: await requireFounder(request) }, message: "Session loaded" });
  } catch (error) {
    return errorResponse(error, "act_founder_session");
  }
}

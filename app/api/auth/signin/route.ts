import { NextRequest, NextResponse } from "next/server";
import { signInFounder } from "@/lib/persistent/identity";
import { errorResponse } from "@/lib/vibebase/http";
import { hasPersistentDatabase } from "@/lib/persistent/db";
import { SESSION_COOKIE } from "@/lib/persistent/session";

export async function POST(request: NextRequest) {
  if (!hasPersistentDatabase()) return NextResponse.json({ error: { code: "UPSTREAM_FAILURE", message: "Persistent mode is not configured." } }, { status: 503 });
  try {
    const result = await signInFounder(await request.json());
    const response = NextResponse.json({ data: { founder: result.founder }, message: "Signed in" });
    response.cookies.set(SESSION_COOKIE, result.sessionToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 14 });
    return response;
  } catch (error) {
    return errorResponse(error, "act_founder_signin");
  }
}

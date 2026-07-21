import { NextRequest, NextResponse } from "next/server";
import { createFounder } from "@/lib/persistent/identity";
import { errorResponse } from "@/lib/vibebase/http";
import { hasPersistentDatabase } from "@/lib/persistent/db";
import { SESSION_COOKIE } from "@/lib/persistent/session";

export async function POST(request: NextRequest) {
  if (!hasPersistentDatabase()) return NextResponse.json({ error: { code: "UPSTREAM_FAILURE", message: "Persistent mode is not configured." } }, { status: 503 });
  try {
    const body = await request.json();
    const result = await createFounder(body);
    const response = NextResponse.json({ data: { founder: result.founder, project: result.workspace.project, initialToken: result.workspace.token }, message: "Workspace created. Your agent key is shown only now." }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, result.sessionToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 14 });
    return response;
  } catch (error) {
    return errorResponse(error, "act_founder_signup");
  }
}

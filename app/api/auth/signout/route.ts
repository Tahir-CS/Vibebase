import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/persistent/identity";
import { hasPersistentDatabase } from "@/lib/persistent/db";
import { SESSION_COOKIE } from "@/lib/persistent/session";

export async function POST(request: NextRequest) {
  if (hasPersistentDatabase()) await deleteSession(request.cookies.get(SESSION_COOKIE)?.value);
  const response = NextResponse.json({ data: {}, message: "Signed out" });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}

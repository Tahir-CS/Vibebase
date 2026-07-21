import type { NextRequest } from "next/server";
import { getFounderSession } from "@/lib/persistent/identity";

export const SESSION_COOKIE = "vibebase_session";

export function requireFounder(request: NextRequest) {
  return getFounderSession(request.cookies.get(SESSION_COOKIE)?.value);
}

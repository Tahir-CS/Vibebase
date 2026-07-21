import { NextResponse } from "next/server";
import { getVibebaseService } from "@/lib/vibebase/bootstrap";

export async function POST() {
  // The Dockerized local demo runs with NODE_ENV=production, so NODE_ENV is
  // not a safe indicator for whether this one-time demo-only endpoint is
  // available. Allow it only when the compose service explicitly opts in.
  if (process.env.VIBEBASE_LOCAL_DEMO_MODE !== "true") {
    return NextResponse.json({ error: { code: "RESOURCE_NOT_FOUND", message: "Not found." } }, { status: 404 });
  }
  const service = getVibebaseService();
  const reveal = service.consumeDemoTokenReveal();
  if (!reveal) {
    return NextResponse.json({ data: { token: null }, message: "The local demo key was already revealed." });
  }

  return NextResponse.json({
    data: { token: reveal.rawToken, projectId: reveal.projectId, scopes: reveal.scopes },
    message: "Local demo founder, project, resources, deployment target, and scoped key are ready."
  });
}

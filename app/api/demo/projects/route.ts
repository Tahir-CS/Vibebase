import { NextRequest, NextResponse } from "next/server";
import { VibebaseError } from "@/lib/vibebase/errors";
import { getVibebaseService } from "@/lib/vibebase/bootstrap";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: { code: "RESOURCE_NOT_FOUND", message: "Not found." } }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  try {
    const result = getVibebaseService().createLocalDemoProject(typeof body.name === "string" ? body.name : "");
    return NextResponse.json({
      data: { project: result.project, token: result.rawToken },
      message: "Project created. This is the only time its agent key is returned."
    });
  } catch (error) {
    if (error instanceof VibebaseError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    }
    return NextResponse.json({ error: { code: "UPSTREAM_FAILURE", message: "Unable to create the local project." } }, { status: 500 });
  }
}

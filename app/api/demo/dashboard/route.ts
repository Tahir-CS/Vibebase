import { NextRequest, NextResponse } from "next/server";
import { getVibebaseService } from "@/lib/vibebase/bootstrap";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;
  const snapshot = getVibebaseService().getDashboardSnapshot(projectId);
  return NextResponse.json({ data: snapshot, message: "Local demo dashboard loaded" });
}

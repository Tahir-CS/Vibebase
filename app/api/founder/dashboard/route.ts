import { NextRequest, NextResponse } from "next/server";
import { getFounderDashboard } from "@/lib/persistent/identity";
import { requireFounder } from "@/lib/persistent/session";
import { errorResponse } from "@/lib/vibebase/http";

export async function GET(request: NextRequest) {
  try {
    const founder = await requireFounder(request);
    return NextResponse.json({ data: await getFounderDashboard(founder.founderId, request.nextUrl.searchParams.get("projectId") ?? undefined), message: "Founder dashboard loaded" });
  } catch (error) {
    return errorResponse(error, "act_founder_dashboard");
  }
}

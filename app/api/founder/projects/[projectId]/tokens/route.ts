import { NextRequest, NextResponse } from "next/server";
import { listProjectTokens, rotateProjectToken } from "@/lib/persistent/identity";
import { requireFounder } from "@/lib/persistent/session";
import { errorResponse } from "@/lib/vibebase/http";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const founder = await requireFounder(request);
    return NextResponse.json({ data: await listProjectTokens(founder.founderId, (await params).projectId), message: "Agent keys loaded" });
  } catch (error) {
    return errorResponse(error, "act_founder_tokens_list");
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const founder = await requireFounder(request);
    const result = await rotateProjectToken(founder.founderId, (await params).projectId);
    return NextResponse.json({ data: result, message: "Agent key rotated. The new key is shown only now." });
  } catch (error) {
    return errorResponse(error, "act_founder_tokens_rotate");
  }
}

import { NextRequest, NextResponse } from "next/server";
import { revokeProjectToken } from "@/lib/persistent/identity";
import { requireFounder } from "@/lib/persistent/session";
import { errorResponse } from "@/lib/vibebase/http";

type RouteContext = { params: Promise<{ projectId: string; tokenId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const founder = await requireFounder(request);
    const { projectId, tokenId } = await params;
    await revokeProjectToken(founder.founderId, projectId, tokenId);
    return NextResponse.json({ data: {}, message: "Agent key revoked" });
  } catch (error) {
    return errorResponse(error, "act_founder_tokens_revoke");
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getVibebaseService } from "@/lib/vibebase/bootstrap";
import { errorResponse } from "@/lib/vibebase/http";
import { assertRequestRateLimit } from "@/lib/vibebase/rate-limit";
import { hasPersistentDatabase } from "@/lib/persistent/db";
import { listPersistentAudit } from "@/lib/persistent/agent";

export async function GET(request: NextRequest) {
  const service = getVibebaseService();
  try {
    assertRequestRateLimit(request.headers.get("authorization"), request.headers.get("x-forwarded-for"));
    const events = hasPersistentDatabase() ? await listPersistentAudit(request.headers.get("authorization")) : service.listAuditEvents(request.headers.get("authorization"));
    return NextResponse.json({
      data: events,
      actionId: "act_audit_events",
      message: "Audit events loaded"
    });
  } catch (error) {
    return errorResponse(error, "act_audit_events");
  }
}

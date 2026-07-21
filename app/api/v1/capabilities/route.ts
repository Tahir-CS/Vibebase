import { NextResponse } from "next/server";
import { getVibebaseService } from "@/lib/vibebase/bootstrap";

export async function GET() {
  const service = getVibebaseService();
  return NextResponse.json({
    data: service.getCapabilities(),
    actionId: "act_capabilities",
    message: "Capabilities loaded"
  });
}

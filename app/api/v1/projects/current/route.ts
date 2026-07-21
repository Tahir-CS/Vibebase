import { NextRequest, NextResponse } from "next/server";
import { getVibebaseService } from "@/lib/vibebase/bootstrap";
import { errorResponse } from "@/lib/vibebase/http";
import { assertRequestRateLimit } from "@/lib/vibebase/rate-limit";
import { hasPersistentDatabase } from "@/lib/persistent/db";
import { getPersistentProject } from "@/lib/persistent/agent";

export async function GET(request: NextRequest) {
  const service = getVibebaseService();
  try {
    assertRequestRateLimit(request.headers.get("authorization"), request.headers.get("x-forwarded-for"));
    const project = hasPersistentDatabase()
      ? await getPersistentProject(request.headers.get("authorization")).then((context) => ({ id: context.projectId, name: context.projectName, environment: context.environment, appwriteProjectId: "configured-server-side" }))
      : service.resolveToken(request.headers.get("authorization")).project;
    return NextResponse.json({
      data: {
        projectId: project.id,
        projectName: project.name,
        environment: project.environment,
        appwriteProjectId: project.appwriteProjectId
      },
      actionId: "act_project_current",
      message: "Project loaded"
    });
  } catch (error) {
    return errorResponse(error, "act_project_current");
  }
}

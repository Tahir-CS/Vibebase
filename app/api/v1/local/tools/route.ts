import { NextRequest, NextResponse } from "next/server";
import { getVibebaseService } from "@/lib/vibebase/bootstrap";
import { VibebaseError } from "@/lib/vibebase/errors";
import { errorResponse } from "@/lib/vibebase/http";

type LocalTool =
  | "vibebase.create_database"
  | "vibebase.create_collection"
  | "vibebase.create_attribute"
  | "vibebase.create_index"
  | "vibebase.create_bucket"
  | "vibebase.get_auth_status"
  | "vibebase.get_client_config"
  | "vibebase.create_deployment"
  | "vibebase.set_deployment_env"
  | "vibebase.deploy"
  | "vibebase.get_deployment_status"
  | "vibebase.get_audit_events";

export async function POST(request: NextRequest) {
  if (process.env.VIBEBASE_LOCAL_DEMO_MODE !== "true" && process.env.VIBEBASE_MCP_BRIDGE_MODE !== "true") {
    return NextResponse.json({ error: { code: "RESOURCE_NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  try {
    const body = await request.json();
    const tool = body?.tool as LocalTool;
    const args = isRecord(body?.args) ? body.args : {};
    const data = await executeLocalTool(tool, args);
    return NextResponse.json({ data, message: "Local tool completed" });
  } catch (error) {
    return errorResponse(error, "act_local_tool");
  }
}

export async function executeLocalTool(tool: LocalTool, args: Record<string, unknown>) {
  const service = getVibebaseService();
  const authHeader = "Bearer " + (typeof args.token === "string" ? args.token : "");
  const confirm = args.confirm === true;
  switch (tool) {
    case "vibebase.create_database": return service.createDatabase(authHeader, { name: args.name as string }, confirm);
    case "vibebase.create_collection": return service.createCollection(authHeader, { name: args.name }, confirm);
    case "vibebase.create_attribute": return service.createAttribute(authHeader, { collectionId: args.collectionId as string, key: args.key as string, type: args.type as "string" | "number" | "boolean", required: args.required === true }, confirm);
    case "vibebase.create_index": return service.createIndex(authHeader, { collectionId: args.collectionId as string, name: args.name as string, fields: args.fields as string[] }, confirm);
    case "vibebase.create_bucket": return service.createBucket(authHeader, { name: args.name }, confirm);
    case "vibebase.get_auth_status": return service.getAuthStatus(authHeader);
    case "vibebase.get_client_config": return service.getClientConfig(authHeader);
    case "vibebase.create_deployment": return service.createDeployment(authHeader, { name: args.name as string }, confirm);
    case "vibebase.set_deployment_env": return service.setDeploymentEnv(authHeader, { deploymentId: optionalString(args.deploymentId), env: args.env as Record<string, string> }, confirm);
    case "vibebase.deploy": return service.deploy(authHeader, { deploymentId: optionalString(args.deploymentId) }, confirm);
    case "vibebase.get_deployment_status": return service.getDeploymentStatus(authHeader, optionalString(args.deploymentId));
    case "vibebase.get_audit_events": return service.listAuditEvents(authHeader);
    default: throw new VibebaseError("VALIDATION_ERROR", "Unsupported local tool.", 400);
  }
}

function optionalString(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : undefined; }
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }

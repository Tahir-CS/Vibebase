import { randomUUID } from "node:crypto";
import { AppwriteServerAdapter } from "@/lib/vibebase/appwrite-adapter";
import { hashToken } from "@/lib/vibebase/crypto";
import { getDatabase } from "@/lib/persistent/db";
import { VibebaseError } from "@/lib/vibebase/errors";
import type { Scope } from "@/lib/vibebase/types";

type AgentContext = { tokenId: string; projectId: string; projectName: string; environment: "local"; scopes: Scope[]; revokedAt: string | null };

export async function resolvePersistentAgent(authHeader: string | null): Promise<AgentContext> {
  if (!authHeader?.startsWith("Bearer ")) throw new VibebaseError("TOKEN_INVALID", "Missing bearer token.", 401);
  const rawToken = authHeader.slice(7).trim();
  if (!rawToken.startsWith("vb_")) throw new VibebaseError("TOKEN_INVALID", "Token format is invalid.", 401);
  const result = await getDatabase().query<AgentContext>(
    "SELECT agent_tokens.id as \"tokenId\", projects.id as \"projectId\", projects.name as \"projectName\", projects.environment, agent_tokens.scopes, agent_tokens.revoked_at as \"revokedAt\" FROM agent_tokens JOIN projects ON projects.id = agent_tokens.project_id WHERE agent_tokens.token_hash = $1",
    [hashToken(rawToken)]
  );
  const context = result.rows[0];
  if (!context) throw new VibebaseError("TOKEN_INVALID", "Token was not recognized.", 401);
  if (context.revokedAt) throw new VibebaseError("TOKEN_REVOKED", "Token has been revoked.", 401);
  return context;
}

export async function getPersistentProject(authHeader: string | null) {
  const context = await resolvePersistentAgent(authHeader);
  requireScope(context, "project:read");
  return context;
}

export async function createPersistentCollection(authHeader: string | null, input: { name?: unknown }, confirm: boolean) {
  const context = await resolvePersistentAgent(authHeader);
  try {
    requireScope(context, "database:write");
    if (!confirm) throw new VibebaseError("CONFIRMATION_REQUIRED", "createCollection requires confirm=true.", 400);
    const name = validateName(input?.name);
    const collection = await getAppwriteAdapter().createCollection({ projectId: context.projectId, name });
    const actionId = await recordPersistentAudit(context, "database:write", "database.createCollection", "collection", "success", `Created ${collection.name}`);
    return { actionId, collection };
  } catch (error) {
    await recordRejectedAudit(context, "database:write", "database.createCollection", "collection", error);
    throw error;
  }
}

export async function listPersistentCollections(authHeader: string | null) {
  const context = await resolvePersistentAgent(authHeader);
  requireScope(context, "database:read");
  return getAppwriteAdapter().listCollections(context.projectId);
}

export async function listPersistentAudit(authHeader: string | null) {
  const context = await resolvePersistentAgent(authHeader);
  requireScope(context, "project:read");
  const result = await getDatabase().query("SELECT action_id as \"actionId\", project_id as \"projectId\", actor_token_id as \"actorTokenId\", scope, action_type as \"actionType\", target_type as \"targetType\", status, created_at as timestamp, message FROM audit_events WHERE project_id = $1 ORDER BY created_at DESC LIMIT 100", [context.projectId]);
  return result.rows;
}

function getAppwriteAdapter() {
  const { APPWRITE_ENDPOINT: endpoint, APPWRITE_INTERNAL_ENDPOINT: internalEndpoint, APPWRITE_PROJECT_ID: projectId, APPWRITE_API_KEY: apiKey, APPWRITE_DATABASE_ID: databaseId } = process.env;
  if (!endpoint || !projectId || !apiKey || !databaseId || [projectId, apiKey, databaseId].some((value) => value === "unconfigured" || value.startsWith("replace-"))) {
    throw new VibebaseError("UPSTREAM_FAILURE", "Appwrite is not configured for persistent mode.", 503);
  }
  return new AppwriteServerAdapter({ endpoint, internalEndpoint, projectId, apiKey, databaseId });
}

function requireScope(context: AgentContext, scope: Scope) {
  if (!context.scopes.includes(scope)) throw new VibebaseError("SCOPE_MISSING", `This token cannot perform ${scope}.`, 403);
}

async function recordRejectedAudit(context: AgentContext, scope: Scope, actionType: string, targetType: string, error: unknown) {
  const code = error instanceof VibebaseError ? error.code : "UPSTREAM_FAILURE";
  await recordPersistentAudit(context, scope, actionType, targetType, "failed", `Rejected: ${code}`);
}

async function recordPersistentAudit(context: AgentContext, scope: Scope, actionType: string, targetType: string, status: "success" | "failed", message: string) {
  const actionId = `act_${randomUUID().slice(0, 12)}`;
  await getDatabase().query("INSERT INTO audit_events (action_id, project_id, actor_token_id, scope, action_type, target_type, status, message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [actionId, context.projectId, context.tokenId, scope, actionType, targetType, status, message]);
  return actionId;
}

function validateName(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 64 || !/^[a-zA-Z][a-zA-Z0-9 _-]*$/.test(value.trim())) {
    throw new VibebaseError("VALIDATION_ERROR", "Collection name must be 1-64 letters, numbers, spaces, underscores, or hyphens.", 400);
  }
  return value.trim();
}

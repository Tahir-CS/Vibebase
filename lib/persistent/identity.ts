import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getDatabase } from "@/lib/persistent/db";
import { createToken, hashToken } from "@/lib/vibebase/crypto";
import type { Scope } from "@/lib/vibebase/types";
import { VibebaseError } from "@/lib/vibebase/errors";

const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 14;
const defaultScopes: Scope[] = ["project:read", "database:read", "database:write", "storage:read", "storage:write", "deploy:read", "deploy:write"];

export type FounderSession = { founderId: string; email: string; name: string };

export async function createFounder(input: { name: string; email: string; password: string }) {
  const name = normalizeName(input.name, "Name");
  const email = normalizeEmail(input.email);
  validatePassword(input.password);
  const passwordHash = await hashPassword(input.password);
  const db = getDatabase();
  try {
    const result = await db.query<{ id: string; name: string; email: string }>(
      "INSERT INTO founders (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, passwordHash]
    );
    const founder = result.rows[0];
    // Founders enter with one isolated workspace so the agent can begin immediately.
    const workspace = await createFounderProject(founder.id, `${founder.name.split(" ")[0] || "Founder"}'s workspace`);
    return { founder, sessionToken: await createSession(founder.id), workspace };
  } catch (error: any) {
    if (error?.code === "23505") throw new VibebaseError("VALIDATION_ERROR", "An account with that email already exists.", 409);
    throw error;
  }
}

export async function signInFounder(input: { email: string; password: string }) {
  const email = normalizeEmail(input.email);
  const db = getDatabase();
  const result = await db.query<{ id: string; name: string; email: string; password_hash: string }>("SELECT id, name, email, password_hash FROM founders WHERE email = $1", [email]);
  const founder = result.rows[0];
  if (!founder || !(await verifyPassword(input.password, founder.password_hash))) {
    throw new VibebaseError("TOKEN_INVALID", "Email or password is incorrect.", 401);
  }
  return { founder: { id: founder.id, name: founder.name, email: founder.email }, sessionToken: await createSession(founder.id) };
}

export async function getFounderSession(rawSession: string | undefined): Promise<FounderSession> {
  if (!rawSession) throw new VibebaseError("TOKEN_INVALID", "Sign in is required.", 401);
  const db = getDatabase();
  const result = await db.query<FounderSession>(
    "SELECT founders.id as \"founderId\", founders.email, founders.name FROM sessions JOIN founders ON founders.id = sessions.founder_id WHERE sessions.token_hash = $1 AND sessions.expires_at > now()",
    [hashToken(rawSession)]
  );
  const session = result.rows[0];
  if (!session) throw new VibebaseError("TOKEN_INVALID", "Your session has expired. Sign in again.", 401);
  return session;
}

export async function deleteSession(rawSession: string | undefined) {
  if (!rawSession) return;
  await getDatabase().query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(rawSession)]);
}

export async function listFounderProjects(founderId: string) {
  const result = await getDatabase().query<{ id: string; name: string; environment: "local"; createdAt: string }>(
    "SELECT id, name, environment, created_at as \"createdAt\" FROM projects WHERE founder_id = $1 ORDER BY created_at DESC",
    [founderId]
  );
  return result.rows;
}

export async function getFounderDashboard(founderId: string, requestedProjectId?: string) {
  const projects = await listFounderProjects(founderId);
  const project = projects.find((item) => item.id === requestedProjectId) ?? projects[0];
  if (!project) return { founder: await getFounder(founderId), projects, selectedProject: null };
  const db = getDatabase();
  const [founder, tokens, audit] = await Promise.all([
    getFounder(founderId),
    db.query<{ id: string; scopes: Scope[]; revokedAt: string | null }>("SELECT id, scopes, revoked_at as \"revokedAt\" FROM agent_tokens WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1", [project.id]),
    db.query<{ actionId: string; actionType: string; message: string; status: "success" | "failed"; timestamp: string }>("SELECT action_id as \"actionId\", action_type as \"actionType\", message, status, created_at as timestamp FROM audit_events WHERE project_id = $1 ORDER BY created_at DESC LIMIT 8", [project.id])
  ]);
  const token = tokens.rows[0] ?? null;
  return {
    founder,
    projects,
    selectedProject: {
      ...project,
      token: token ? { id: token.id, prefix: "vb_", scopes: token.scopes, status: token.revokedAt ? "revoked" : "active", pendingReveal: false } : null,
      resources: { collections: [], buckets: [] },
      deployment: null,
      auditEvents: audit.rows
    }
  };
}

export async function createFounderProject(founderId: string, nameInput: string) {
  const name = normalizeName(nameInput, "Project");
  const projectId = `proj_${slugify(name)}_${randomUUID().slice(0, 8)}`;
  const token = createToken(projectId);
  const db = getDatabase();
  await db.query("BEGIN");
  try {
    await db.query("INSERT INTO projects (id, founder_id, name, appwrite_project_id) VALUES ($1, $2, $3, $4)", [projectId, founderId, name, process.env.APPWRITE_PROJECT_ID || "unconfigured"]);
    await db.query("INSERT INTO agent_tokens (id, project_id, token_hash, scopes) VALUES ($1, $2, $3, $4)", [token.id, projectId, token.tokenHash, defaultScopes]);
    await db.query(
      "INSERT INTO audit_events (action_id, project_id, actor_token_id, scope, action_type, target_type, status, message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [`act_${randomUUID().slice(0, 12)}`, projectId, token.id, "project:read", "project.create", "project", "success", "Founder created project"]
    );
    await db.query("COMMIT");
    return { project: { id: projectId, name, environment: "local" as const }, token: token.rawToken };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

export async function listProjectTokens(founderId: string, projectId: string) {
  await assertProjectOwner(founderId, projectId);
  const result = await getDatabase().query<{ id: string; scopes: Scope[]; revokedAt: string | null; createdAt: string }>(
    "SELECT id, scopes, revoked_at as \"revokedAt\", created_at as \"createdAt\" FROM agent_tokens WHERE project_id = $1 ORDER BY created_at DESC",
    [projectId]
  );
  return result.rows;
}

export async function rotateProjectToken(founderId: string, projectId: string) {
  await assertProjectOwner(founderId, projectId);
  const token = createToken(projectId);
  const db = getDatabase();
  await db.query("BEGIN");
  try {
    await db.query("UPDATE agent_tokens SET revoked_at = now() WHERE project_id = $1 AND revoked_at IS NULL", [projectId]);
    await db.query("INSERT INTO agent_tokens (id, project_id, token_hash, scopes) VALUES ($1, $2, $3, $4)", [token.id, projectId, token.tokenHash, defaultScopes]);
    await db.query("INSERT INTO audit_events (action_id, project_id, actor_token_id, scope, action_type, target_type, status, message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [`act_${randomUUID().slice(0, 12)}`, projectId, token.id, "project:read", "token.rotate", "token", "success", "Founder rotated agent key"]);
    await db.query("COMMIT");
    return { tokenId: token.id, token: token.rawToken, scopes: defaultScopes };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

export async function revokeProjectToken(founderId: string, projectId: string, tokenId: string) {
  await assertProjectOwner(founderId, projectId);
  const result = await getDatabase().query("UPDATE agent_tokens SET revoked_at = now() WHERE id = $1 AND project_id = $2 AND revoked_at IS NULL", [tokenId, projectId]);
  if (!result.rowCount) throw new VibebaseError("RESOURCE_NOT_FOUND", "Active agent key not found for this project.", 404);
  await getDatabase().query("INSERT INTO audit_events (action_id, project_id, actor_token_id, scope, action_type, target_type, status, message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [`act_${randomUUID().slice(0, 12)}`, projectId, tokenId, "project:read", "token.revoke", "token", "success", "Founder revoked agent key"]);
}

async function createSession(founderId: string) {
  const raw = `vbs_${randomBytes(32).toString("base64url")}`;
  await getDatabase().query("INSERT INTO sessions (founder_id, token_hash, expires_at) VALUES ($1, $2, now() + ($3 * interval '1 day'))", [founderId, hashToken(raw), SESSION_DAYS]);
  return raw;
}

async function assertProjectOwner(founderId: string, projectId: string) {
  const result = await getDatabase().query("SELECT 1 FROM projects WHERE id = $1 AND founder_id = $2", [projectId, founderId]);
  if (!result.rowCount) throw new VibebaseError("RESOURCE_NOT_FOUND", "Project not found.", 404);
}

async function getFounder(founderId: string) {
  const result = await getDatabase().query<{ id: string; name: string; email: string }>("SELECT id, name, email FROM founders WHERE id = $1", [founderId]);
  const founder = result.rows[0];
  if (!founder) throw new VibebaseError("TOKEN_INVALID", "Founder session is no longer valid.", 401);
  return { name: founder.name, email: founder.email };
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(actual, Buffer.from(expected, "hex"));
}

function normalizeName(value: string, label: string) {
  const normalized = value?.trim();
  if (!normalized || normalized.length > 80) throw new VibebaseError("VALIDATION_ERROR", `${label} must be between 1 and 80 characters.`, 400);
  return normalized;
}

function normalizeEmail(value: string) {
  const email = value?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new VibebaseError("VALIDATION_ERROR", "A valid email is required.", 400);
  return email;
}

function validatePassword(value: string) {
  if (typeof value !== "string" || value.length < 12) throw new VibebaseError("VALIDATION_ERROR", "Password must be at least 12 characters.", 400);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 24) || "project";
}

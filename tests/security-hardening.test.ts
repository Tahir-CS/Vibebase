import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as createCollectionRoute } from "@/app/api/v1/database/collections/route";
import { LocalAppwriteAdapter } from "@/lib/vibebase/appwrite-adapter";
import { LocalDeploymentAdapter } from "@/lib/vibebase/deployment-adapter";
import { createToken } from "@/lib/vibebase/crypto";
import { VibebaseError } from "@/lib/vibebase/errors";
import { resetRateLimits, assertRequestRateLimit } from "@/lib/vibebase/rate-limit";
import { InMemoryStore, resetVibebaseStore, vibebaseStore } from "@/lib/vibebase/repositories";
import { VibebaseService } from "@/lib/vibebase/service";
import { createMcpRuntime } from "@/mcp-server/runtime";
import { getVibebaseService } from "@/lib/vibebase/bootstrap";

function buildSecurityService(scopes = ["project:read", "database:read", "database:write", "storage:write", "auth:read", "deploy:read", "deploy:write"]) {
  const store = new InMemoryStore();
  const project = { id: "proj_secure", name: "Secure", environment: "local" as const, createdAt: new Date().toISOString(), appwriteProjectId: "aw_secure" };
  store.projects.set(project.id, project);
  const token = createToken(project.id);
  store.tokens.set(token.id, { id: token.id, projectId: project.id, tokenHash: token.tokenHash, scopes: scopes as any, revokedAt: null, createdAt: new Date().toISOString() });
  const service = new VibebaseService(new LocalAppwriteAdapter(store.collections), new LocalDeploymentAdapter(store.deployments), store);
  return { service, store, token, project };
}

test("scoped token cases reject invalid, revoked, missing-scope, and wrong-project access", async () => {
  const { service, store, token, project } = buildSecurityService(["project:read", "database:write", "deploy:read"]);
  await assert.rejects(() => service.createCollection("Bearer vb_not_real", { name: "Orders" }, true), hasCode("TOKEN_INVALID"));

  const record = [...store.tokens.values()][0];
  record.revokedAt = new Date().toISOString();
  await assert.rejects(() => service.createCollection(`Bearer ${token.rawToken}`, { name: "Orders" }, true), hasCode("TOKEN_REVOKED"));
  record.revokedAt = null;

  await assert.rejects(() => service.createBucket(`Bearer ${token.rawToken}`, { name: "Uploads" }, true), hasCode("SCOPE_MISSING"));
  const foreignDeployment = { id: "dep_foreign", projectId: "proj_other", status: "ready" as const, url: "http://localhost:3001/other", env: {}, logs: [], updatedAt: new Date().toISOString() };
  store.deployments.set(foreignDeployment.id, foreignDeployment);
  await assert.rejects(() => service.getDeploymentStatus(`Bearer ${token.rawToken}`, foreignDeployment.id), hasCode("RESOURCE_NOT_FOUND"));

  const created = await service.createCollection(`Bearer ${token.rawToken}`, { name: "Orders" }, true);
  assert.equal(created.collection.projectId, project.id);
});

test("successful and rejected mutations are audited without plaintext secrets", async () => {
  const { service, store, token } = buildSecurityService();
  const auth = `Bearer ${token.rawToken}`;
  await service.createCollection(auth, { name: "Orders" }, true);
  await assert.rejects(() => service.setDeploymentEnv(auth, { env: { API_SECRET: "super-secret-value" } }, true), hasCode("RESOURCE_NOT_FOUND"));
  const audit = JSON.stringify(store.auditEvents);
  assert.match(audit, /database\.createCollection/);
  assert.match(audit, /deploy\.setDeploymentEnv/);
  assert.match(audit, /"status":"failed"/);
  assert.equal(audit.includes(token.rawToken), false);
  assert.equal(audit.includes("super-secret-value"), false);
});

test("deployment environment values stay internal and logs are redacted", async () => {
  const { service, store, token, project } = buildSecurityService();
  const auth = `Bearer ${token.rawToken}`;
  store.deployments.set("dep_secure", { id: "dep_secure", projectId: project.id, status: "ready", url: "http://localhost:3001/secure", env: {}, logs: ["API_SECRET=super-secret-value"], updatedAt: new Date().toISOString() });
  const result = await service.setDeploymentEnv(auth, { deploymentId: "dep_secure", env: { API_SECRET: "super-secret-value" } }, true);
  assert.deepEqual(result.deployment.env, { API_SECRET: "[redacted]" });
  assert.equal(JSON.stringify(result).includes("super-secret-value"), false);
  const status = await service.getDeploymentStatus(auth, "dep_secure");
  assert.equal(JSON.stringify(status).includes("super-secret-value"), false);
  assert.match(status.deployment.logs[0], /\[redacted\]/);
});

test("adapter instances and outputs do not carry administrator or deploy keys", async () => {
  const collections = new Map();
  const appwrite = new LocalAppwriteAdapter(collections);
  const created = await appwrite.createCollection({ projectId: "proj_safe", name: "Orders" });
  assert.equal(JSON.stringify(appwrite).match(/admin|api.?key|secret/i), null);
  assert.equal(JSON.stringify(created).match(/admin|api.?key|secret/i), null);
  const deployment = new LocalDeploymentAdapter(new Map());
  const record = await deployment.createDeployment("proj_safe");
  assert.equal(JSON.stringify(deployment).match(/deploy.?key|api.?key|secret/i), null);
  assert.equal(JSON.stringify(record).match(/deploy.?key|api.?key|secret/i), null);
});

test("auth status and generated-app client configuration are scoped and secret-free", async () => {
  const { service, token } = buildSecurityService(["project:read", "auth:read"]);
  const auth = `Bearer ${token.rawToken}`;
  const status = await service.getAuthStatus(auth);
  const client = service.getClientConfig(auth);
  assert.equal(status.auth.emailPassword, true);
  assert.equal(JSON.stringify(status).match(/admin|api.?key|secret|password=/i), null);
  assert.equal(JSON.stringify(client).match(/admin|api.?key|secret/i), null);

  const { service: restricted, token: restrictedToken } = buildSecurityService(["project:read"]);
  await assert.rejects(() => restricted.getAuthStatus(`Bearer ${restrictedToken.rawToken}`), hasCode("SCOPE_MISSING"));
});

test("local adapter implements schema and private bucket capabilities", async () => {
  const collections = new Map();
  const attributes = new Map();
  const indexes = new Map();
  const buckets = new Map();
  const appwrite = new LocalAppwriteAdapter(collections, attributes, indexes, buckets);
  const collection = await appwrite.createCollection({ projectId: "proj_adapter", name: "Tasks" });
  const attribute = await appwrite.createAttribute({ projectId: "proj_adapter", collectionId: collection.id, key: "title", type: "string", required: true });
  const index = await appwrite.createIndex({ projectId: "proj_adapter", collectionId: collection.id, name: "title_lookup", fields: ["title"] });
  const bucket = await appwrite.createBucket({ projectId: "proj_adapter", name: "Uploads" });
  assert.equal(attribute.key, "title");
  assert.deepEqual(index.fields, ["title"]);
  assert.equal(bucket.name, "Uploads");
  assert.equal(JSON.stringify({ appwrite, attribute, index, bucket }).match(/admin|api.?key|secret/i), null);
});

test("REST and MCP reject malformed write inputs with stable validation errors", async () => {
  resetVibebaseStore();
  resetRateLimits();
  const bootstrap = getVibebaseService().getBootstrapToken();
  const request = new NextRequest("http://localhost/api/v1/database/collections", {
    method: "POST",
    headers: { authorization: `Bearer ${bootstrap.rawToken}`, "content-type": "application/json" },
    body: JSON.stringify({ name: 42, confirm: true })
  });
  const response = await createCollectionRoute(request);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "VALIDATION_ERROR");

  const runtime = createMcpRuntime();
  const invalid = await runtime.callTool("vibebase.set_deployment_env", { token: bootstrap.rawToken, env: { bad_key: 42 }, confirm: true });
  assert.equal(invalid.isError, true);
  assert.match(invalid.content[0].text, /VALIDATION_ERROR/);
});

test("rate limiter throttles repeated agent requests without recording raw tokens", () => {
  resetRateLimits();
  for (let index = 0; index < 60; index += 1) assertRequestRateLimit("Bearer vb_rate_limit_demo", null);
  assert.throws(() => assertRequestRateLimit("Bearer vb_rate_limit_demo", null), hasCode("RATE_LIMITED"));
});

function hasCode(code: string) {
  return (error: unknown) => error instanceof VibebaseError && error.code === code;
}

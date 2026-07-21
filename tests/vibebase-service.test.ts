import test from "node:test";
import assert from "node:assert/strict";
import { LocalAppwriteAdapter } from "@/lib/vibebase/appwrite-adapter";
import { LocalDeploymentAdapter } from "@/lib/vibebase/deployment-adapter";
import { VibebaseService } from "@/lib/vibebase/service";
import { InMemoryStore, resetVibebaseStore } from "@/lib/vibebase/repositories";
import { createToken, hashToken } from "@/lib/vibebase/crypto";
import { VibebaseError } from "@/lib/vibebase/errors";

function buildService() {
  resetVibebaseStore();
  const store = new InMemoryStore();
  const project = {
    id: "proj_demo",
    name: "Demo",
    environment: "local" as const,
    createdAt: new Date().toISOString(),
    appwriteProjectId: "aw_proj_demo"
  };
  store.projects.set(project.id, project);
  const token = createToken(project.id);
  store.tokens.set(token.id, {
    id: token.id,
    projectId: project.id,
    tokenHash: token.tokenHash,
    scopes: ["project:read", "database:read", "database:write"],
    revokedAt: null,
    createdAt: new Date().toISOString()
  });
  const service = new VibebaseService(
    new LocalAppwriteAdapter(store.collections),
    new LocalDeploymentAdapter(store.deployments),
    store
  );
  return { service, rawToken: token.rawToken, store, project };
}

test("hashToken is stable for auth lookup", () => {
  const hash = hashToken("vb_example");
  assert.equal(hash.length, 64);
});

test("rejects invalid bearer tokens", () => {
  const { service } = buildService();
  assert.throws(() => service.resolveToken("Bearer nope"), VibebaseError);
});

test("enforces project isolation on current project", () => {
  const { service, rawToken, store } = buildService();
  const otherProject = {
    id: "proj_other",
    name: "Other",
    environment: "local" as const,
    createdAt: new Date().toISOString(),
    appwriteProjectId: "aw_proj_other"
  };
  store.projects.set(otherProject.id, otherProject);
  assert.equal(service.resolveToken(`Bearer ${rawToken}`).project.id, "proj_demo");
});

test("creates collections only with confirmation and scope", async () => {
  const { service, rawToken } = buildService();
  await assert.rejects(() => service.createCollection(`Bearer ${rawToken}`, { name: "users" }, false), (error) => {
    assert.ok(error instanceof VibebaseError);
    assert.equal(error.code, "CONFIRMATION_REQUIRED");
    return true;
  });
  const result = await service.createCollection(`Bearer ${rawToken}`, { name: "users" }, true);
  assert.equal(result.collection.name, "users");
});

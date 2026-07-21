import test from "node:test";
import assert from "node:assert/strict";
import { createMcpRuntime } from "@/mcp-server/runtime";
import { getVibebaseService } from "@/lib/vibebase/bootstrap";
import { resetVibebaseStore, vibebaseStore } from "@/lib/vibebase/repositories";

function getBootstrapToken() {
  const service = getVibebaseService();
  return service.getBootstrapToken().rawToken;
}

test("valid token can call an allowed MCP tool and create an audit event", async () => {
  resetVibebaseStore();
  const runtime = createMcpRuntime();
  const token = getBootstrapToken();
  const result = await runtime.callTool("vibebase.create_collection", {
    token,
    name: "Posts",
    confirm: true
  });
  assert.equal(result.isError, undefined);
  assert.match(result.content[0].text, /Posts/);

  const audit = await runtime.callTool("vibebase.get_audit_events", { token });
  assert.equal(audit.isError, undefined);
  assert.match(audit.content[0].text, /createCollection/);
});

test("missing scope is rejected", async () => {
  resetVibebaseStore();
  const runtime = createMcpRuntime();
  const token = getBootstrapToken();
  const tokenRecord = [...vibebaseStore.tokens.values()].find((record) => record.projectId === "proj_northstar");
  assert.ok(tokenRecord);
  tokenRecord.scopes = tokenRecord.scopes.filter((scope) => scope !== "storage:write");
  const result = await runtime.callTool("vibebase.create_bucket", {
    token,
    name: "Assets",
    confirm: true
  });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /SCOPE_MISSING|VALIDATION_ERROR/);
});

test("invalid token is rejected", async () => {
  resetVibebaseStore();
  const runtime = createMcpRuntime();
  const result = await runtime.callTool("vibebase.get_audit_events", {
    token: "vb_invalid_token"
  });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /TOKEN_INVALID/);
});

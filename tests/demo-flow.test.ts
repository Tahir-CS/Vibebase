import test from "node:test";
import assert from "node:assert/strict";
import { getVibebaseService } from "@/lib/vibebase/bootstrap";
import { resetVibebaseStore } from "@/lib/vibebase/repositories";
import { executeLocalTool } from "@/app/api/v1/local/tools/route";

test("local demo seed connects resources, deployment visibility, and an audit trail", async () => {
  resetVibebaseStore();
  const service = getVibebaseService();
  const bootstrap = service.getBootstrapToken();
  const auth = `Bearer ${bootstrap.rawToken}`;

  const initial = service.getDashboardSnapshot();
  assert.equal(initial.selectedProject?.resources.collections[0]?.name, "Customers");
  assert.equal(initial.selectedProject?.resources.buckets[0]?.name, "Assets");
  assert.equal(initial.selectedProject?.deployment?.status, "ready");

  await service.createCollection(auth, { name: "Orders" }, true);
  await service.createBucket(auth, { name: "Uploads" }, true);
  await service.deploy(auth, {}, true);

  const updated = service.getDashboardSnapshot();
  assert.equal(updated.selectedProject?.resources.collections.some((item) => item.name === "Orders"), true);
  assert.equal(updated.selectedProject?.resources.buckets.some((item) => item.name === "Uploads"), true);
  assert.equal(updated.selectedProject?.deployment?.logs.includes("Deployment triggered."), true);
  assert.equal(updated.selectedProject?.auditEvents.some((event) => event.actionType === "deploy.deploy"), true);
  assert.equal(JSON.stringify(updated).includes(bootstrap.rawToken), false);
});

test("a local project key is returned once and is not queued for another reveal", () => {
  resetVibebaseStore();
  const service = getVibebaseService();
  const project = service.createLocalDemoProject("Launchpad");
  assert.match(project.rawToken, /^vb_/);
  assert.equal(service.consumeDemoTokenReveal(project.project.id), null);
});

test("local MCP bridge creates a resource through the shared control-plane service", async () => {
  resetVibebaseStore();
  const service = getVibebaseService();
  const bootstrap = service.getBootstrapToken();
  const result = await executeLocalTool("vibebase.create_collection", {
    token: bootstrap.rawToken,
    name: "JudgeNotes",
    confirm: true
  });

  assert.ok("collection" in result);
  assert.equal(result.collection.name, "JudgeNotes");
  assert.equal(service.getDashboardSnapshot().selectedProject?.resources.collections.some((item) => item.name === "JudgeNotes"), true);
});

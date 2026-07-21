const token = process.argv.find((argument) => argument.startsWith("--token="))?.slice("--token=".length);
const apiUrl = process.env.VIBEBASE_LOCAL_API_URL ?? "http://localhost:3000/api";

if (!token) {
  process.stderr.write("Usage: npm run local:verify -- --token=vb_...\n");
  process.exit(1);
}

const request = async (path, options = {}) => {
  const response = await fetch(apiUrl.replace(/\/$/, "") + path, {
    ...options,
    headers: { authorization: "Bearer " + token, "content-type": "application/json", ...(options.headers ?? {}) }
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? "Local verification request failed.");
  return payload;
};

try {
  const project = await request("/v1/projects/current");
  const collection = await request("/v1/database/collections", { method: "POST", body: JSON.stringify({ name: "LocalNotes", confirm: true }) });
  const audit = await request("/v1/audit-events");
  process.stdout.write(JSON.stringify({ project: project.data.projectName, collection: collection.data.name, actionId: collection.actionId, auditEvents: audit.data.length }, null, 2) + "\n");
} catch (error) {
  process.stderr.write((error instanceof Error ? error.message : "Local verification failed.") + "\n");
  process.exit(1);
}

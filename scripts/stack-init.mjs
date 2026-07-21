import { spawnSync } from "node:child_process";

const run = (command, args, env = process.env) => {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32", env });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run("node", ["scripts/bootstrap-local.mjs"], { ...process.env, VIBEBASE_ENV_FILE: ".env.local-stack" });
run("node", ["scripts/appwrite-init.mjs"]);

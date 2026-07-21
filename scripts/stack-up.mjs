import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const appwriteCompose = resolve(process.cwd(), "infra", "appwrite", "appwrite", "docker-compose.yml");
const stackEnv = resolve(process.cwd(), ".env.local-stack");
if (!existsSync(appwriteCompose)) {
  process.stderr.write("Appwrite is not initialized. Run npm run stack:init first.\n");
  process.exit(1);
}

if (!existsSync(stackEnv)) {
  process.stderr.write("Local stack secrets are missing. Run npm run stack:init first.\n");
  process.exit(1);
}

const run = (args) => {
  const result = spawnSync("docker", args, { stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, VIBEBASE_ENV_FILE: ".env.local-stack" } });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run(["compose", "-f", appwriteCompose, "up", "-d", "--remove-orphans"]);
run(["compose", "--env-file", stackEnv, "up", "--build", "-d"]);

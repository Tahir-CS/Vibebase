import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const run = (args) => spawnSync("docker", args, { stdio: "inherit", shell: process.platform === "win32" });
const appwriteCompose = resolve(process.cwd(), "infra", "appwrite", "appwrite", "docker-compose.yml");
const vibebase = run(["compose", "down"]);
if (existsSync(appwriteCompose)) run(["compose", "-f", appwriteCompose, "down"]);
process.exit(vibebase.status ?? 1);

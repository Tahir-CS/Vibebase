import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const appwriteRoot = resolve(process.cwd(), "infra", "appwrite", "appwrite");
const composeFile = resolve(appwriteRoot, "docker-compose.yml");

if (existsSync(composeFile)) {
  process.stdout.write("Appwrite is already initialized. Use npm run stack:up.\n");
  process.exit(0);
}

mkdirSync(appwriteRoot, { recursive: true });
process.stdout.write("Starting the official Appwrite installer. Complete the one-time local setup at http://localhost:20080.\n");
const interactiveFlag = process.stdin.isTTY && process.stdout.isTTY ? "-it" : "-i";
const result = spawnSync("docker", [
  "run", interactiveFlag, "--rm",
  "--publish", "20080:20080",
  "--volume", "/var/run/docker.sock:/var/run/docker.sock",
  "--volume", `${appwriteRoot}:/usr/src/code/appwrite:rw`,
  "--entrypoint=install",
  "appwrite/appwrite:1.9.5"
], { stdio: "inherit", shell: process.platform === "win32" });

process.exit(result.status ?? 1);

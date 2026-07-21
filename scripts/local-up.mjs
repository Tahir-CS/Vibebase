import { spawnSync } from "node:child_process";

const result = spawnSync("docker", ["compose", "-f", "docker-compose.local.yml", "up", "--build", "-d"], {
  stdio: "inherit",
  shell: process.platform === "win32"
});

process.exit(result.status ?? 1);

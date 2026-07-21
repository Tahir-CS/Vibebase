import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";

const target = resolve(process.cwd(), process.env.VIBEBASE_ENV_FILE ?? ".env");

if (existsSync(target)) {
  process.stdout.write(".env already exists; no values were changed.\n");
  process.exit(0);
}

const secret = () => randomBytes(32).toString("base64url");
const contents = `VIBEBASE_ENV_FILE=${process.env.VIBEBASE_ENV_FILE ?? ".env"}
POSTGRES_DB=vibebase
POSTGRES_USER=vibebase
POSTGRES_PASSWORD=${secret()}
POSTGRES_PORT=5432
REDIS_PASSWORD=${secret()}
REDIS_PORT=6379
VIBEBASE_PORT=3000
VIBEBASE_SESSION_SECRET=${secret()}
APPWRITE_ENDPOINT=http://host.docker.internal/v1
APPWRITE_PROJECT_ID=unconfigured
APPWRITE_API_KEY=unconfigured
APPWRITE_DATABASE_ID=unconfigured
DOKPLOY_ENDPOINT=http://host.docker.internal:3000/api
DOKPLOY_API_KEY=unconfigured
DOKPLOY_ENVIRONMENT_ID=unconfigured
DOKPLOY_SERVER_ID=
`;

writeFileSync(target, contents, { encoding: "utf8", mode: 0o600 });
process.stdout.write(`Created ${target.split(/[\\/]/).pop()} with generated local secrets. Configure Appwrite and Dokploy values when their engines are ready.\n`);

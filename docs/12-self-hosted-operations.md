# Self-Hosted Local Operations

## What Runs Where

- `vibebase-web`: the VibeBase dashboard, founder APIs, REST control plane, and server-side adapters.
- `vibebase-postgres`: durable founders, HTTP-only sessions, projects, hashed agent keys, and audit events.
- `vibebase-redis`: a durable foundation for rate limiting and future ephemeral coordination.
- Appwrite: independently self-hosted backend engine. It is not embedded in VibeBase.
- Dokploy: independently installed on a Linux Docker host. It is not embedded in VibeBase.

For the active hackathon setup, Dokploy can run in the operator's Ubuntu VirtualBox VM. It is local development infrastructure, not a public SaaS deployment target. See `docs/13-current-build-context.md`.

## First Boot

1. Start Docker Desktop and wait until its engine reports as running.
2. In `D:\desktop\Hackathon`, run:

```powershell
npm install
npm run infra:init
npm run infra:up
docker compose ps
```

3. Open `http://localhost:3000` and create a founder account with a 12+ character password.
4. Sign up; VibeBase provisions the initial private workspace and shows its scoped key exactly once.
5. Bootstrap Appwrite using [infra/appwrite/README.md](../infra/appwrite/README.md), then set its server-only values in `.env`.
6. Bootstrap Dokploy using [infra/dokploy/README.md](../infra/dokploy/README.md), then set its server-only values in `.env`.
7. Recreate VibeBase after changing `.env`:

```powershell
docker compose up --build -d
```

## Validation

```powershell
npm run typecheck
npm test
npm run build
docker compose ps
docker compose logs vibebase --tail 100
```

The browser receives only the VibeBase dashboard/session and the intentional one-time agent-key reveal. `APPWRITE_API_KEY`, `DOKPLOY_API_KEY`, Redis passwords, database passwords, and full deployment environment values must never be copied into browser tools, MCP client configuration, source code, or screenshots.

## Backup And Recovery

V1 does not perform automated rollback. Take a PostgreSQL snapshot before schema changes or demos that matter:

```powershell
docker compose exec -T postgres pg_dump -U vibebase vibebase > vibebase-backup.sql
```

Restore only into a stopped/local replacement environment after reviewing the target database. Appwrite and Dokploy have their own storage/database backup procedures and must be backed up independently.

## Local-First Limits

This setup is self-hosted local infrastructure, not a hosted multi-tenant service. Production deployment still needs TLS, a Linux Dokploy host, externalized backups, a managed secret system, monitoring, incident procedures, and real provider lifecycle testing.

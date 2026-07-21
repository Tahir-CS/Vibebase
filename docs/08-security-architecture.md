# VibeBase Security and Architecture Guardrails

> Active decision override (2026-07-20): Dokploy is V2. Keep the deployment rules below as requirements for that future adapter, but do not add or demo Dokploy functionality in V1. See [docs/15-next-agent-handoff.md](15-next-agent-handoff.md).

This file is mandatory reading before implementation. VibeBase gives coding agents infrastructure power, so security cannot be added later as polish.

## Core rule

The coding agent receives only a scoped VibeBase token. It must never receive raw Appwrite admin keys, Dokploy API keys, database credentials, Stripe keys, SSH keys, or deployment provider secrets.

## Trust model

| Actor | Allowed | Forbidden |
| --- | --- | --- |
| Founder browser | Dashboard session, project metadata, token creation/revocation UI | Raw infrastructure credentials, plaintext token hashes, other users' data |
| Coding agent | Scoped REST/MCP actions through VibeBase | Direct Appwrite/Dokploy admin APIs, cross-project access, unscoped destructive actions |
| VibeBase API | Server-side access to Appwrite and Dokploy adapters | Returning infrastructure secrets to clients or agents |
| Appwrite | Backend data/auth/storage engine | Knowing VibeBase plaintext tokens |
| Dokploy | Deployment execution/status/log engine | Knowing VibeBase plaintext tokens |

## Token rules

- Generate high-entropy tokens with a `vb_` prefix.
- Reveal the full token exactly once.
- Store only a secure hash of the token.
- Scope every token to one VibeBase project.
- Every request must resolve to exactly one project before doing work.
- Support token revocation and rotation from V1.
- Do not put tokens in URLs, logs, client-side localStorage, screenshots, or error messages.
- Use scopes for every protected action: `project:*`, `database:*`, `storage:*`, `auth:*`, and `deploy:*`.

## Authorization rules

- Authenticate first, authorize second, validate input third, call adapters last.
- Never trust a project ID, collection ID, bucket ID, or deployment ID from the client until it is checked against the token's project.
- Default to deny when a scope, project mapping, or adapter capability is missing.
- Read operations and write operations must have separate scopes.
- Destructive operations require both the correct scope and `confirm: true`.

## Appwrite adapter rules

- Appwrite admin/server credentials live only on the VibeBase server.
- Agents must call VibeBase endpoints, not Appwrite endpoints.
- Map VibeBase project resources to Appwrite resources in one place, not scattered through route handlers.
- Normalize Appwrite errors before returning them to the agent.
- Do not leak Appwrite internal IDs unless they are safe and needed by the VibeBase contract.

## Dokploy adapter rules

- Dokploy API credentials live only on the VibeBase server.
- Agents must call VibeBase deployment endpoints, not Dokploy directly.
- V1 deployment support is intentionally narrow: create/connect target, set env vars, deploy, read status, read logs.
- Redact secrets from deployment logs before showing them in the dashboard or API.
- Do not allow arbitrary shell command execution through deployment inputs.
- Only allow deployment sources explicitly supported by the V1 demo.

## Audit log rules

- Every mutating action creates an audit event.
- Failed mutating attempts should also create an audit event when a project/token can be identified.
- Audit events should include action ID, project ID, actor token ID, scope, action type, target type, status, and timestamp.
- Audit events must not include plaintext secrets, raw tokens, passwords, private keys, or full environment variable values.
- API responses should include `actionId` so agents and founders can trace what happened.

## Secrets and environment variables

- Keep secrets server-side.
- Provide `.env.example` with placeholders only.
- Never commit real `.env` files.
- Treat deployment environment variables as secrets by default.
- Show secret values only at creation time when absolutely necessary; otherwise show names and redacted values.

## API and MCP design rules

- REST and MCP must use the same domain services and authorization logic.
- Do not implement separate security checks for MCP that can drift from REST.
- Validate request bodies with shared schemas.
- Use stable error codes: `TOKEN_INVALID`, `TOKEN_REVOKED`, `SCOPE_MISSING`, `VALIDATION_ERROR`, `CONFIRMATION_REQUIRED`, `RESOURCE_NOT_FOUND`, and `UPSTREAM_FAILURE`.
- Return safe, useful errors to agents without exposing stack traces or credentials.

## Architecture boundaries

- Route handlers should stay thin: parse request, authenticate, authorize, call service, return response.
- Domain services own business rules and audit logging.
- Adapters own Appwrite/Dokploy-specific calls.
- Shared contracts/types live in a shared package.
- Do not let frontend components call Appwrite or Dokploy admin APIs.
- Do not duplicate infrastructure logic in the dashboard and agent API.

## Dangerous actions

These actions require extra care:

- Delete collection, bucket, document, deployment, or project.
- Rotate or revoke tokens.
- Change auth settings.
- Update deployment environment variables.
- Trigger deployment.

For V1, destructive actions require `confirm: true`. If the action could break the demo project, return a preview first where feasible.

## Local-first limits

V1 is local/self-hosted demo infrastructure. Do not accidentally design it as if it already has production-grade multi-tenant isolation.

Hosted VibeBase later needs stronger isolation, secret management, billing limits, rate limits, backups, abuse prevention, and per-user infrastructure boundaries.

## Implementation checklist

Before merging implementation code, verify:

- No infrastructure admin secret is reachable from the browser bundle.
- No agent endpoint bypasses scope checks.
- Every write creates an audit event.
- Revoked tokens fail immediately.
- Logs and errors redact secrets.
- REST and MCP call the same service layer.
- Appwrite and Dokploy calls are isolated inside adapters.
- Local setup works from documented commands.

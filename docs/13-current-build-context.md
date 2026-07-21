# Current Build Context

Read this document after `AGENTS.md` and `README.md` before changing VibeBase. It records the active hackathon state without changing the V1 PRD or architecture decisions.

## Product Contract

VibeBase is the secure agent control plane above Appwrite. A founder signs in, receives one automatically provisioned private workspace, and reveals one scoped **VibeBase** agent token for a coding agent. The agent calls VibeBase REST or MCP tools; VibeBase applies project isolation, scope checks, validation, confirmation, safe errors, and audit logging before its server-side Appwrite adapter acts.

Never give a founder or coding agent an Appwrite admin key, database credential, deployment secret, SSH credential, or `.env` content.

## Current Local State

- The local UI runs with `npm run dev` at `http://localhost:3000` and has a repeatable local-demo fallback when PostgreSQL is unavailable.
- The self-contained local demo path is `npm run local:up`; it requires no provider accounts or `.env` values and routes MCP calls back through the running control plane. See [docs/14-local-demo.md](14-local-demo.md).
- The durable local stack is VibeBase, PostgreSQL, Redis, and the official self-hosted Appwrite Compose stack. See [docs/15-next-agent-handoff.md](15-next-agent-handoff.md).
- `npm run stack:init` and `npm run stack:up` now wrap the official local Appwrite installer/Compose stack alongside VibeBase, PostgreSQL, and Redis. The stack is isolated in ignored `.env.local-stack`; it requires one owner-only Appwrite installer/project/key/database bootstrap before real adapter calls can be demonstrated.
- Appwrite Cloud values have been added locally by the operator. Do not inspect, print, commit, or ask for their secret values. A configured integration needs `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, and `APPWRITE_DATABASE_ID`.
- The Appwrite adapter now supports provider-backed collection, attribute, index, and private-bucket creation when those server-only values are configured. It also exposes a scoped, secret-free client configuration/auth-status tool for generated applications. Live provider calls still need a harmless smoke test before being claimed in the recording.
- Dokploy and deployment automation are V2. Do not configure, demo, or claim them in V1. Existing deployment adapter code is an unverified local stub retained behind the architecture boundary.

## Demo Truth

The local demo and MCP fixture are the reliable hackathon recording path. They demonstrate one VibeBase token, shared REST/MCP authorization, validation, confirmation, Appwrite resource changes, and audit records.

Real provider connectivity is a staged integration. Do not claim that every Appwrite Auth/Storage operation, durable PostgreSQL-backed MCP token, or per-tenant provider mapping has already been verified until it has been implemented and tested against the configured providers.

## Hackathon Delivery

- Push the repository to GitHub for review and source delivery.
- GitHub Pages cannot host this Next.js API/MCP control plane. Use a server-capable host only after the live integration is ready.
- The immediate submission proof is a screen recording using `docs/10-local-demo.md` and `DEMO_CHECKLIST.md`.
- Show a real MCP-compatible coding agent calling VibeBase tools, but redact the one-time VibeBase key after copying it. Never record the `.env` file or provider dashboards with secrets visible.

## Next Safe Steps

1. Verify Appwrite with a harmless collection create/list path and a redacted audit event.
2. Complete provider-backed MCP routing and per-project provider resource mapping before calling the platform multi-tenant or production-ready.
3. Run `npm run typecheck`, `npm test`, and `npm run build` after code changes.

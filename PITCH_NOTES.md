# VibeBase Pitch Notes

## One-Liner

VibeBase gives an AI coding agent one scoped infrastructure key, so founders can go from idea to working backend and deployment without navigating a stack of admin dashboards.

## Target User

Early-stage, non-technical or lightly technical founders building an MVP with an AI coding agent. They can describe the product and evaluate momentum, but should not have to learn database permissions, storage setup, deployment configuration, or vendor credential management first.

## Wedge

The first wedge is local MVP infrastructure: a founder creates a project and one agent key; the agent creates collections and storage, triggers a deliberately narrow deployment flow, and VibeBase records what happened.

## V1 Features

- Local founder demo login and automatic private-workspace provisioning.
- One project-scoped VibeBase agent key, revealed intentionally once.
- Shared REST and MCP service layer with scoped authorization.
- Local Appwrite-style database/storage adapter and narrow Dokploy-style deployment adapter.
- Resource summary, deployment status/logs, and audit trail for founders.
- Validation, confirmation for writes, key redaction, rate limiting, and security-focused tests.

## Why Now

Coding agents have become capable enough to build product code quickly, but infrastructure still depends on vendor dashboards, credentials, and manual setup. The missing layer is not another database; it is a secure, agent-native control plane between the agent and existing infrastructure engines.

## Why VibeBase Is Not Appwrite Or Supabase

Appwrite and Supabase are excellent backend engines. VibeBase is the policy and workflow layer around infrastructure: it gives agents a narrow product contract, scopes every action to a project, hides provider credentials, records an audit trail, and gives founders a single calm view of what their agent changed.

## Future Roadmap

- V1.1: richer schema support, clearer deployment sources, searchable activity, and a starter app.
- V2: CLI onboarding, safe schema plan/apply flows, hosted multi-tenant infrastructure, monitoring, backups, and managed production controls.
- Later: deployment branches, regression checks, and platform intelligence.

## Risks And Mitigations

| Risk | V1 mitigation | Remaining work |
| --- | --- | --- |
| Agent overreach | Scoped project keys, explicit write confirmation, audit trail | Stronger approval workflows and policy controls in hosted V2 |
| Secret exposure | Server-side adapters, redacted env/log responses, no browser token persistence | Real secret manager and production credential rotation |
| Provider failures | Adapter boundary and safe upstream errors | Durable retries, health checks, rollback policies |
| Local demo state loss | Intentional in-memory reset makes recordings repeatable | Persistent metadata, backups, multi-user isolation |

## Honest Positioning

V1 is a local-first demo with local adapters. It proves the control-plane experience and security model; it is not yet hosted SaaS, a production multi-tenant system, or a replacement for Appwrite/Dokploy.

For the exact live-provider verification status at recording time, use `docs/13-current-build-context.md`. Never upgrade the claim boundary merely because provider credentials exist in a local `.env` file.

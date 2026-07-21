# VibeBase Engineering Guide

Read `README.md` and the documents in `docs/` before changing product code.

Read `docs/13-current-build-context.md` immediately after this file. It records the active local/integration state and the claims that are safe for the hackathon demo.

Before writing implementation code, read `docs/08-security-architecture.md`. It contains mandatory security and architecture rules for agent keys, Appwrite access, audit logs, and dangerous actions.

## Non-negotiable product principles

1. One human-facing goal: sign in and get one scoped agent key. VibeBase provisions the founder's initial private workspace automatically.
2. The agent performs backend configuration. Never require the founder to copy connection strings or click through setup wizards for standard operations.
3. The dashboard is a safety and visibility surface, not the primary control interface.
4. Start local-first and self-hostable. Hosted multi-tenant infrastructure is not required for the demo.
5. Keep V1 focused. Do not introduce V2 platform features without an explicit decision.

## V1 scope guardrails

- Build the V1 VibeBase control plane on top of Appwrite; do not fork or modify Appwrite. Dokploy is deferred to V2.
- Use an API token with least-privilege project scopes.
- Never expose Appwrite admin keys, database credentials, or deployment secrets to the browser or coding agent. The same rule applies to Dokploy when V2 begins.
- Every mutating agent action must create an audit-log entry.
- Confirm destructive actions through an explicit API flag or a human approval flow.
- Do not claim zero-config OAuth, payments, or fully managed cloud hosting until the real provider integrations exist.
- Treat the current provider environment as single-founder until durable per-project provider-resource mapping has been verified.

## Source of truth

- Requirements: `docs/01-prd-v1.md`
- Architecture: `docs/02-architecture.md`
- Agent interfaces: `docs/03-api-mcp-contract.md`
- Roadmap: `docs/05-roadmap.md`
- Decisions and tradeoffs: `docs/07-decisions.md`

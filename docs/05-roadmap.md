# VibeBase Roadmap

## V1: Local agent app infrastructure demo

The funding/demo release. It proves the core magic: a founder gets one key and their agent can safely configure a local Appwrite backend.

- Founder sign-up/sign-in.
- Automatic private-workspace provisioning.
- Scoped agent key creation, rotation, and revocation.
- REST API for database, storage, and limited auth configuration.
- MCP server exposing the most useful backend tools.
- Appwrite adapter running locally through Docker.
- Minimal founder dashboard with project status and audit log.
- Documentation and a scripted demo path.

## V1.1: Make the demo feel real

- More schema types and indexes.
- Agent-readable capability discovery and better errors.
- Resource summary and searchable activity history.
- Sample starter app that uses VibeBase.
- Exportable project configuration.

## V2: Production automation

- `npx vibebase init` and agent configuration installer.
- Stripe Connect onboarding and payment primitives for founders' apps.
- Background jobs, retries, scheduling, and workflow orchestration.
- Schema plan/apply workflow with migration history and safe previews.
- Monitoring, alerts, backups, rollback policies, and advanced deployment controls.
- Hosted multi-tenant VibeBase and managed project provisioning.
- Dokploy adapter, narrow deployment targets, environment management, deploy status, and logs.

## Later: Differentiating platform intelligence

- Isolated database branches per code branch.
- Automated regression checks and self-healing schema suggestions.
- AI-ready storage indexing/vector embedding.
- Multi-region deployment and managed production infrastructure.

## Why these are not V1

Most MVP founders first need a working database, auth, storage, a basic deployment path, and a safe way for their agent to configure them. Payments, queues, and self-healing are valuable when an app has traction or operational complexity. Building those first would delay proof of the central user value.

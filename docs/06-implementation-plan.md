# VibeBase Implementation Plan

## Phase 0: Product foundation

Deliverables:

- Confirm brand name and local development ports.
- Create monorepo structure.
- Add Docker Compose for Appwrite, Dokploy, and a local VibeBase app.
- Add `.env.example` with non-secret placeholders.
- Add a one-command local setup guide.

Exit condition: a new contributor can start the local dependency stack and open the empty VibeBase app.

## Phase 1: Founder control plane

Deliverables:

- Dashboard sign-up/sign-in.
- Project model and local Appwrite project mapping.
- Agent-key generation, secure hashing, reveal-once behavior, rotation, and revocation.
- Settings page and local environment health status.

Exit condition: a founder can sign in, receive an automatically provisioned workspace, and reveal a key.

## Phase 2: Agent API

Deliverables:

- Bearer-token middleware and scope enforcement.
- Appwrite adapter interface and first local implementation.
- Dokploy adapter interface and first local implementation.
- Database collection/attribute/document operations.
- Storage bucket/file operations.
- Deployment target, environment variable, deploy trigger, status, and log operations.
- Audit event persistence and standard error contract.

Exit condition: curl or a test client can create data resources and trigger a deployment using only a VibeBase key.

## Phase 3: MCP and dashboard visibility

Deliverables:

- MCP server backed by the same domain service as REST.
- Capability discovery tool.
- Activity timeline and resource summaries.
- Agent setup snippet and example prompts.

Exit condition: an MCP-compatible agent creates a resource, triggers a deploy, and the founder sees both in the dashboard.

## Phase 4: Demo hardening

Deliverables:

- End-to-end tests for token scope and revocation.
- Error states and destructive-action confirmation.
- Seed/demo script and screen-recording checklist.
- README setup guide and architecture explanation.

Exit condition: the demo can be run repeatedly from a clean local setup.

## Suggested repository shape

```text
apps/
  web/                 # Founder dashboard and REST API
  mcp-server/          # MCP transport and tool definitions
packages/
  core/                # Domain services, authorization, contracts
  appwrite-adapter/    # Backend-engine abstraction
  dokploy-adapter/     # Deployment-engine abstraction
  types/               # Shared schemas and API types
infra/
  docker/              # Compose and local Appwrite/Dokploy config
docs/
```

## Test strategy

- Unit: token hashing, scope checks, input validation, error mapping.
- Integration: VibeBase API against running local Appwrite and Dokploy dependency stacks.
- End-to-end: founder creates a key; simulated agent performs backend and deployment actions; founder sees audit records; key is revoked; follow-up agent request fails.

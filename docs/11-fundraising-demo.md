# VibeBase Fundraising Demo Narrative

## The Story In 45 Seconds

Founders can now ask an AI agent to build a product, but the agent still gets stuck at the boundary between code and infrastructure. It needs database setup, storage, environment configuration, deployment access, and credentials that founders should not have to manage or hand over.

VibeBase is the secure control plane for that moment. A founder creates a project and gives their agent one scoped VibeBase key. The agent uses a deliberate REST or MCP contract to create backend resources and trigger a narrow deployment flow. VibeBase keeps provider credentials server-side, scopes the work to one project, and gives the founder a readable record of what happened.

## Why Founders Need It

The founder should make one high-level choice: create the project and authorize the agent. They should not be asked to copy connection strings, grant a coding agent raw admin access, or navigate several configuration panels before validating an idea.

## Why AI Agents Make This Newly Possible

Agents can translate product requests into concrete infrastructure actions, but they need a constrained interface rather than unrestricted access to a provider account. VibeBase turns natural product work into an allowlisted, authenticated, auditable set of backend and deployment operations.

## Engines, Not The Product

Appwrite and Dokploy provide the backend and deployment primitives. VibeBase does not fork them. Its product value is the founder workflow, scoped agent authorization, adapter boundary, stable agent contract, audit trail, and safety posture across those engines.

## Recording Claim Boundaries

- Say: "VibeBase lets an agent configure a local backend and trigger a local deployment flow through one scoped key."
- Say: "The dashboard is the founder's visibility and safety surface."
- Do not say: "production ready," "managed cloud," "automatic rollback," "zero-config OAuth," or "fully hosted SaaS."
- The current implementation supports a repeatable local demo and staged provider integration. Do not claim provider-backed Auth/Storage/Deployment coverage, durable MCP token routing, or hosted multi-tenant controls until those paths have passed live verification.

## Security Beat

When the agent creates a collection or deploys, point out that VibeBase validates the scoped token, requires explicit confirmation for writes, adds an audit entry, and returns a safe response. The agent never sees Appwrite administrator keys, Dokploy API keys, database credentials, or full deployment environment values.

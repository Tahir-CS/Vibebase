# VibeBase V1 PRD

> Active decision override (2026-07-20): Dokploy and deployment automation are deferred to V2. For the active V1 scope, read [docs/15-next-agent-handoff.md](15-next-agent-handoff.md). Any deployment requirement below is retained as historical context, not an implementation requirement.

## Goal

Prove that a founder can provision an MVP backend and trigger a deployment through an AI coding agent using one VibeBase token, with Appwrite running locally as the backend engine and Dokploy as the deployment engine.

## Users

| User | Need | V1 outcome |
| --- | --- | --- |
| Founder | Start an app backend without configuration work | Signs in and copies one token from an automatically provisioned workspace |
| AI coding agent | A safe, documented surface for backend operations | Calls VibeBase REST endpoints or MCP tools |
| Builder/admin | Demonstrate the product locally | Runs the stack on one machine and sees every action |

## User stories

1. As a founder, I can sign up and sign in so my projects and tokens are private.
2. As a founder, I receive a private default workspace with its backend boundary when I sign up, without completing a setup wizard.
3. As a founder, I can create, reveal once, rotate, and revoke a scoped VibeBase token.
4. As an agent, I can validate the token and discover the project capabilities.
5. As an agent, I can create collections, fields, indexes, and document records through VibeBase.
6. As an agent, I can create storage buckets and upload or list files through VibeBase.
7. As an agent, I can enable a deliberately limited set of auth settings supported by the local demo.
8. As an agent, I can create a deployment target, set environment variables, trigger a deploy, and read deployment status/logs through VibeBase.
9. As a founder, I can inspect resources, token status, deployment status, and an understandable activity log.
10. As a founder, I can revoke access immediately if an agent behaves incorrectly.

## Functional requirements

### Identity and projects

- Email/password sign-up and sign-in for the VibeBase dashboard.
- A founder enters through one automatically provisioned private workspace; multi-project creation is not a primary V1 founder workflow.
- Provisioning a VibeBase workspace creates the mapped Appwrite project/configuration boundary through the control plane.
- Each project has an environment label: `local` for V1.

### Agent token

- Create project-scoped personal access tokens with named scopes.
- Reveal a full token exactly once at creation.
- Store only a secure hash of the token.
- Support token rotation and revocation.
- Require `Authorization: Bearer vb_...` on agent requests.

### Backend operations

- Database: create/list collections, attributes, indexes, and CRUD documents.
- Storage: create/list buckets and upload/list/delete files.
- Auth: expose project auth status and enable only providers that are actually configured for the local environment.
- Logs: return a timestamped audit record for every VibeBase control-plane action.

### Deployment operations

- Use Dokploy as the V1 deployment engine through a narrow VibeBase adapter.
- Create/list one deployment app or service per VibeBase project for the demo path.
- Set and update environment variables needed by the deployed app.
- Trigger a deployment from a configured source supported by the local demo.
- Read deployment status, URL, and recent logs.
- Do not expose raw Dokploy administration directly to the agent.

### Safety

- Read-only actions are immediately executable.
- Mutating actions require a valid scoped token and are audit logged.
- Destructive actions require `confirm: true` and return a clear preview where feasible.
- The initial demo operates only against local/self-hosted Appwrite and Dokploy instances; no arbitrary production cloud credentials are accepted or stored.

## Acceptance criteria

1. A new founder can obtain one token from the dashboard in under 60 seconds without creating a project manually.
2. A sample agent can call `GET /v1/capabilities` and create a collection using the token.
3. A sample agent can trigger a Dokploy-backed deployment through VibeBase and read status/logs.
4. The dashboard displays the created collection, deployment status, and audit events without refresh errors.
5. A revoked token can no longer access any endpoint.
6. The complete stack runs locally through documented commands.

## Metrics for the demo

- Time from sign-up to first successful agent action.
- Number of manual configuration steps required from the founder: target is zero after token creation.
- Successful agent actions / failed agent actions.
- Time to revoke a token.

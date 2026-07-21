# VibeBase API and MCP Contract

> Active decision override (2026-07-20): deployment endpoints and MCP tools are reserved for V2. V1 agent work targets Appwrite-backed database, storage, and safe auth/client configuration. See [docs/15-next-agent-handoff.md](15-next-agent-handoff.md).

## Design rules

- The REST API and MCP tools call the same internal service layer.
- The agent sees intentional VibeBase concepts, not raw Appwrite administrative APIs.
- Each response includes an action ID that links to the audit log.
- API versioning starts at `/v1`.

## Token scopes

| Scope | Permitted actions |
| --- | --- |
| `project:read` | Project, capability, and audit-log reads |
| `database:read` | Read schema and documents |
| `database:write` | Create/update collections, fields, indexes, documents |
| `storage:read` | Read bucket and file metadata |
| `storage:write` | Create buckets and upload/delete files |
| `auth:read` | Read supported auth configuration |
| `auth:write` | Change explicitly supported auth settings |
| `deploy:read` | Read deployment app, status, URL, and logs |
| `deploy:write` | Create/update deployment app, env vars, and trigger deploys |

## REST endpoints for V1

| Method | Endpoint | Scope | Purpose |
| --- | --- | --- |
| `GET` | `/v1/capabilities` | `project:read` | Discover supported actions and constraints |
| `GET` | `/v1/projects/current` | `project:read` | Get project metadata |
| `GET` | `/v1/database/collections` | `database:read` | List collections |
| `POST` | `/v1/database/collections` | `database:write` | Create collection |
| `POST` | `/v1/database/collections/{id}/attributes` | `database:write` | Add attribute |
| `POST` | `/v1/database/collections/{id}/documents` | `database:write` | Create document |
| `GET` | `/v1/storage/buckets` | `storage:read` | List buckets |
| `POST` | `/v1/storage/buckets` | `storage:write` | Create bucket |
| `POST` | `/v1/storage/buckets/{id}/files` | `storage:write` | Upload file |
| `GET` | `/v1/auth/configuration` | `auth:read` | Read enabled auth options |
| `PATCH` | `/v1/auth/configuration` | `auth:write` | Change supported auth options |
| `GET` | `/v1/deployments` | `deploy:read` | List deployment targets |
| `POST` | `/v1/deployments` | `deploy:write` | Create or connect a deployment target |
| `PATCH` | `/v1/deployments/{id}/env` | `deploy:write` | Set deployment environment variables |
| `POST` | `/v1/deployments/{id}/deploy` | `deploy:write` | Trigger a deployment |
| `GET` | `/v1/deployments/{id}` | `deploy:read` | Read deployment status and URL |
| `GET` | `/v1/deployments/{id}/logs` | `deploy:read` | Read recent deployment logs |
| `GET` | `/v1/audit-events` | `project:read` | List agent activity |

## Standard response envelope

```json
{
  "data": {},
  "actionId": "act_01J...",
  "message": "Collection created"
}
```

## Error contract

```json
{
  "error": {
    "code": "SCOPE_MISSING",
    "message": "This token cannot create storage buckets.",
    "actionId": "act_01J..."
  }
}
```

Use stable codes such as `TOKEN_INVALID`, `TOKEN_REVOKED`, `SCOPE_MISSING`, `VALIDATION_ERROR`, `CONFIRMATION_REQUIRED`, `RESOURCE_NOT_FOUND`, and `UPSTREAM_FAILURE`.

## Initial MCP tools

| MCP tool | API mapping | Notes |
| --- | --- | --- |
| `vibebase.get_capabilities` | `GET /v1/capabilities` | Agent calls this first |
| `vibebase.create_collection` | `POST /v1/database/collections` | Returns schema summary |
| `vibebase.add_attribute` | attribute endpoint | Validates types and required fields |
| `vibebase.create_document` | document endpoint | Uses explicit collection ID |
| `vibebase.create_bucket` | bucket endpoint | Defaults to private access |
| `vibebase.get_auth_status` | auth configuration endpoint | Returns supported app auth capabilities, never provider secrets |
| `vibebase.get_client_config` | project capability endpoint | Returns safe Appwrite client endpoint, project ID, and database ID for generated app code |
| `vibebase.create_deployment` | `POST /v1/deployments` | Creates/connects the demo deployment target |
| `vibebase.set_deployment_env` | deployment env endpoint | Stores env vars through VibeBase/Dokploy adapter |
| `vibebase.deploy` | deploy endpoint | Triggers the Dokploy-backed deployment |
| `vibebase.get_deployment_status` | deployment read endpoint | Returns URL, status, and latest action ID |
| `vibebase.get_auth_status` | auth configuration endpoint | Does not pretend unavailable providers work |
| `vibebase.get_logs` | audit-events endpoint | Allows agents to debug actions |

## Example agent setup

```bash
export VIBEBASE_API_TOKEN="vb_example_token"
export VIBEBASE_API_URL="http://localhost:3000/api"
```

The later CLI can automate this, but V1 should work through two environment variables so the demo is transparent and easy to debug.

## Generated App Boundary

An agent can use `vibebase.get_client_config` to generate an Appwrite client integration for the founder application. The response contains only public client values needed by the Appwrite SDK: endpoint, project ID, and database ID. It never contains an Appwrite API key, VibeBase token hash, provider secret, or deployment credential. End-user email/password sign-up and sign-in happen from the generated app through Appwrite's public client APIs.

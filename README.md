# VibeBase

VibeBase is a local-first control plane for coding agents. A founder signs in, receives one scoped VibeBase token, and gives that token to an agent. The agent can request backend changes through VibeBase without receiving Appwrite administrator keys, database passwords, or `.env` values.

## What works today

- Local VibeBase dashboard at `http://localhost:3000`.
- Scoped founder/agent token flow.
- REST and MCP interfaces using the same authorization, validation, audit, and adapter layer.
- Real collection creation through the VibeBase control plane.
- Audit events for mutating actions.
- Local PostgreSQL and Redis services.
- Optional integration with a self-hosted Appwrite stack.

This repository is a V1 control-plane foundation. It is not yet a full Appwrite or Supabase feature replacement.

## Requirements

- Docker Desktop with the Linux engine enabled.
- Node.js 20 or newer.
- npm.

## Fast local demo

This path does not require Appwrite credentials and is recommended for development or a short review.

```powershell
npm install
npm run local:up
```

Open [http://localhost:3000](http://localhost:3000), sign in, and reveal the scoped VibeBase token only when handing it to an agent.

To run the local MCP bridge manually:

```powershell
npm run local:mcp
```

Codex can load the project MCP configuration from `.codex/config.toml` after the repository is trusted. Other MCP clients can run the same `npm run local:mcp` command from the repository.

Ask the agent to create a collection with an explicit confirmation, then request the latest audit events. Never paste an Appwrite key, database credential, or `.env` value into an agent conversation.

Stop the local demo with:

```powershell
npm run local:down
```

## Full self-hosted integration

The full path adds the official self-hosted Appwrite stack to VibeBase. It is resource-intensive and may need several gigabytes of available memory.

```powershell
npm install
npm run stack:init
npm run stack:up
```

The installer opens at `http://localhost:20080`. Complete only the local Appwrite owner/project bootstrap, then store the required server-side values in the generated, ignored `.env.local-stack` file. Do not commit that file or share its contents.

Use `npm run stack:down` to stop the stack. Do not use volume-removing commands if you need to preserve local data.

To test the real agent-to-Appwrite flow, leave the stack running and start the MCP bridge in a second terminal:

```powershell
npm run stack:mcp
```

Then configure or trust the repository in an MCP-capable coding agent and call the VibeBase tools. The agent token is passed to the tool call; Appwrite server keys remain in `.env.local-stack` and are never shared with the agent.

## REST and MCP

REST is the universal interface. MCP provides typed tools for compatible coding agents. Both routes use the same VibeBase service layer.

The current demonstrated REST operations are collection creation and audit-event retrieval. The MCP equivalents are:

- `vibebase.create_collection`
- `vibebase.get_audit_events`

The token is passed to a tool or API request only. It must not be placed in source code, URLs, committed configuration, browser storage, or logs.

## Troubleshooting

If Docker commands report that the Linux engine is unavailable, open Docker Desktop and wait until the engine is running.

If port `3000` is already allocated, stop only the old VibeBase web container before retrying:

```powershell
docker stop vibebase-web
npm run local:up
```

If the full Appwrite stack is too heavy for the machine, use the fast local demo path instead.

## Checks

```powershell
npm run typecheck
npm test
npm run build
```

## Security boundaries

- The browser receives only the intentional one-time VibeBase token reveal.
- Provider credentials stay server-side.
- Mutating actions require scoped authorization, validation, explicit confirmation where appropriate, and an audit event.
- The agent is never given Appwrite administrator keys, database credentials, or provider secrets.

## Future scope

Planned expansion is incremental and will preserve the same REST/MCP service layer:

1. Database documents, attributes, indexes, and queries.
2. Storage buckets and file operations.
3. Authentication, teams, and permission workflows.
4. Functions, messaging, webhooks, and additional provider adapters.
5. Hosted infrastructure and deployment automation as a later version.

Each capability will be added with authorization rules, validation, audit coverage, integration tests, and confirmation for destructive operations.

## Project docs

- [Product requirements](docs/01-prd-v1.md)
- [Architecture](docs/02-architecture.md)
- [REST and MCP contract](docs/03-api-mcp-contract.md)
- [Security architecture](docs/08-security-architecture.md)
- [Current build context](docs/13-current-build-context.md)
- [Local demo guide](docs/14-local-demo.md)

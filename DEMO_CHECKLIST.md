# VibeBase Demo Checklist

This checklist is for the local-first V1 screen recording. It demonstrates a scoped control plane, not a hosted production service. Read [docs/13-current-build-context.md](docs/13-current-build-context.md) before recording. Do not show a real token, `.env` file, terminal scrollback containing a token, or any infrastructure credentials.

## Before Recording

```bash
npm install
npm run typecheck
npm test
npm run build
```

Start two terminals:

```bash
npm run dev
```

```bash
npm run mcp
```

Open `http://localhost:3000`. Use a fresh dev-server start if you need reset demo state; all local demo state is in memory.

For a real MCP client, point its local stdio configuration at `npm run mcp` in `D:\desktop\Hackathon`. Keep the copied VibeBase key out of the configuration file; provide it only as the tool's `token` argument.

## Screen Recording Steps

1. Show the landing page and say: "VibeBase gives a founder one scoped key for their coding agent."
2. Select **Continue as demo founder**.
3. Show the automatically provisioned private workspace and reveal its agent key.
4. Copy the agent key. Blur, crop, or move away from it before the next shot. Never leave the full value visible in the finished video.
5. Show the workspace's resource cards, deployment status/logs, and audit trail. Explain that these are founder visibility surfaces, not an infrastructure console.
6. In an MCP-compatible agent, use the copied key to call `vibebase.create_collection` with `Orders` and `confirm: true`. Record the agent request and safe tool response, not the full key.
7. Call `vibebase.create_bucket` with `Uploads` and `confirm: true`.
8. Call `vibebase.deploy` with `confirm: true`, followed by `vibebase.get_deployment_status`.
9. Return to the founder dashboard and select **Refresh view**. Show the new resource, deployment log, and audit events with action IDs.
10. Close with the security boundary: the agent received a VibeBase token, never Appwrite admin keys, Dokploy keys, database credentials, or raw deployment secrets.

## Demo Agent Prompts

Use the MCP client configured with the copied local key:

```text
Use VibeBase to create an Orders collection and an Uploads bucket. Confirm all writes. Then trigger the project's local deployment and report the status and action IDs.
```

## Recovery Notes

- Restart `npm run dev` to reset in-memory founder/project/demo data.
- There is no automatic rollback in V1. For a clean demo state, restart the local app rather than attempting infrastructure recovery.
- The local adapters provide repeatable demo state. Only claim a live Appwrite/Dokploy result after that exact provider action has been verified in the configured environment.

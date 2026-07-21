# VibeBase Local Demo Script

This is a local-only V1 recording. Do not show real credentials, `.env` files, terminal history containing a key, or the full agent key after the copy moment. See `docs/13-current-build-context.md` for current integration boundaries.

## Setup

1. Run `npm install`.
2. Start the dashboard with `npm run dev`.
3. In another terminal, start the MCP server with `npm run mcp`.
4. Open `http://localhost:3000`.

GitHub is the code-delivery surface for this recording. Do not attempt to use GitHub Pages for the live control plane because it cannot run the VibeBase server APIs or MCP process.

## Recording flow

1. Open the landing screen and explain: "The founder gets one scoped VibeBase key; the agent does the infrastructure work."
2. Select **Continue as demo founder**. Point out the compact project overview and that Appwrite/Dokploy stay behind the VibeBase control plane.
3. Select **Reveal demo key**, copy it, then move away from the visible key before continuing the recording. Explain that it is not saved in browser storage and must not be committed.
4. Show the seeded `Customers` collection, `Assets` bucket, ready local deployment URL, and existing audit events.
5. In an MCP-compatible agent, run the local `npm run mcp` command and call `vibebase.create_collection` with the copied token, a resource name such as `Orders`, and `confirm: true`.
6. Call `vibebase.create_bucket` with `Uploads` and `confirm: true`.
7. Call `vibebase.deploy` with `confirm: true`, then `vibebase.get_deployment_status`.
8. Refresh the founder dashboard. Show `Orders`, `Uploads`, the deployment log, and matching audit entries/action IDs.
9. Close by explaining that the agent used one scoped VibeBase key and never received Appwrite admin keys, Dokploy keys, database credentials, or deployment secrets.

## Example MCP calls

```json
{
  "name": "vibebase.create_collection",
  "arguments": {
    "token": "vb_<copied-local-key>",
    "name": "Orders",
    "confirm": true
  }
}
```

```json
{
  "name": "vibebase.deploy",
  "arguments": {
    "token": "vb_<copied-local-key>",
    "confirm": true
  }
}
```

## Verification checklist

- The dashboard never logs, persists, or later re-fetches the full key.
- Resource summaries, deployment status/logs, and audit events belong to the selected project only.
- MCP write actions return an action ID and appear in the dashboard audit trail.
- Dashboard logs and audit messages redact secret-looking values.

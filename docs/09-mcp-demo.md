# VibeBase MCP Demo

Use the local bootstrap token from the dev server and call the MCP tools over stdio.

This is the agent-facing demo contract. The agent receives a VibeBase token only; it never receives provider credentials. Read `docs/13-current-build-context.md` before claiming provider-backed results.

## Start the server

```bash
npm run mcp
```

For an MCP-compatible desktop agent, register this repository as a local stdio server. Keep the token out of the configuration; pass it as a `token` argument to each tool call.

```json
{
  "mcpServers": {
    "vibebase": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "D:\\desktop\\Hackathon"
    }
  }
}
```

## Example tool flow

1. `vibebase.create_collection`
2. `vibebase.create_attribute`
3. `vibebase.get_audit_events`

## Example payload

```json
{
  "token": "vb_proj_northstar_example",
  "name": "Users",
  "confirm": true
}
```

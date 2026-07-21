# Local Demo Stack

The local demo stack is the self-contained VibeBase startup path. It uses the safe local adapters, so a developer can explore the control-plane and agent flow without provider keys or a `.env` file.

## Start

    npm install
    npm run local:up

Open http://localhost:3000.

## Agent Flow

1. Sign in locally or create a founder account.
2. VibeBase provisions the workspace and one scoped agent key.
3. Reveal and copy the key only when handing it to an agent.
4. In another terminal, start the local stdio MCP bridge.

    npm run local:mcp

5. Configure an MCP-capable coding agent to use that command. Pass the copied VibeBase key as the token argument, never a provider key.
6. Ask the agent to call vibebase.create_collection with name LocalNotes and confirm true.
7. Refresh the dashboard. The resource summary and audit timeline show the same control-plane action.

## Verify And Stop

    npm run local:verify -- --token=vb_PASTE_THE_DASHBOARD_KEY_HERE
    npm run local:down

The founder and agent receive only a scoped VibeBase token. Provider credentials are not present in the local demo stack. The browser does not persist the revealed token.

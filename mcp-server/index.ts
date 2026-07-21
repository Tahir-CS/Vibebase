import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createMcpRuntime } from "./runtime.js";

const runtime = createMcpRuntime();
const server = new Server(
  { name: "vibebase-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: runtime.listTools()
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => ({
  ...(await runtime.callTool(request.params.name as any, request.params.arguments ?? {}))
}));

const transport = new StdioServerTransport();
await server.connect(transport);

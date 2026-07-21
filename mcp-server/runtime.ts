import { VibebaseError } from "@/lib/vibebase/errors";
import { getVibebaseService } from "@/lib/vibebase/bootstrap";

export type McpToolName =
  | "vibebase.create_database"
  | "vibebase.create_collection"
  | "vibebase.create_attribute"
  | "vibebase.create_index"
  | "vibebase.create_bucket"
  | "vibebase.get_auth_status"
  | "vibebase.get_client_config"
  | "vibebase.create_deployment"
  | "vibebase.set_deployment_env"
  | "vibebase.deploy"
  | "vibebase.get_deployment_status"
  | "vibebase.get_audit_events";

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export function createMcpRuntime() {
  const service = getVibebaseService();
  const localApiUrl = process.env.VIBEBASE_LOCAL_API_URL;

  const tools: Array<{ name: McpToolName; description: string; inputSchema: Record<string, unknown> }> = [
    {
      name: "vibebase.create_database",
      description: "Create a project database in the local VibeBase control plane.",
      inputSchema: {
        type: "object",
        properties: {
          token: { type: "string" },
          name: { type: "string" },
          confirm: { type: "boolean" }
        },
        required: ["token", "name", "confirm"]
      }
    },
    {
      name: "vibebase.create_collection",
      description: "Create a collection under the current project.",
      inputSchema: {
        type: "object",
        properties: {
          token: { type: "string" },
          name: { type: "string" },
          confirm: { type: "boolean" }
        },
        required: ["token", "name", "confirm"]
      }
    },
    {
      name: "vibebase.create_attribute",
      description: "Create a collection attribute under the current project.",
      inputSchema: {
        type: "object",
        properties: {
          token: { type: "string" },
          collectionId: { type: "string" },
          key: { type: "string" },
          type: { type: "string" },
          required: { type: "boolean" },
          confirm: { type: "boolean" }
        },
        required: ["token", "collectionId", "key", "type", "confirm"]
      }
    },
    {
      name: "vibebase.create_index",
      description: "Create a collection index under the current project.",
      inputSchema: {
        type: "object",
        properties: {
          token: { type: "string" },
          collectionId: { type: "string" },
          name: { type: "string" },
          fields: { type: "array", items: { type: "string" } },
          confirm: { type: "boolean" }
        },
        required: ["token", "collectionId", "name", "fields", "confirm"]
      }
    },
    {
      name: "vibebase.create_bucket",
      description: "Create a storage bucket under the current project.",
      inputSchema: {
        type: "object",
        properties: {
          token: { type: "string" },
          name: { type: "string" },
          confirm: { type: "boolean" }
        },
        required: ["token", "name", "confirm"]
      }
    },
    {
      name: "vibebase.get_auth_status",
      description: "Read the supported Appwrite authentication capabilities without exposing provider credentials.",
      inputSchema: { type: "object", properties: { token: { type: "string" } }, required: ["token"] }
    },
    {
      name: "vibebase.get_client_config",
      description: "Read safe Appwrite client configuration for generated application code. No administrator credential is included.",
      inputSchema: { type: "object", properties: { token: { type: "string" } }, required: ["token"] }
    },
    {
      name: "vibebase.create_deployment",
      description: "Create or connect a narrow deployment target.",
      inputSchema: {
        type: "object",
        properties: {
          token: { type: "string" },
          name: { type: "string" },
          confirm: { type: "boolean" }
        },
        required: ["token", "name", "confirm"]
      }
    },
    {
      name: "vibebase.set_deployment_env",
      description: "Set deployment environment variables through the control plane.",
      inputSchema: {
        type: "object",
        properties: {
          token: { type: "string" },
          deploymentId: { type: "string" },
          env: { type: "object" },
          confirm: { type: "boolean" }
        },
        required: ["token", "env", "confirm"]
      }
    },
    {
      name: "vibebase.deploy",
      description: "Trigger a deployment through the narrow Dokploy adapter.",
      inputSchema: {
        type: "object",
        properties: {
          token: { type: "string" },
          deploymentId: { type: "string" },
          confirm: { type: "boolean" }
        },
        required: ["token", "confirm"]
      }
    },
    {
      name: "vibebase.get_deployment_status",
      description: "Read deployment status, URL, and logs.",
      inputSchema: {
        type: "object",
        properties: {
          token: { type: "string" },
          deploymentId: { type: "string" }
        },
        required: ["token"]
      }
    },
    {
      name: "vibebase.get_audit_events",
      description: "Read the project audit trail.",
      inputSchema: {
        type: "object",
        properties: {
          token: { type: "string" }
        },
        required: ["token"]
      }
    }
  ];

  return {
    listTools() {
      return tools;
    },
    async callTool(name: McpToolName, args: Record<string, unknown>): Promise<ToolResult> {
      try {
        if (localApiUrl) return await callLocalTool(localApiUrl, name, args);
        const authHeader = toBearer(args.token);
        const confirm = args.confirm === true;

        switch (name) {
          case "vibebase.create_database": {
            const result = await service.createDatabase(authHeader, { name: requireString(args.name, "name") }, confirm);
            return jsonResult(result);
          }
          case "vibebase.create_collection": {
            const result = await service.createCollection(authHeader, { name: requireString(args.name, "name") }, confirm);
            return jsonResult(result);
          }
          case "vibebase.create_attribute": {
            const result = await service.createAttribute(
              authHeader,
              {
                collectionId: requireString(args.collectionId, "collectionId"),
                key: requireString(args.key, "key"),
                type: requireType(args.type),
                required: args.required === true
              },
              confirm
            );
            return jsonResult(result);
          }
          case "vibebase.create_index": {
            const result = await service.createIndex(
              authHeader,
              {
                collectionId: requireString(args.collectionId, "collectionId"),
                name: requireString(args.name, "name"),
                fields: requireStringArray(args.fields, "fields")
              },
              confirm
            );
            return jsonResult(result);
          }
          case "vibebase.create_bucket": {
            const result = await service.createBucket(authHeader, { name: requireString(args.name, "name") }, confirm);
            return jsonResult(result);
          }
          case "vibebase.get_auth_status": {
            return jsonResult(await service.getAuthStatus(authHeader));
          }
          case "vibebase.get_client_config": {
            return jsonResult(service.getClientConfig(authHeader));
          }
          case "vibebase.create_deployment": {
            const result = await service.createDeployment(authHeader, { name: requireString(args.name, "name") }, confirm);
            return jsonResult(result);
          }
          case "vibebase.set_deployment_env": {
            const result = await service.setDeploymentEnv(
              authHeader,
              {
                deploymentId: asOptionalString(args.deploymentId),
                env: requireObject(args.env)
              },
              confirm
            );
            return jsonResult(result);
          }
          case "vibebase.deploy": {
            const result = await service.deploy(authHeader, { deploymentId: asOptionalString(args.deploymentId) }, confirm);
            return jsonResult(result);
          }
          case "vibebase.get_deployment_status": {
            const result = await service.getDeploymentStatus(authHeader, asOptionalString(args.deploymentId));
            return jsonResult(result);
          }
          case "vibebase.get_audit_events": {
            const result = service.listAuditEvents(authHeader);
            return jsonResult(result);
          }
        }
      } catch (error) {
        return errorResult(error);
      }
    }
  };
}

async function callLocalTool(apiUrl: string, name: McpToolName, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const baseUrl = apiUrl.replace(/\/$/, "");
    const token = requireString(args.token, "token");
    const headers = { "content-type": "application/json", authorization: `Bearer ${token}` };
    const request = name === "vibebase.create_collection"
      ? { url: baseUrl + "/v1/database/collections", init: { method: "POST", headers, body: JSON.stringify({ name: args.name, confirm: args.confirm === true }) } }
      : name === "vibebase.get_audit_events"
        ? { url: baseUrl + "/v1/audit-events", init: { headers } }
        : null;

    if (!request) {
      return {
        isError: true,
        content: [{ type: "text", text: JSON.stringify({ error: { code: "RESOURCE_NOT_FOUND", message: "This MCP tool is not available in the persistent stack yet." } }, null, 2) }]
      };
    }

    const response = await fetch(request.url, request.init);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        isError: true,
        content: [{ type: "text", text: JSON.stringify(payload.error ?? { code: "UPSTREAM_FAILURE", message: "Local control plane request failed." }, null, 2) }]
      };
    }
    return jsonResult(payload.data ?? payload);
  } catch {
    return {
      isError: true,
      content: [{ type: "text", text: JSON.stringify({ error: { code: "UPSTREAM_FAILURE", message: "Local control plane is unavailable." } }, null, 2) }]
    };
  }
}

function jsonResult(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function errorResult(error: unknown): ToolResult {
  if (error instanceof VibebaseError) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: { code: error.code, message: error.message } }, null, 2)
        }
      ]
    };
  }
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify({ error: { code: "UPSTREAM_FAILURE", message: "Unexpected failure." } }, null, 2) }]
  };
}

function toBearer(token: unknown) {
  return `Bearer ${requireString(token, "token")}`;
}

function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new VibebaseError("VALIDATION_ERROR", `${field} is required.`, 400);
  }
  return value.trim();
}

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requireObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new VibebaseError("VALIDATION_ERROR", "env must be an object.", 400);
  }
  return value as Record<string, string>;
}

function requireStringArray(value: unknown, field: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new VibebaseError("VALIDATION_ERROR", `${field} must be an array of strings.`, 400);
  }
  return value as string[];
}

function requireType(value: unknown) {
  const allowed = new Set(["string", "number", "boolean"]);
  if (typeof value !== "string" || !allowed.has(value)) {
    throw new VibebaseError("VALIDATION_ERROR", "type must be string, number, or boolean.", 400);
  }
  return value as "string" | "number" | "boolean";
}

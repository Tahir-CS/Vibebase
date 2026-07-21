export type Project = {
  id: string;
  name: string;
  environment: "local";
  agentStatus: "Ready";
  dataCollections: number;
  storageBuckets: number;
  deploymentStatus: "Idle" | "Provisioning" | "Ready";
  deploymentUrl: string;
  auditCount: number;
};

export type AuditEvent = {
  id: string;
  action: string;
  detail: string;
  status: "success" | "info";
  timestamp: string;
};

export function createDemoProject(name: string): Project {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "founder-project";

  return {
    id: `proj_${slug.slice(0, 16)}`,
    name: name.trim() || "Founder Project",
    environment: "local",
    agentStatus: "Ready",
    dataCollections: 2,
    storageBuckets: 1,
    deploymentStatus: "Ready",
    deploymentUrl: "http://localhost:3001",
    auditCount: 4
  };
}

export function createOneTimeToken(projectId: string) {
  const suffix = Math.random().toString(36).slice(2, 12).toUpperCase();
  return {
    value: `vb_${projectId}_${suffix}`,
    scope: "project:read database:read database:write storage:read storage:write deploy:read deploy:write"
  };
}

export function demoAuditEvents(projectName: string): AuditEvent[] {
  const now = new Date();
  return [
    {
      id: "act_01",
      action: "Project created",
      detail: `${projectName} mapped to local Appwrite and Dokploy adapters.`,
      status: "success",
      timestamp: now.toISOString()
    },
    {
      id: "act_02",
      action: "Agent key issued",
      detail: "Key revealed once with project-scoped access.",
      status: "success",
      timestamp: now.toISOString()
    },
    {
      id: "act_03",
      action: "Demo backend seeded",
      detail: "Collections, bucket, and deployment summary prepared for the founder view.",
      status: "info",
      timestamp: now.toISOString()
    }
  ];
}

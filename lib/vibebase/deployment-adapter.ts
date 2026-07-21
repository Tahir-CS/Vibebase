export type DeploymentRecord = {
  id: string;
  projectId: string;
  status: "idle" | "ready" | "deploying";
  url: string;
  env: Record<string, string>;
  logs: string[];
  updatedAt: string;
};

export type SafeDeploymentRecord = Omit<DeploymentRecord, "env" | "logs"> & {
  env: Record<string, "[redacted]">;
  logs: string[];
};

export interface DeploymentAdapter {
  createDeployment(projectId: string): Promise<DeploymentRecord>;
  setEnv(deploymentId: string, env: Record<string, string>): Promise<DeploymentRecord>;
  deploy(deploymentId: string): Promise<DeploymentRecord>;
  getDeploymentStatus(deploymentId: string): Promise<DeploymentRecord>;
}

export class LocalDeploymentAdapter implements DeploymentAdapter {
  constructor(private readonly deployments: Map<string, DeploymentRecord>) {}

  async createDeployment(projectId: string): Promise<DeploymentRecord> {
    const record: DeploymentRecord = {
      id: `dep_${projectId}`,
      projectId,
      status: "ready",
      url: `http://localhost:3001/${projectId}`,
      env: {},
      logs: ["Deployment target connected."],
      updatedAt: new Date().toISOString()
    };
    this.deployments.set(record.id, record);
    return record;
  }

  async setEnv(deploymentId: string, env: Record<string, string>): Promise<DeploymentRecord> {
    const current = this.deployments.get(deploymentId);
    if (!current) {
      throw new Error("Deployment not found.");
    }
    const next = {
      ...current,
      env: { ...current.env, ...env },
      updatedAt: new Date().toISOString()
    };
    this.deployments.set(deploymentId, next);
    return next;
  }

  async deploy(deploymentId: string): Promise<DeploymentRecord> {
    const current = this.deployments.get(deploymentId);
    if (!current) {
      throw new Error("Deployment not found.");
    }
    const next = {
      ...current,
      status: "deploying" as const,
      logs: [...current.logs, "Deployment triggered."],
      updatedAt: new Date().toISOString()
    };
    this.deployments.set(deploymentId, next);
    return next;
  }

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentRecord> {
    const current = this.deployments.get(deploymentId);
    if (!current) {
      throw new Error("Deployment not found.");
    }
    return current;
  }
}

type DokployConfig = { endpoint: string; apiKey: string; environmentId: string; serverId?: string };

/** Narrow Dokploy adapter using its documented x-api-key application API. */
export class DokployServerAdapter implements DeploymentAdapter {
  readonly #endpoint: string;
  readonly #apiKey: string;
  readonly #environmentId: string;
  readonly #serverId?: string;
  readonly #records = new Map<string, DeploymentRecord>();

  constructor(config: DokployConfig) {
    this.#endpoint = config.endpoint.replace(/\/$/, "");
    this.#apiKey = config.apiKey;
    this.#environmentId = config.environmentId;
    this.#serverId = config.serverId;
  }

  async createDeployment(projectId: string): Promise<DeploymentRecord> {
    const name = `vibebase-${projectId.slice(-18)}`;
    const response = await this.#request("/application.create", { name, appName: name, environmentId: this.#environmentId, serverId: this.#serverId ?? null });
    const id = response.applicationId ?? response.$id ?? response.id;
    if (typeof id !== "string") throw new VibebaseError("UPSTREAM_FAILURE", "Dokploy returned an invalid deployment response.", 502);
    const record: DeploymentRecord = { id, projectId, status: "ready", url: "", env: {}, logs: ["Dokploy application created."], updatedAt: new Date().toISOString() };
    this.#records.set(id, record);
    return record;
  }

  async setEnv(deploymentId: string, env: Record<string, string>): Promise<DeploymentRecord> {
    const current = this.requireRecord(deploymentId);
    const serialized = Object.entries({ ...current.env, ...env }).map(([key, value]) => `${key}=${value}`).join("\n");
    await this.#request("/application.saveEnvironment", { applicationId: deploymentId, env: serialized, buildArgs: "", buildSecrets: "", createEnvFile: true });
    const next = { ...current, env: { ...current.env, ...env }, logs: [...current.logs, "Deployment environment updated [redacted]."], updatedAt: new Date().toISOString() };
    this.#records.set(deploymentId, next);
    return next;
  }

  async deploy(deploymentId: string): Promise<DeploymentRecord> {
    const current = this.requireRecord(deploymentId);
    await this.#request("/application.deploy", { applicationId: deploymentId });
    const next = { ...current, status: "deploying" as const, logs: [...current.logs, "Dokploy deployment triggered."], updatedAt: new Date().toISOString() };
    this.#records.set(deploymentId, next);
    return next;
  }

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentRecord> {
    return this.requireRecord(deploymentId);
  }

  private requireRecord(id: string) {
    const record = this.#records.get(id);
    if (!record) throw new VibebaseError("RESOURCE_NOT_FOUND", "Deployment not found.", 404);
    return record;
  }

  async #request(path: string, body: Record<string, unknown>) {
    let response: Response;
    try {
      response = await fetch(`${this.#endpoint}${path}`, { method: "POST", headers: { "content-type": "application/json", "x-api-key": this.#apiKey }, body: JSON.stringify(body), cache: "no-store" });
    } catch {
      throw new VibebaseError("UPSTREAM_FAILURE", "Dokploy is unavailable.", 502);
    }
    if (!response.ok) throw new VibebaseError("UPSTREAM_FAILURE", "Dokploy could not complete the requested operation.", 502);
    return response.json() as Promise<Record<string, unknown>>;
  }
}
import { VibebaseError } from "@/lib/vibebase/errors";

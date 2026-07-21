import { randomUUID } from "node:crypto";
import { VibebaseError } from "@/lib/vibebase/errors";
import { createToken, hashToken } from "@/lib/vibebase/crypto";
import type { AppwriteAdapter } from "@/lib/vibebase/appwrite-adapter";
import type { DeploymentAdapter, DeploymentRecord, SafeDeploymentRecord } from "@/lib/vibebase/deployment-adapter";
import type {
  AuditEvent,
  AttributeRecord,
  BucketRecord,
  ClientConfig,
  CollectionRecord,
  FounderRecord,
  IndexRecord,
  ProjectRecord,
  Scope,
  TokenRecord
} from "@/lib/vibebase/types";
import { vibebaseStore } from "@/lib/vibebase/repositories";

type AuthContext = {
  token: TokenRecord;
  project: ProjectRecord;
};

type CollectionInput = {
  name?: unknown;
};

export class VibebaseService {
  private defaultDeploymentId: string | null = null;

  constructor(
    private readonly appwrite: AppwriteAdapter,
    private readonly deployment: DeploymentAdapter,
    private readonly store = vibebaseStore
  ) {}

  seedDemo() {
    if (this.store.projects.size > 0) return;

    const founder: FounderRecord = {
      id: "founder_demo",
      email: "founder@local.vibebase",
      name: "Demo Founder",
      createdAt: new Date().toISOString()
    };
    this.store.founders.set(founder.id, founder);

    const project: ProjectRecord = {
      id: "proj_northstar",
      name: "Northstar",
      environment: "local",
      createdAt: new Date().toISOString(),
      appwriteProjectId: "aw_proj_northstar"
    };
    this.store.projects.set(project.id, project);
    const token = createToken(project.id);
    this.store.tokens.set(token.id, {
      id: token.id,
      projectId: project.id,
      tokenHash: token.tokenHash,
      scopes: [
        "project:read",
        "database:read",
        "database:write",
        "storage:read",
        "storage:write",
        "auth:read",
        "auth:write",
        "deploy:read",
        "deploy:write"
      ],
      revokedAt: null,
      createdAt: new Date().toISOString()
    });
    // The plaintext exists only in server memory until the local demo reveal is consumed.
    this.store.pendingTokenReveals.set(token.id, token.rawToken);
    this.store.collections.set(project.id, [
      {
        id: "col_customers_demo",
        projectId: project.id,
        name: "Customers",
        documentCount: 0,
        createdAt: new Date().toISOString()
      }
    ]);
    this.store.buckets.set(project.id, [
      {
        id: "bucket_assets_demo",
        projectId: project.id,
        name: "Assets",
        createdAt: new Date().toISOString()
      }
    ]);
    const deploymentId = `dep_${project.id}`;
    this.store.deployments.set(deploymentId, {
      id: deploymentId,
      projectId: project.id,
      status: "ready",
      url: `http://localhost:3001/${project.id}`,
      env: {},
      logs: ["Deployment target connected."],
      updatedAt: new Date().toISOString()
    });
    this.defaultDeploymentId = deploymentId;
    this.recordSystemAudit(project.id, token.id, "project:read", "project.create", "project", "Created local demo project");
    this.recordSystemAudit(project.id, token.id, "database:write", "database.createCollection", "collection", "Seeded Customers");
    this.recordSystemAudit(project.id, token.id, "storage:write", "storage.createBucket", "bucket", "Seeded Assets");
    this.recordSystemAudit(project.id, token.id, "deploy:write", "deploy.createDeployment", "deployment", "Connected local deployment target");
  }

  getBootstrapToken() {
    const entry = this.store.pendingTokenReveals.entries().next().value as [string, string] | undefined;
    if (!entry) {
      throw new VibebaseError("RESOURCE_NOT_FOUND", "No demo token is available.", 404);
    }
    const [tokenId, rawToken] = entry;
    const token = this.store.tokens.get(tokenId);
    if (!token) {
      throw new VibebaseError("RESOURCE_NOT_FOUND", "No demo token is available.", 404);
    }
    const project = this.store.projects.get(token.projectId);
    if (!project) {
      throw new VibebaseError("RESOURCE_NOT_FOUND", "No demo token is available.", 404);
    }

    return { tokenId: token.id, projectId: project.id, projectName: project.name, rawToken };
  }

  createLocalDemoProject(name: string) {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new VibebaseError("VALIDATION_ERROR", "Project name is required.", 400);
    }

    const projectId = `proj_${normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 24)}_${randomUUID().slice(0, 4)}`;
    const project: ProjectRecord = {
      id: projectId,
      name: normalizedName,
      environment: "local",
      createdAt: new Date().toISOString(),
      appwriteProjectId: `aw_${projectId}`
    };
    const token = createToken(project.id);
    this.store.projects.set(project.id, project);
    this.store.tokens.set(token.id, {
      id: token.id,
      projectId: project.id,
      tokenHash: token.tokenHash,
      scopes: ["project:read", "database:read", "database:write", "storage:read", "storage:write", "auth:read", "auth:write", "deploy:read", "deploy:write"],
      revokedAt: null,
      createdAt: new Date().toISOString()
    });
    this.recordSystemAudit(project.id, token.id, "project:read", "project.create", "project", `Created ${project.name}`);
    return { project, tokenId: token.id, rawToken: token.rawToken };
  }

  consumeDemoTokenReveal(projectId?: string) {
    const entry = [...this.store.pendingTokenReveals.entries()].find(([tokenId]) => {
      const token = this.store.tokens.get(tokenId);
      return token && (!projectId || token.projectId === projectId);
    });
    if (!entry) {
      return null;
    }
    const [tokenId, rawToken] = entry;
    const token = this.store.tokens.get(tokenId)!;
    this.store.pendingTokenReveals.delete(tokenId);
    return { tokenId, projectId: token.projectId, rawToken, scopes: token.scopes };
  }

  getDashboardSnapshot(projectId?: string) {
    const project = (projectId ? this.store.projects.get(projectId) : undefined) ?? [...this.store.projects.values()][0] ?? null;
    const founder = [...this.store.founders.values()][0] ?? null;
    if (!project) {
      return { founder, projects: [], selectedProject: null };
    }
    const token = [...this.store.tokens.values()].find((item) => item.projectId === project.id) ?? null;
    const deployment = [...this.store.deployments.values()].find((item) => item.projectId === project.id) ?? null;
    const collections = this.store.collections.get(project.id) ?? [];
    const buckets = this.store.buckets.get(project.id) ?? [];
    return {
      founder,
      projects: [...this.store.projects.values()].map((item) => ({ id: item.id, name: item.name, environment: item.environment })),
      selectedProject: {
        id: project.id,
        name: project.name,
        environment: project.environment,
        token: token
          ? { id: token.id, prefix: "vb_", scopes: token.scopes, status: token.revokedAt ? "revoked" : "active", pendingReveal: this.store.pendingTokenReveals.has(token.id) }
          : null,
        resources: { collections: collections.map((item) => ({ id: item.id, name: item.name, documentCount: item.documentCount })), buckets: buckets.map((item) => ({ id: item.id, name: item.name })) },
        deployment: deployment
          ? { id: deployment.id, status: deployment.status, url: deployment.url, logs: deployment.logs.map(redactLog), updatedAt: deployment.updatedAt }
          : null,
        auditEvents: this.store.auditEvents.filter((event) => event.projectId === project.id).slice(0, 6).map((event) => ({ ...event, message: redactLog(event.message) }))
      }
    };
  }

  getCapabilities() {
    return {
      scopes: [
        "project:read",
        "database:read",
        "database:write",
        "storage:read",
        "storage:write",
        "auth:read",
        "auth:write",
        "deploy:read",
        "deploy:write"
      ],
      actions: [
        "createDatabase",
        "createCollection",
        "createAttribute",
        "createIndex",
        "createBucket",
        "getAuthStatus",
        "getClientConfig",
        "createDeployment",
        "setDeploymentEnv",
        "deploy",
        "getDeploymentStatus",
        "listCollections"
      ],
      adapter: this.appwrite.getClientConfig().endpoint.includes("localhost") ? "local-appwrite" : "appwrite-server"
    };
  }

  resolveToken(authHeader: string | null): AuthContext {
    if (!authHeader?.startsWith("Bearer ")) {
      throw new VibebaseError("TOKEN_INVALID", "Missing bearer token.", 401);
    }

    const rawToken = authHeader.slice("Bearer ".length).trim();
    if (!rawToken.startsWith("vb_")) {
      throw new VibebaseError("TOKEN_INVALID", "Token format is invalid.", 401);
    }

    const tokenHash = hashToken(rawToken);
    const token = [...this.store.tokens.values()].find((record) => record.tokenHash === tokenHash);
    if (!token) {
      throw new VibebaseError("TOKEN_INVALID", "Token was not recognized.", 401);
    }
    if (token.revokedAt) {
      throw new VibebaseError("TOKEN_REVOKED", "Token has been revoked.", 401);
    }

    const project = this.store.projects.get(token.projectId);
    if (!project) {
      throw new VibebaseError("RESOURCE_NOT_FOUND", "Project not found for token.", 404);
    }

    return { token, project };
  }

  listCollections(authHeader: string | null) {
    const context = this.resolveToken(authHeader);
    this.assertScope(context.token, "database:read");
    return this.appwrite.listCollections(context.project.id);
  }

  async createDatabase(authHeader: string | null, input: { name: string }, confirm = false) {
    return this.executeMutation(authHeader, "database:write", "database.createDatabase", "database", async (context) => {
      if (!confirm) throw new VibebaseError("CONFIRMATION_REQUIRED", "createDatabase requires confirm=true.", 400);
      const name = this.requireResourceName(input?.name, "Database");
      const actionId = this.recordAudit(context, "database.createDatabase", "database", "success", `Created ${name}`);
      return { actionId, database: { id: `db_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, name, projectId: context.project.id } };
    });
  }

  async createCollection(authHeader: string | null, input: CollectionInput, confirm = false) {
    return this.executeMutation(authHeader, "database:write", "database.createCollection", "collection", async (context) => {
      if (!confirm) throw new VibebaseError("CONFIRMATION_REQUIRED", "createCollection requires confirm=true.", 400);
      const name = this.requireResourceName(input?.name, "Collection");
      const collection = await this.appwrite.createCollection({ projectId: context.project.id, name });
      this.trackCollection(collection);
      const actionId = this.recordAudit(context, "database.createCollection", "collection", "success", `Created ${collection.name}`);
      return { actionId, collection };
    });
  }

  async createAttribute(
    authHeader: string | null,
    input: { collectionId: string; key: string; type: "string" | "number" | "boolean"; required?: boolean },
    confirm = false
  ) {
    return this.executeMutation(authHeader, "database:write", "database.createAttribute", "attribute", async (context) => {
      if (!confirm) throw new VibebaseError("CONFIRMATION_REQUIRED", "createAttribute requires confirm=true.", 400);
      this.assertNonEmpty(input.collectionId, "Collection ID is required.");
      this.assertNonEmpty(input.key, "Attribute key is required.");
      const collection = await this.getProjectCollection(context.project.id, input.collectionId);
      if (!this.isAttributeType(input.type)) throw new VibebaseError("VALIDATION_ERROR", "Attribute type must be string, number, or boolean.", 400);
      const record = await this.appwrite.createAttribute({ projectId: context.project.id, collectionId: collection.id, key: input.key.trim(), type: input.type, required: input.required ?? false });
      const actionId = this.recordAudit(context, "database.createAttribute", "attribute", "success", `Created ${record.key}`);
      return { actionId, attribute: record };
    });
  }

  async createIndex(
    authHeader: string | null,
    input: { collectionId: string; name: string; fields: string[] },
    confirm = false
  ) {
    return this.executeMutation(authHeader, "database:write", "database.createIndex", "index", async (context) => {
      if (!confirm) throw new VibebaseError("CONFIRMATION_REQUIRED", "createIndex requires confirm=true.", 400);
      this.assertNonEmpty(input.collectionId, "Collection ID is required.");
      this.assertNonEmpty(input.name, "Index name is required.");
      if (!Array.isArray(input.fields) || input.fields.length === 0) throw new VibebaseError("VALIDATION_ERROR", "Index fields are required.", 400);
      await this.getProjectCollection(context.project.id, input.collectionId);
      const fields = input.fields.map((field) => field.trim()).filter(Boolean);
      if (fields.length === 0) throw new VibebaseError("VALIDATION_ERROR", "Index fields are required.", 400);
      const record = await this.appwrite.createIndex({ projectId: context.project.id, collectionId: input.collectionId, name: input.name.trim(), fields });
      const actionId = this.recordAudit(context, "database.createIndex", "index", "success", `Created ${record.name}`);
      return { actionId, index: record };
    });
  }

  async createBucket(authHeader: string | null, input: { name?: unknown }, confirm = false) {
    return this.executeMutation(authHeader, "storage:write", "storage.createBucket", "bucket", async (context) => {
      if (!confirm) throw new VibebaseError("CONFIRMATION_REQUIRED", "createBucket requires confirm=true.", 400);
      const name = this.requireResourceName(input?.name, "Bucket");
      const record = await this.appwrite.createBucket({ projectId: context.project.id, name });
      this.trackBucket(record);
      const actionId = this.recordAudit(context, "storage.createBucket", "bucket", "success", `Created ${record.name}`);
      return { actionId, bucket: record };
    });
  }

  async createDeployment(authHeader: string | null, input: { name: string }, confirm = false) {
    return this.executeMutation(authHeader, "deploy:write", "deploy.createDeployment", "deployment", async (context) => {
      if (!confirm) throw new VibebaseError("CONFIRMATION_REQUIRED", "createDeployment requires confirm=true.", 400);
      const name = this.requireResourceName(input?.name, "Deployment");
      const deployment = await this.deployment.createDeployment(context.project.id);
      this.defaultDeploymentId = deployment.id;
      const actionId = this.recordAudit(context, "deploy.createDeployment", "deployment", "success", `Created ${name}`);
      return { actionId, deployment: this.toSafeDeployment(deployment) };
    });
  }

  async setDeploymentEnv(authHeader: string | null, input: { deploymentId?: string; env?: unknown }, confirm = false) {
    return this.executeMutation(authHeader, "deploy:write", "deploy.setDeploymentEnv", "deployment", async (context) => {
      if (!confirm) throw new VibebaseError("CONFIRMATION_REQUIRED", "setDeploymentEnv requires confirm=true.", 400);
      const deploymentId = input.deploymentId ?? this.getProjectDeploymentId(context.project.id);
      if (!deploymentId) throw new VibebaseError("RESOURCE_NOT_FOUND", "No deployment exists for this project.", 404);
      this.assertProjectDeployment(context.project.id, deploymentId);
      const deployment = await this.deployment.setEnv(deploymentId, this.validateEnv(input.env));
      const actionId = this.recordAudit(context, "deploy.setDeploymentEnv", "deployment", "success", "Updated deployment environment values [redacted]");
      return { actionId, deployment: this.toSafeDeployment(deployment) };
    });
  }

  async deploy(authHeader: string | null, input: { deploymentId?: string }, confirm = false) {
    return this.executeMutation(authHeader, "deploy:write", "deploy.deploy", "deployment", async (context) => {
      if (!confirm) throw new VibebaseError("CONFIRMATION_REQUIRED", "deploy requires confirm=true.", 400);
      const deploymentId = input.deploymentId ?? this.getProjectDeploymentId(context.project.id);
      if (!deploymentId) throw new VibebaseError("RESOURCE_NOT_FOUND", "No deployment exists for this project.", 404);
      this.assertProjectDeployment(context.project.id, deploymentId);
      const deployment = await this.deployment.deploy(deploymentId);
      const actionId = this.recordAudit(context, "deploy.deploy", "deployment", "success", "Triggered deployment");
      return { actionId, deployment: this.toSafeDeployment(deployment) };
    });
  }

  async getDeploymentStatus(authHeader: string | null, deploymentId?: string) {
    const context = this.resolveToken(authHeader);
    this.assertScope(context.token, "deploy:read");
    const currentDeploymentId = deploymentId ?? this.getProjectDeploymentId(context.project.id);
    if (!currentDeploymentId) {
      throw new VibebaseError("RESOURCE_NOT_FOUND", "No deployment exists for this project.", 404);
    }
    this.assertProjectDeployment(context.project.id, currentDeploymentId);
    const deployment = await this.deployment.getDeploymentStatus(currentDeploymentId);
    return { actionId: "act_deployment_status", deployment: this.toSafeDeployment(deployment) };
  }

  async getAuthStatus(authHeader: string | null) {
    const context = this.resolveToken(authHeader);
    this.assertScope(context.token, "auth:read");
    return { actionId: "act_auth_status", auth: await this.appwrite.getAuthStatus() };
  }

  getClientConfig(authHeader: string | null): { actionId: string; client: ClientConfig } {
    const context = this.resolveToken(authHeader);
    this.assertScope(context.token, "project:read");
    return { actionId: "act_client_config", client: this.appwrite.getClientConfig() };
  }

  listAuditEvents(authHeader: string | null) {
    const context = this.resolveToken(authHeader);
    this.assertScope(context.token, "project:read");
    return this.store.auditEvents.filter((event) => event.projectId === context.project.id);
  }

  async getProjectCollection(projectId: string, collectionId: string) {
    const collections = await this.appwrite.listCollections(projectId);
    const collection = collections.find((item) => item.id === collectionId);
    if (!collection) {
      throw new VibebaseError("RESOURCE_NOT_FOUND", "Collection not found for this project.", 404);
    }
    return collection;
  }

  private assertScope(token: TokenRecord, scope: Scope) {
    if (!token.scopes.includes(scope)) {
      throw new VibebaseError("SCOPE_MISSING", `This token cannot perform ${scope}.`, 403);
    }
  }

  private getProjectDeploymentId(projectId: string) {
    return this.defaultDeploymentId ?? [...this.store.deployments.values()].find((deployment) => deployment.projectId === projectId)?.id;
  }

  private assertProjectDeployment(projectId: string, deploymentId: string) {
    if (this.store.deployments.get(deploymentId)?.projectId !== projectId) {
      throw new VibebaseError("RESOURCE_NOT_FOUND", "Deployment not found for this project.", 404);
    }
  }

  private assertNonEmpty(value: string, message: string) {
    if (!value.trim()) {
      throw new VibebaseError("VALIDATION_ERROR", message, 400);
    }
  }

  private isAttributeType(value: unknown): value is "string" | "number" | "boolean" {
    return value === "string" || value === "number" || value === "boolean";
  }

  private trackCollection(collection: CollectionRecord) {
    const existing = this.store.collections.get(collection.projectId) ?? [];
    if (!existing.some((item) => item.id === collection.id)) this.store.collections.set(collection.projectId, [...existing, collection]);
  }

  private trackBucket(bucket: BucketRecord) {
    const existing = this.store.buckets.get(bucket.projectId) ?? [];
    if (!existing.some((item) => item.id === bucket.id)) this.store.buckets.set(bucket.projectId, [...existing, bucket]);
  }

  private async executeMutation<T>(authHeader: string | null, scope: Scope, actionType: string, targetType: string, action: (context: AuthContext) => Promise<T>) {
    let context: AuthContext | undefined;
    try {
      context = this.resolveToken(authHeader);
      this.assertScope(context.token, scope);
      return await action(context);
    } catch (error) {
      const identified = context ?? this.findIdentifiedContext(authHeader);
      if (identified) this.recordAudit(identified, actionType, targetType, "failed", `Rejected: ${safeErrorCode(error)}`);
      if (error instanceof VibebaseError) throw error;
      throw new VibebaseError("UPSTREAM_FAILURE", "The requested operation could not be completed.", 502);
    }
  }

  private findIdentifiedContext(authHeader: string | null): AuthContext | undefined {
    if (!authHeader?.startsWith("Bearer ")) return undefined;
    const token = [...this.store.tokens.values()].find((record) => record.tokenHash === hashToken(authHeader.slice(7).trim()));
    const project = token ? this.store.projects.get(token.projectId) : undefined;
    return token && project ? { token, project } : undefined;
  }

  private requireResourceName(value: unknown, label: string) {
    if (typeof value !== "string" || !value.trim()) throw new VibebaseError("VALIDATION_ERROR", `${label} name is required.`, 400);
    const normalized = value.trim();
    if (normalized.length > 64 || !/^[a-zA-Z][a-zA-Z0-9 _-]*$/.test(normalized)) {
      throw new VibebaseError("VALIDATION_ERROR", `${label} name must be 1-64 letters, numbers, spaces, underscores, or hyphens.`, 400);
    }
    return normalized;
  }

  private validateEnv(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new VibebaseError("VALIDATION_ERROR", "env must be an object of string values.", 400);
    const entries = Object.entries(value);
    if (entries.length === 0 || entries.length > 20 || entries.some(([key, item]) => !/^[A-Z][A-Z0-9_]*$/.test(key) || typeof item !== "string" || item.length > 4096)) {
      throw new VibebaseError("VALIDATION_ERROR", "env must contain up to 20 uppercase keys with string values.", 400);
    }
    return Object.fromEntries(entries) as Record<string, string>;
  }

  private toSafeDeployment(deployment: DeploymentRecord): SafeDeploymentRecord {
    return { ...deployment, env: Object.fromEntries(Object.keys(deployment.env).map((key) => [key, "[redacted]"])), logs: deployment.logs.map(redactLog) };
  }

  recordAudit(
    context: AuthContext,
    actionType: string,
    targetType: string,
    status: "success" | "failed",
    message: string
  ) {
    return this.recordSystemAudit(context.project.id, context.token.id, scopeForAction(actionType), actionType, targetType, message, status);
  }

  private recordSystemAudit(projectId: string, actorTokenId: string, scope: Scope, actionType: string, targetType: string, message: string, status: "success" | "failed" = "success") {
    const event: AuditEvent = {
      actionId: `act_${randomUUID().slice(0, 8)}`,
      projectId,
      actorTokenId,
      scope,
      actionType,
      targetType,
      status,
      timestamp: new Date().toISOString(),
      message
    };
    this.store.auditEvents.unshift(event);
    return event.actionId;
  }
}

function scopeForAction(actionType: string): Scope {
  if (actionType.startsWith("storage.")) return "storage:write";
  if (actionType.startsWith("auth.")) return "auth:write";
  if (actionType.startsWith("deploy.")) return "deploy:write";
  return "database:write";
}

function safeErrorCode(error: unknown) {
  return error instanceof VibebaseError ? error.code : "UPSTREAM_FAILURE";
}

function redactLog(value: string) {
  return value.replace(/(token|secret|password|key)\s*[=:]\s*[^\s,]+/gi, "$1=[redacted]");
}

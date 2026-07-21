import { randomUUID } from "node:crypto";
import type { AppwriteAttributeCreateInput, AppwriteBucketCreateInput, AppwriteCollectionCreateInput, AppwriteIndexCreateInput, AttributeRecord, AuthStatus, BucketRecord, ClientConfig, CollectionRecord, IndexRecord } from "@/lib/vibebase/types";
import { VibebaseError } from "@/lib/vibebase/errors";

export interface AppwriteAdapter {
  createCollection(input: AppwriteCollectionCreateInput): Promise<CollectionRecord>;
  listCollections(projectId: string): Promise<CollectionRecord[]>;
  createAttribute(input: AppwriteAttributeCreateInput): Promise<AttributeRecord>;
  createIndex(input: AppwriteIndexCreateInput): Promise<IndexRecord>;
  createBucket(input: AppwriteBucketCreateInput): Promise<BucketRecord>;
  getAuthStatus(): Promise<AuthStatus>;
  getClientConfig(): ClientConfig;
}

export class LocalAppwriteAdapter implements AppwriteAdapter {
  constructor(
    private readonly collections: Map<string, CollectionRecord[]>,
    private readonly attributes = new Map<string, AttributeRecord[]>(),
    private readonly indexes = new Map<string, IndexRecord[]>(),
    private readonly buckets = new Map<string, BucketRecord[]>()
  ) {}

  async createCollection(input: AppwriteCollectionCreateInput): Promise<CollectionRecord> {
    const next: CollectionRecord = {
      id: `col_${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36)}`,
      projectId: input.projectId,
      name: input.name,
      documentCount: 0,
      createdAt: new Date().toISOString()
    };

    const existing = this.collections.get(input.projectId) ?? [];
    this.collections.set(input.projectId, [...existing, next]);
    return next;
  }

  async listCollections(projectId: string): Promise<CollectionRecord[]> {
    return this.collections.get(projectId) ?? [];
  }

  async createAttribute(input: AppwriteAttributeCreateInput): Promise<AttributeRecord> {
    const record: AttributeRecord = { id: `attr_${randomUUID().slice(0, 8)}`, projectId: input.projectId, collectionId: input.collectionId, key: input.key, type: input.type, required: input.required, createdAt: new Date().toISOString() };
    this.attributes.set(input.collectionId, [...(this.attributes.get(input.collectionId) ?? []), record]);
    return record;
  }

  async createIndex(input: AppwriteIndexCreateInput): Promise<IndexRecord> {
    const record: IndexRecord = { id: `idx_${randomUUID().slice(0, 8)}`, projectId: input.projectId, collectionId: input.collectionId, name: input.name, fields: input.fields, createdAt: new Date().toISOString() };
    this.indexes.set(input.collectionId, [...(this.indexes.get(input.collectionId) ?? []), record]);
    return record;
  }

  async createBucket(input: AppwriteBucketCreateInput): Promise<BucketRecord> {
    const record: BucketRecord = { id: `bucket_${randomUUID().slice(0, 8)}`, projectId: input.projectId, name: input.name, createdAt: new Date().toISOString() };
    this.buckets.set(input.projectId, [...(this.buckets.get(input.projectId) ?? []), record]);
    return record;
  }

  async getAuthStatus(): Promise<AuthStatus> {
    return { mode: "local", emailPassword: true, oauthProviders: [], note: "Local demo supports email and password app authentication. OAuth providers require server-side configuration." };
  }

  getClientConfig(): ClientConfig {
    return { endpoint: "http://localhost:3000/v1", projectId: "local-vibebase-project", databaseId: "local-vibebase-database" };
  }
}

type AppwriteConfig = { endpoint: string; internalEndpoint?: string; projectId: string; apiKey: string; databaseId: string };

/** Server-only adapter. Its credentials are held in runtime-private fields and never returned. */
export class AppwriteServerAdapter implements AppwriteAdapter {
  readonly #endpoint: string;
  readonly #internalEndpoint: string;
  readonly #projectId: string;
  readonly #apiKey: string;
  readonly #databaseId: string;

  constructor(config: AppwriteConfig) {
    this.#endpoint = config.endpoint.replace(/\/$/, "");
    this.#internalEndpoint = (config.internalEndpoint ?? config.endpoint).replace(/\/$/, "");
    this.#projectId = config.projectId;
    this.#apiKey = config.apiKey;
    this.#databaseId = config.databaseId;
  }

  async createCollection(input: AppwriteCollectionCreateInput): Promise<CollectionRecord> {
    const collectionId = `vb_${input.projectId.replace(/^proj_/, "").slice(0, 20)}_${slugify(input.name).slice(0, 10)}`.slice(0, 36);
    const response = await this.#request(`/databases/${encodeURIComponent(this.#databaseId)}/collections`, {
      method: "POST",
      body: JSON.stringify({ collectionId, name: input.name, permissions: [], documentSecurity: false, enabled: true, attributes: [], indexes: [] })
    });
    return { id: response.$id, projectId: input.projectId, name: response.name, documentCount: 0, createdAt: response.$createdAt ?? new Date().toISOString() };
  }

  async listCollections(projectId: string): Promise<CollectionRecord[]> {
    const response = await this.#request(`/databases/${encodeURIComponent(this.#databaseId)}/collections`);
    return (response.collections ?? [])
      .filter((collection: { $id: string }) => collection.$id.startsWith(`vb_${projectId.replace(/^proj_/, "").slice(0, 20)}_`))
      .map((collection: { $id: string; name: string; $createdAt?: string }) => ({ id: collection.$id, projectId, name: collection.name, documentCount: 0, createdAt: collection.$createdAt ?? new Date().toISOString() }));
  }

  async createAttribute(input: AppwriteAttributeCreateInput): Promise<AttributeRecord> {
    const path = `/databases/${encodeURIComponent(this.#databaseId)}/collections/${encodeURIComponent(input.collectionId)}/attributes/${input.type === "string" ? "string" : input.type === "number" ? "integer" : "boolean"}`;
    const response = await this.#request(path, {
      method: "POST",
      body: JSON.stringify(input.type === "string" ? { key: input.key, size: 255, required: input.required, array: false, default: null, encrypt: false } : { key: input.key, required: input.required, array: false, default: null })
    });
    return { id: response.key ?? input.key, projectId: input.projectId, collectionId: input.collectionId, key: response.key ?? input.key, type: input.type, required: Boolean(response.required ?? input.required), createdAt: response.$createdAt ?? new Date().toISOString() };
  }

  async createIndex(input: AppwriteIndexCreateInput): Promise<IndexRecord> {
    const response = await this.#request(`/databases/${encodeURIComponent(this.#databaseId)}/collections/${encodeURIComponent(input.collectionId)}/indexes`, {
      method: "POST",
      body: JSON.stringify({ key: slugify(input.name).slice(0, 36), type: "key", attributes: input.fields, orders: [] })
    });
    return { id: response.key ?? input.name, projectId: input.projectId, collectionId: input.collectionId, name: response.key ?? input.name, fields: response.attributes ?? input.fields, createdAt: response.$createdAt ?? new Date().toISOString() };
  }

  async createBucket(input: AppwriteBucketCreateInput): Promise<BucketRecord> {
    const bucketId = `vb_${input.projectId.replace(/^proj_/, "").slice(0, 16)}_${slugify(input.name).slice(0, 12)}`.slice(0, 36);
    const response = await this.#request("/storage/buckets", {
      method: "POST",
      body: JSON.stringify({ bucketId, name: input.name, permissions: [], fileSecurity: false, enabled: true, maximumFileSize: 10485760, allowedFileExtensions: [], compression: "none", encryption: true, antivirus: true })
    });
    return { id: response.$id, projectId: input.projectId, name: response.name, createdAt: response.$createdAt ?? new Date().toISOString() };
  }

  async getAuthStatus(): Promise<AuthStatus> {
    const response = await this.#request("/project/oauth2");
    const providers = Array.isArray(response.providers) ? response.providers.filter((provider: { enabled?: boolean }) => provider.enabled).map((provider: { key?: string; name?: string }) => provider.key ?? provider.name).filter(Boolean) : [];
    return { mode: "appwrite", emailPassword: true, oauthProviders: providers, note: "Email/password is available through the Appwrite client SDK. OAuth provider credentials remain server-side and are never returned by VibeBase." };
  }

  getClientConfig(): ClientConfig {
    return { endpoint: this.#endpoint, projectId: this.#projectId, databaseId: this.#databaseId };
  }

  async #request(path: string, init: RequestInit = {}) {
    let response: Response;
    try {
      response = await fetch(`${this.#internalEndpoint}${path}`, {
        ...init,
        headers: { "content-type": "application/json", "x-appwrite-project": this.#projectId, "x-appwrite-key": this.#apiKey, "x-appwrite-response-format": "1.9.5", ...init.headers },
        cache: "no-store"
      });
    } catch {
      throw new VibebaseError("UPSTREAM_FAILURE", "Appwrite is unavailable.", 502);
    }
    if (!response.ok) throw new VibebaseError("UPSTREAM_FAILURE", "Appwrite could not complete the requested operation.", 502);
    return response.json() as Promise<any>;
  }
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "collection";
}

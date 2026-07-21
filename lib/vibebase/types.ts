export type Scope =
  | "project:read"
  | "database:read"
  | "database:write"
  | "storage:read"
  | "storage:write"
  | "auth:read"
  | "auth:write"
  | "deploy:read"
  | "deploy:write";

export type ActionStatus = "success" | "failed";

export type AuditEvent = {
  actionId: string;
  projectId: string;
  actorTokenId: string;
  scope: Scope;
  actionType: string;
  targetType: string;
  status: ActionStatus;
  timestamp: string;
  message: string;
};

export type TokenRecord = {
  id: string;
  projectId: string;
  tokenHash: string;
  scopes: Scope[];
  revokedAt: string | null;
  createdAt: string;
};

export type ProjectRecord = {
  id: string;
  name: string;
  environment: "local";
  createdAt: string;
  appwriteProjectId: string;
};

export type FounderRecord = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type CollectionRecord = {
  id: string;
  projectId: string;
  name: string;
  documentCount: number;
  createdAt: string;
};

export type AttributeRecord = {
  id: string;
  projectId: string;
  collectionId: string;
  key: string;
  type: "string" | "number" | "boolean";
  required: boolean;
  createdAt: string;
};

export type IndexRecord = {
  id: string;
  projectId: string;
  collectionId: string;
  name: string;
  fields: string[];
  createdAt: string;
};

export type BucketRecord = {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
};

export type AppwriteCollectionCreateInput = {
  projectId: string;
  name: string;
};

export type AppwriteAttributeCreateInput = {
  projectId: string;
  collectionId: string;
  key: string;
  type: "string" | "number" | "boolean";
  required: boolean;
};

export type AppwriteIndexCreateInput = {
  projectId: string;
  collectionId: string;
  name: string;
  fields: string[];
};

export type AppwriteBucketCreateInput = {
  projectId: string;
  name: string;
};

export type AuthStatus = {
  mode: "local" | "appwrite";
  emailPassword: boolean;
  oauthProviders: string[];
  note: string;
};

export type ClientConfig = {
  endpoint: string;
  projectId: string;
  databaseId: string;
};

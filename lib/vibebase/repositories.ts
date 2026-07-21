import type { AuditEvent, AttributeRecord, BucketRecord, CollectionRecord, FounderRecord, IndexRecord, ProjectRecord, TokenRecord } from "@/lib/vibebase/types";
import type { DeploymentRecord } from "@/lib/vibebase/deployment-adapter";

export class InMemoryStore {
  founders = new Map<string, FounderRecord>();
  projects = new Map<string, ProjectRecord>();
  tokens = new Map<string, TokenRecord>();
  auditEvents: AuditEvent[] = [];
  collections = new Map<string, CollectionRecord[]>();
  attributes = new Map<string, AttributeRecord[]>();
  indexes = new Map<string, IndexRecord[]>();
  buckets = new Map<string, BucketRecord[]>();
  deployments = new Map<string, DeploymentRecord>();
  pendingTokenReveals = new Map<string, string>();
}

export const vibebaseStore = new InMemoryStore();

export function resetVibebaseStore(store = vibebaseStore) {
  store.founders.clear();
  store.projects.clear();
  store.tokens.clear();
  store.auditEvents = [];
  store.collections.clear();
  store.attributes.clear();
  store.indexes.clear();
  store.buckets.clear();
  store.deployments.clear();
  store.pendingTokenReveals.clear();
}

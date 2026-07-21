import { AppwriteServerAdapter, LocalAppwriteAdapter } from "@/lib/vibebase/appwrite-adapter";
import { DokployServerAdapter, LocalDeploymentAdapter } from "@/lib/vibebase/deployment-adapter";
import { VibebaseService } from "@/lib/vibebase/service";
import { vibebaseStore } from "@/lib/vibebase/repositories";

export function getVibebaseService() {
  const localDemoMode = process.env.VIBEBASE_LOCAL_DEMO_MODE === "true";
  const appwrite = !localDemoMode && isConfigured(process.env.APPWRITE_ENDPOINT, process.env.APPWRITE_PROJECT_ID, process.env.APPWRITE_API_KEY, process.env.APPWRITE_DATABASE_ID)
    ? new AppwriteServerAdapter({ endpoint: process.env.APPWRITE_ENDPOINT!, internalEndpoint: process.env.APPWRITE_INTERNAL_ENDPOINT, projectId: process.env.APPWRITE_PROJECT_ID!, apiKey: process.env.APPWRITE_API_KEY!, databaseId: process.env.APPWRITE_DATABASE_ID! })
    : new LocalAppwriteAdapter(vibebaseStore.collections, vibebaseStore.attributes, vibebaseStore.indexes, vibebaseStore.buckets);
  const deployment = !localDemoMode && isConfigured(process.env.DOKPLOY_ENDPOINT, process.env.DOKPLOY_API_KEY, process.env.DOKPLOY_ENVIRONMENT_ID)
    ? new DokployServerAdapter({ endpoint: process.env.DOKPLOY_ENDPOINT!, apiKey: process.env.DOKPLOY_API_KEY!, environmentId: process.env.DOKPLOY_ENVIRONMENT_ID!, serverId: process.env.DOKPLOY_SERVER_ID })
    : new LocalDeploymentAdapter(vibebaseStore.deployments);
  const service = new VibebaseService(appwrite, deployment, vibebaseStore);
  service.seedDemo();
  return service;
}

function isConfigured(...values: Array<string | undefined>) {
  return values.every((value) => Boolean(value && value !== "unconfigured" && !value.startsWith("replace-")));
}

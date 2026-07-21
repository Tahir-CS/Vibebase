# Dokploy Bootstrap

Dokploy is a separate deployment engine; VibeBase does not fork or embed it. Dokploy's official installer requires a Linux Docker host with ports 80, 443, and 3000 available. For the hackathon, use the existing Ubuntu VirtualBox VM after increasing it to at least 3 GB RAM if the host allows it. This is a local demo host, not public production infrastructure.

On the Linux host, follow the official Dokploy installation guide. After creating a restricted Dokploy API token, set these VibeBase server-only variables:

```dotenv
DOKPLOY_ENDPOINT=https://your-dokploy-host/api
DOKPLOY_API_KEY=your-restricted-dokploy-token
DOKPLOY_ENVIRONMENT_ID=your-environment-id
DOKPLOY_SERVER_ID=
```

The coding agent receives only a VibeBase token. It must never receive the Dokploy endpoint token, SSH access, or deployment environment values.

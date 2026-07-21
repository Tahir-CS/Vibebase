# Local Appwrite Bootstrap

VibeBase does not embed or fork Appwrite. `npm run stack:init` uses the official Appwrite installer to generate Appwrite's own Docker Compose stack inside `infra/appwrite/appwrite/`. That generated directory is ignored by Git and stays local to each machine.

From the repository root:

```powershell
npm run stack:init
```

Open `http://localhost:20080` and complete the official installer. Use local-only values; do not reuse production credentials. The installer writes the official Compose files and local Appwrite secrets under `infra/appwrite/appwrite/`.

In the local Appwrite console, create the VibeBase control-plane project, a server API key with the database and storage scopes used by VibeBase, and a VibeBase workload database. Set these values in `.env.local-stack` only:

```dotenv
APPWRITE_ENDPOINT=http://host.docker.internal/v1
APPWRITE_PROJECT_ID=local-appwrite-project-id
APPWRITE_API_KEY=local-server-key
APPWRITE_DATABASE_ID=local-workload-database-id
```

Then start both stacks:

```powershell
npm run stack:up
```

Never expose these values to the browser, coding agent, recording, or Git.

Appwrite Cloud is also valid for the hackathon integration. Its endpoint, project ID, API key, and database ID remain server-only. The agent receives a scoped VibeBase token, not any Appwrite credential.

# VibeBase Product Brief

## The problem

Early-stage founders lose momentum setting up databases, authentication, file storage, environment variables, permissions, and deployment services. AI coding agents can write application code, but they still need backend credentials, deployment access, configuration, and a safe way to make infrastructure changes.

## The product

VibeBase is an Agent-BaaS: an app infrastructure control plane designed for AI coding agents. A founder signs in, creates a project, receives one VibeBase API token, and gives it to their agent. The agent calls VibeBase to create backend resources and trigger deployment instead of asking the founder to visit several vendor dashboards.

## Core promise

**One token for the agent. No manual backend or deployment setup for the founder.**

The token gives the agent scoped access to create data collections, manage document data, configure supported authentication, create storage buckets, trigger a deployment, and inspect logs. The founder can view what happened in a minimal dashboard.

## Target user

A non-technical or lightly technical founder building an MVP with an AI coding agent. They value speed and do not want to learn backend operations before validating their idea.

## Product position

VibeBase is not trying to replace the coding agent. It gives the agent a safe, unified infrastructure surface. Appwrite provides the underlying backend primitives in the local demo. Dokploy provides the underlying deployment engine. VibeBase provides the founder experience, authorization, audit trail, and agent-facing API.

## V1 success moment

Within minutes, a founder can:

1. Sign in to VibeBase.
2. Automatically provision a private workspace and generate one scoped token.
3. Paste that token into their agent's environment.
4. Ask the agent to create a backend feature, such as a `documents` collection and private file storage.
5. Ask the agent to deploy the app through VibeBase.
6. See the completed resources, deployment status, and agent activity in VibeBase.

## Explicit V1 non-goals

- Full Stripe Connect onboarding and merchant payment automation.
- Autonomous schema repair or database branching.
- Sophisticated workers, retries, workflows, or long-running orchestration.
- Production deployment across arbitrary cloud providers beyond the narrow local/self-hosted Dokploy adapter.
- A large configuration dashboard.

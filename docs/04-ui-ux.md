# VibeBase UI/UX Brief

## Product feeling

Minimal, calm, premium, and obvious. The UI should make founders feel that the difficult backend work is already handled. It is not an Appwrite-style configuration console.

## Primary navigation

- Overview
- Build status
- Agent activity
- Workspace

The active project context is always visible. Avoid nested sidebars, dense tables, and a page for every backend primitive.

## Essential screens

### 1. Landing/sign-in

One direct message: "Give your coding agent one key. It handles the backend." Sign up/sign in are the only primary actions.

### 2. Automatic workspace onboarding

On sign-up, VibeBase provisions one private workspace and moves directly to the token handoff. Do not make founders name projects or configure backend engines before their agent can begin.

### 3. Token reveal

The most important screen. It explains that the token is shown once, has project scope, and belongs in the agent environment. Include a copy control, short setup snippet, and clear continue action.

### 4. Workspace home

Show five calm summary cards only: Agent status, Data, Storage, Deployment, and Recent activity. Include a prominent "Copy agent setup" action. No manual resource-editing controls in V1.

### 5. Activity

A human-readable timeline of agent actions: what happened, when, success/failure, and action ID. Failed actions expose a concise error explanation.

### 6. Settings

Project name, token management, danger zone for revocation/deletion, and local environment status.

### 7. Deployment details

Keep this compact: current status, last deploy time, deployed URL, and recent logs. The founder can inspect what happened, but the agent remains the primary operator.

## Visual direction

- Warm off-white background with ink/charcoal typography.
- One confident accent color, likely cobalt blue or vivid orange, chosen after the first visual mockup.
- Editorial type pairing rather than default UI typography.
- Generous spacing, clear hierarchy, rounded but not excessively pill-shaped surfaces.
- Motion only for meaningful progress: token created, agent action arriving, backend provisioning completed.

## Guardrails

- Avoid dashboard clutter and generic metric cards.
- Never show raw infrastructure identifiers unless placed behind a small "technical details" disclosure.
- Use plain language: "Agent key" in UI, "API token" in technical docs.
- Every destructive action must state its consequence before confirmation.

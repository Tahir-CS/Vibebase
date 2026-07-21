# VibeBase Engineering Decisions

| Decision | Chosen direction | Reason |
| --- | --- | --- |
| Backend base | Appwrite, self-hosted locally | Mature primitives for auth, data, storage, functions, and local Docker development |
| Deployment base | Dokploy in V2 | Deployment control needs its own isolation, source policy, and safety work; it is not needed to prove the V1 backend wedge |
| Integration approach | Build on top of Appwrite first; add Dokploy in V2 | Faster MVP, safer upgrades, smaller maintenance burden |
| Primary interface | REST API plus MCP | Agents can use either surface; both remain one product contract |
| Human interface | Minimal dashboard | Founders need visibility and control, not infrastructure configuration chores |
| Key model | Per-project scoped agent key | Limits blast radius and supports revocation |
| Local demo | Docker-based VibeBase, PostgreSQL, Redis, and official Appwrite stack | Screen-recordable, self-contained, low infrastructure cost |
| Payments | Defer merchant payments/Stripe Connect to V2 | Real payment onboarding, webhooks, compliance, and support add significant complexity |
| Queues/workflows | Defer to V2 | Basic MVP backend use cases do not need custom orchestration initially |
| Self-healing | Defer to later | Requires migration history, test execution, safety policy, and reliable rollback semantics |
| Deployment | Defer Dokploy and deployment automation to V2 | Keeps V1 focused on the secure agent-managed backend wedge |

## Open decisions before implementation

1. Is the initial dashboard login handled by Appwrite Auth or an application auth provider? Default recommendation: Appwrite Auth, keeping the demo self-contained.
2. Does one VibeBase project map to one Appwrite project or a namespace within a shared local Appwrite project? Default recommendation: a namespace/shared project for the first demo, because it reduces local provisioning complexity.
3. Which agent will be used in the screen recording? Default recommendation: pick one MCP-compatible client and support REST as the universal fallback.
4. Which database abstraction should agents see: Appwrite collections/documents in V1, or a PostgreSQL-like schema language? Default recommendation: expose VibeBase collections in V1 and avoid promising PostgreSQL semantics until a Postgres backend exists.

## Honest positioning language

For V1, say: "VibeBase lets your agent configure a local Appwrite backend through one scoped key." Do not claim deployment automation, fully managed OAuth, automatic Stripe provisioning, arbitrary production cloud deployment, or self-healing migrations. Those claims become credible only as the corresponding V2 systems are shipped.

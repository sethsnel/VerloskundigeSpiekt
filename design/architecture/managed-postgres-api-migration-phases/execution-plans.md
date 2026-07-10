# Local and remote execution tracks

The phase plans describe what must exist; these two execution plans describe where each gate is proven:

- [Local-development execution plan](local-development-execution-plan.md) — workstation/CI execution with Docker PostgreSQL and synthetic data.
- [Remote-infrastructure execution plan](remote-infrastructure-execution-plan.md) — acceptance/production execution on Neon, Azure, Firebase, GitHub environments, and managed observability.

## Evidence rule

Local evidence is required before the matching remote gate. Remote evidence cannot be substituted by a local mock, and local completion cannot authorize production traffic or production data. Each phase's delivery record must link both evidence sets and mark any exception with an owner and expiry.

| Phase | Local track | Remote track |
| --- | --- | --- |
| 0 | Inventory, synthetic baseline, traceability, decision classification | Provider, legal, residency, ownership, and sign-off evidence |
| 1 | Build, tests, Compose, image, health, shutdown | OIDC, ACR, Container Apps, Key Vault, immutable deployment, rollback |
| 2 | Clean migrations, roles, integration tests, dump/restore, local RLS | Neon pooled/direct endpoints, managed restore/PITR, capacity and role proof |
| 3 | Emulator/test tokens, HTTP/SQL negatives, context reuse | Real Firebase tokens/keys, deployed CORS, remote RLS and revocation |
| 4 | Synthetic fixtures, API/UI workflows, transaction faults | Acceptance deployment, query plans, product acceptance |
| 5 | JSON/concurrency/search/storage stubs and privacy tests | Firebase Storage, signed URLs, managed search/storage and acceptance privacy review |
| 6 | Local generated client, browser network/cache tests | Acceptance frontend, deployed OpenAPI drift, real origin/auth behavior |
| 7 | Mock/local extension and sentinel inspection | Approved extension origin, CORS/rate limits, acceptance security review |
| 8 | Load/failure/restore simulations and migration dry runs | Dashboards, cold starts, Neon PITR, managed failures, two full rehearsals, go/no-go |
| 9 | Cutover dry run and rollback simulation | Production maintenance window, reconciled import, observation, archive, decommission |

Phase 9 remains blocked until the remote Phase 8 go/no-go record is signed.

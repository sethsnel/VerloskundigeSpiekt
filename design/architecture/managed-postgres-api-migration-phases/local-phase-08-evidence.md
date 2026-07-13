# Local Phase 8 evidence

Recorded 2026-07-12 with synthetic data only. This record covers the local-development scope; it is not production capacity, residency, PITR, or provider evidence.

## Rehearsal results

| Gate | Result | Evidence |
| --- | --- | --- |
| Protected migration path | Pass | A fresh PostgreSQL 17.5 database was bootstrapped with `vs_migrator`/`vs_api`. The self-contained EF bundle applied through `20260710102124_AddMigrationAliases`, then through `20260712220000_SeedTemplatePlaceholderKeys`; a third application reported no pending migrations. Runtime grants were applied only afterward. |
| Runtime readiness | Pass | API started with `vs_api`; `/health/ready` returned 200. The runtime role remains non-owner and without `BYPASSRLS`, verified by `DatabaseSecurityTests`. |
| 1x/3x burst | Pass with throttling | 100 concurrent readiness requests completed in 192 ms with no errors. A subsequent 300-request burst completed in 123 ms with 19 accepted and 281 deliberately throttled responses. Health endpoints were then exempted from rate limiting so probes cannot be masked by client traffic. Endpoint workload capacity remains a remote acceptance gate. |
| PostgreSQL outage/recovery | Pass | With PostgreSQL stopped, readiness returned 503 in 58 ms while liveness remained 200 in 5 ms. After restart, readiness recovered to 200 in 71 ms. |
| Backup/restore | Pass | A custom-format `pg_dump` made as `vs_migrator` restored into a new database owned by the migration role; the restored public schema contained 22 tables. Creation of the empty restore database correctly required bootstrap authority because `vs_migrator` has `NOCREATEDB`. |
| Credential rotation | Pass | After rotating `vs_api` and terminating its sessions, the old revision returned readiness 503. A new revision configured with the rotated credential returned readiness 200. |
| Migration interruption/restart | Pass | The migration integration test injects a failure after deterministic domain writes, restarts the same stable run, verifies no row-version churn or duplicate rows, reconciles target rows, and proves deliberate target corruption is detected. |
| Security matrix | Pass | Testcontainers tests cover direct-SQL RLS/self-enrollment, ownership transfer, grants, tenant FKs, invitations, idempotency, ETags, role/token boundaries, JSON contracts, keyset pagination, FTS, storage authorization/expiry/member removal, and global-content RLS. |
| Extension privacy | Pass locally | Structural substitution tests cover JSON-significant characters and fail-closed missing values. The extension does not persist clipboard values; manifest permissions and exact API/Firebase hosts are documented. Real extension-origin and Firebase revocation evidence remains an acceptance-environment gate. |
| Dependency audit | Pass | `pnpm audit --prod --audit-level low` reports no known vulnerabilities; the .NET vulnerable-package audit reports none. |

## Approved local exceptions

| Exception | Owner | Expiry / clearing condition |
| --- | --- | --- |
| Managed PostgreSQL capacity, pooler behavior, regional outage, PITR timing, and provider dashboards cannot be proven against the disposable local container. | Platform | Before acceptance go/no-go; clear using the protected managed environment. |
| Real Firebase key revocation and extension-origin CORS require an approved non-production Firebase project and packaged extension ID. Local tests use invalid/expired/wrong-audience tokens and configured exact origins. | Security | Before extension acceptance sign-off. |
| Immutable registry promotion and protected cloud migration jobs require registry/environment authority and remain remote-only. | Platform | Before first remote deployment. |

No exception permits production cutover. Phase 9 remains blocked until the remote gates and a signed rehearsal are complete.

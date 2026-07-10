# Local-development execution plan

This plan executes the migration gates that can be proven on a developer workstation or in CI using synthetic data. It is deliberately independent of Neon, Azure Container Apps, Azure Key Vault, production Firebase projects, and production DNS.

Local evidence proves application behavior, schema reproducibility, authorization logic, privacy boundaries, and migration-tool repeatability. It does not prove managed-provider residency, cloud identity, remote networking, production capacity, or production recovery objectives.

## Prerequisites and safety

- Docker Desktop with the Linux engine, .NET SDK pinned by `backend/global.json`, Node 24, and pnpm 10.
- No production credentials, exports, patient/client values, or production Firebase project in local configuration.
- Synthetic users, two practices, invitations, pages, templates, contacts, articles, and files.
- A clean local checkout and one named EF migration owner.
- Use `backend/.env.example` as the variable-name source; store values in Secret Manager or an ignored local file.

## Execution sequence

### Local Phase 0 — baseline and traceability

1. Run the documented `rg` inventory over `frontend/lib/firestore/**` and `frontend/lib/firebase/**`.
2. Validate the architecture evidence, environment matrix, risk register, and endpoint traceability in [phase-00-evidence.md](phase-00-evidence.md).
3. Create a synthetic source-data manifest and record counts for users, practices, nested documents, and files.
4. Mark provider, legal, and production-owner decisions as `remote-only`; do not sign them from local evidence.

Evidence: inventory output, synthetic baseline checksum, reviewed traceability rows, and local/remote gate classification.

### Local Phase 1 — backend and container bootstrap

1. Run `dotnet restore`, `dotnet format --verify-no-changes`, `dotnet build`, and `dotnet test`.
2. Start PostgreSQL with `docker compose -f backend/docker-compose.yml up -d postgres`.
3. Start the API and verify `/health/live`, `/health/ready`, and `/openapi/v1.json`.
4. Build the image with `docker build -f backend/Dockerfile .`; inspect that the runtime image has no SDK, source, tests, credentials, or EF tooling.
5. Run the image as the non-root user on port 8080, terminate it with SIGTERM, and verify graceful shutdown and operation with an ephemeral/read-only filesystem model.
6. Remove a required setting and record the startup validation failure without exposing a secret.

Evidence: command logs, image inspection, health responses, shutdown result, and a smoke-test report.

### Local Phase 2 — PostgreSQL and EF foundations

1. Recreate a blank PostgreSQL 17 database and apply only committed migrations or the generated EF bundle.
2. Generate and inspect the SQL script; do not use startup migration.
3. Apply `backend/database/roles.sql` with a local migration owner, then prove the runtime role cannot create/alter tables, own schema, or bypass RLS.
4. Run integration tests against a disposable PostgreSQL instance. Test foreign keys, partial invitation uniqueness, UTC/UUID mappings, optimistic concurrency, transaction rollback, and clean-database creation.
5. Run a local `pg_dump`, restore into a second database, and validate the application against the restored target.
6. If PgBouncer is available locally, run the transaction-pooling spike. Otherwise use the request middleware's transaction-local `SET LOCAL` test and record PgBouncer as remote-only.

Evidence: migration SQL review, role-grant queries, integration results, dump/restore checksums, and tenant-context leak test.

### Local Phase 3 — authentication and tenant authorization

1. Use a test authentication handler or Firebase Auth Emulator with synthetic identities; never weaken production JWT validation.
2. Exercise `/api/v1/me`, first-use provisioning, verified/unverified email behavior, and claim-to-user mapping.
3. Test member, administrator, owner, global-administrator, removed-member, anonymous, invalid-token, expired-token, wrong-audience, and route/body ID manipulation cases.
4. Run direct SQL as the runtime role with two identities and prove cross-practice reads/writes return no data or a safe denial.
5. Reuse pooled connections between identities and verify `app.external_subject` and `app.user_email` cannot leak.

Evidence: HTTP test report, direct-SQL report, token fixtures, and connection-reuse result.

### Local Phase 4 — practice administration

1. Seed two synthetic practices and users.
2. Exercise practice create/update/list/read, active-practice preference, member role changes/removal, ownership transfer, and invitation create/respond/revoke flows through HTTP.
3. Repeat browser-style requests with the same idempotency key and prove deterministic results.
4. Inject failures between writes and verify no partial practice, membership, preference, or invitation state remains.
5. Run the local UI against the local API and fixtures; capture the critical practice-management journey.

Evidence: contract test output, transaction rollback proof, retry results, and UI acceptance recording.

### Local Phase 5 — content domains

1. Exercise page seed/create/update/version history and stale `If-Match` conflict behavior.
2. Exercise draft/published template transitions and verify definitions cannot contain resolved client/patient values.
3. Exercise contact validation, cursor pagination, articles/navigation, server-side search, and file metadata ownership.
4. Test malformed and oversized editor JSON, cross-practice access, deleted membership, and expired/invalid file access tokens using local stubs or emulators.
5. Verify search results contain the requested practice scope and that the browser never receives direct search credentials.

Evidence: API contract tests, concurrency test, JSON validation report, search isolation report, and file-access stub report.

### Local Phase 6 — frontend API migration

1. Start the local API and run `pnpm --dir frontend generate:api` with `API_OPENAPI_URL` pointing at it.
2. Run TypeScript, lint, component, and end-to-end tests with `NEXT_PUBLIC_API_BASE_URL` set to the local API.
3. Inspect browser network traffic and prove application-domain traffic uses `/api/v1` only.
4. Switch between two practices during delayed requests; verify cancellation, cache removal, and absence of previous-practice data.
5. Reconcile remaining Firestore imports against the Phase 0 inventory. A feature is locally complete only when its domain imports and temporary flag are removed.

Evidence: generated-client drift result, test output, network capture, practice-switch test, and updated traceability inventory.

### Local Phase 7 — extension API

1. Build the extension against a local/mock API origin and synthetic Firebase tokens.
2. Exercise published-template list/detail, token expiry, removed membership, unpublished templates, offline behavior, and rate-limit handling.
3. Use sentinel values such as `SYNTHETIC_EXTERNAL_VALUE_001` and inspect network requests, extension storage, logs, telemetry, and crash payloads.
4. Prove substitutions happen only inside the extension and that clipboard data is not persisted or reported.

Evidence: extension build, automated tests, network/storage/log inspection, and effective-permission review.

### Local Phase 8 — hardening and rehearsal

1. Run representative load tests against local API/PostgreSQL at 1x and 3x expected workload; record latency, errors, and connection usage.
2. Stop PostgreSQL, exhaust connections, invalidate test keys, and stop local search/storage stubs. Verify timeouts, bounded retries, safe errors, and recovery.
3. Run local backup restore, API revision/container rollback, failed migration-bundle, and credential-rotation simulations.
4. Run security checks for object-level authorization, mass assignment, excessive exposure, CORS, rate limits, RLS, logs, secrets, and extension privacy.
5. Run the migration tool twice from a sanitized synthetic Firestore-shaped export. Inject a failure and restart each command to prove resumability and idempotency.
6. Compare source/target counts, aliases, relationships, ordering, rendered documents, search results, and file references.

Evidence: load/failure reports, restore/rollback record, security report, two rehearsal reports, and approved local exceptions.

### Local Phase 9 — cutover dry run

1. Freeze writes in the local Firestore emulator/stub and capture a final export checksum.
2. Apply the EF bundle, transform, validate source, import, validate target, and rebuild search using direct local connections.
3. Run critical smoke journeys and tenant/privacy sentinels.
4. Simulate API-backed enablement, observation, rollback before PostgreSQL-only writes, and Firestore read-only retention.
5. Produce the cutover checklist and record every step that requires remote infrastructure or human approval.

Evidence: dry-run timeline, checksums, reconciliation report, critical-journey report, rollback decision record, and remote handoff checklist.

## Local exit condition

The local track is complete when all workstation/CI-verifiable behavior passes with synthetic data, the migration is repeatable, and every remaining item is classified as a remote gate. Local completion never authorizes production cutover.

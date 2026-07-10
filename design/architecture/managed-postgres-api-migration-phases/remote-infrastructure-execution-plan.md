# Remote-infrastructure execution plan

This plan executes the gates that require the managed EU provider, Azure hosting, protected identities, deployed Firebase configuration, production-shaped networking, or production data. It must consume the local-track evidence; it must not use remote infrastructure as a substitute for deterministic local tests.

## Prerequisites and approvals

- Local execution plan completed for the applicable phase and its defects closed or explicitly accepted.
- Approved Azure subscription, Entra tenant, GitHub protected environments, Neon organization/project, Firebase non-production and production ownership, and named responders.
- Separate acceptance and production Neon projects/credentials; approved EU residency, backup/PITR, restore, support, export, and connection-limit evidence.
- Bicep, AVM references, container image, EF bundle, SBOM, and OpenAPI artifact reviewed and immutable.
- Key Vault contains separate pooled runtime and direct migration connection secrets; no secret values in CI variables or logs.
- Maintenance window, go/no-go owners, rollback authority, and data-classification approval for each environment.

## Execution sequence

### Remote Phase 0 — provider and environment approval

1. Complete the Neon region/provider assessment for primary data, replicas, logs, backups, PITR, TLS, encryption, monitoring, maintenance, export/exit, and connection limits.
2. Confirm Azure/Firebase/GitHub ownership, EU regions, data classification, retention, backup, recovery, and secret responsibilities.
3. Review the local inventory against the acceptance/prod source inventory without copying sensitive records into tickets.
4. Obtain application, platform, security, product, and data-migration sign-off.

Evidence: provider evidence pack, environment matrix, inventory counts/checksums, approvals, and risk register.

### Remote Phase 1 — acceptance deployment and pipeline

1. Deploy Bicep to acceptance using protected GitHub OIDC and pinned AVM versions.
2. Push the scanned, SBOM-linked immutable API digest to ACR and deploy that same digest.
3. Deploy the separate migration bundle/job; verify the API startup path never applies migrations.
4. Configure Key Vault references, managed identities, ingress, CORS, rate limits, health probes, logs, and alerts.
5. Run acceptance smoke tests for liveness, readiness, OpenAPI, graceful termination, cold start, and revision rollback.

Evidence: Bicep what-if/apply, image digest/SBOM/provenance, deployment record, health results, logs, and rollback result.

### Remote Phase 2 — Neon, roles, migrations, and restore

1. Provision acceptance PostgreSQL 17 in the approved EU region and record non-secret project/endpoint metadata.
2. Configure separate runtime pooled and migration direct connections through Key Vault.
3. Apply roles and committed EF migrations through the protected migration job.
4. Prove the runtime role cannot create/alter schema, own tables, or bypass RLS from the deployed API path.
5. Verify RLS and `SET LOCAL` tenant context through the actual Neon PgBouncer transaction-pooled endpoint.
6. Take a backup/PITR snapshot and restore it into an isolated acceptance target; record measured RPO/RTO and operator steps.

Evidence: role-grant queries, migration-job output, pooled/direct connection tests, RLS negative report, restore report, and connection-budget calculation.

### Remote Phase 3 — Firebase authentication and tenant isolation

1. Configure acceptance Firebase project, issuer/audience, authorized domains, frontend origins, extension origins, and key refresh behavior.
2. Exercise real signed Firebase tokens: valid, expired, invalid signature, wrong issuer/audience, unverified email, removed membership, and revoked user.
3. Run cross-tenant HTTP and direct-SQL negative tests against the deployed API.
4. Verify membership removal blocks access on the next request and that no cache/revision retains access.
5. Verify CORS denies unknown browser and extension origins and credentials are never allowed with wildcard origins.

Evidence: token matrix, deployed authorization report, CORS report, membership-removal test, and redacted logs.

### Remote Phase 4 — practice administration acceptance

1. Load only approved synthetic or sanitized fixtures into acceptance.
2. Run the full practice/member/invitation/preference workflow through the deployed API and frontend.
3. Exercise retries, transaction failures, concurrency, ownership protection, cursor behavior, and authorization boundaries.
4. Verify API latency and database query plans for membership lookup under the acceptance connection budget.

Evidence: acceptance journey report, retry/concurrency report, query plans, and product acceptance.

### Remote Phase 5 — content and storage acceptance

1. Run page/template/contact/article/search/file contract tests against acceptance.
2. Verify PostgreSQL search filtering and private `practice_id` isolation from HTTP and direct SQL.
3. Configure Firebase Storage authorization through the API, signed URL expiry, object size/type policy, and membership revocation.
4. Inspect template requests with synthetic sentinel values and prove no resolved values enter API requests, logs, analytics, search, storage metadata, or PostgreSQL.

Evidence: feature contract results, search isolation report, signed-URL expiry/revocation report, and privacy inspection.

### Remote Phase 6 — frontend acceptance migration

1. Deploy the frontend with only the acceptance API base URL and Firebase client configuration.
2. Generate/check the OpenAPI client from the deployed acceptance document and run the drift check.
3. Capture browser network traffic for critical journeys; application-domain requests must use the API and contain no database/search credentials.
4. Test auth refresh, slow/aborted requests, practice switching, stale edits, removed membership, and cache isolation.
5. Reconcile the Firestore import inventory and verify no unapproved domain dependency reaches the acceptance release.

Evidence: deployed frontend build, generated-client drift output, network capture, browser regression results, and dependency inventory.

### Remote Phase 7 — extension acceptance

1. Publish an acceptance extension build with exact API host permissions and approved extension origin.
2. Configure the matching API CORS and extension rate-limit policy.
3. Run real-token template list/detail, expiry, revoked membership, unpublished-template, offline, and rate-limit tests.
4. Inspect network, storage, logs, telemetry, crash reports, clipboard handling, and effective browser permissions using synthetic sentinels.
5. Obtain security/privacy sign-off before extension release.

Evidence: extension artifact, origin/CORS/rate-limit configuration, privacy sentinel report, and security approval.

### Remote Phase 8 — production hardening and full rehearsal

1. Configure dashboards and actionable alerts for errors, latency, auth failures, pool saturation, slow queries, storage, migration jobs, backups, Neon capacity, and cold starts.
2. Load-test acceptance at approved multiples of the three-year target, including maximum-replica connection calculations.
3. Exercise dependency failures: Neon suspension/unavailability, exhausted pools, Firebase key rotation, search/storage outage, Container App cold start, revision rollback, failed migration job, and Key Vault credential rotation.
4. Restore a Neon backup/PITR snapshot into an isolated target and repeat the written runbook with an operator other than the author.
5. Complete the security review, image/SBOM review, extension privacy review, and SLO approval.
6. Run at least two full migration rehearsals from sanitized production-like exports and reconcile against Phase 0 counts/checksums.
7. Obtain a signed go/no-go record listing duration, capacity, RPO/RTO, approved exceptions, owners, and expiry dates.

Evidence: dashboards/alert screenshots or queries, load/failure reports, restore/rollback record, security findings, two rehearsal reports, and signed go/no-go checklist.

### Remote Phase 9 — production cutover and stabilization

1. Confirm every Phase 8 exit criterion and freeze the exact image, migration bundle, frontend, extension, and schema versions.
2. Announce the maintenance window and start the owner rota/checkpoints.
3. Deploy maintenance/read-only-capable revisions, take/verify a pre-cutover backup, disable Firestore writes, and capture/checksum the final export.
4. Run the protected EF migration job through the direct endpoint, then transform, source-validate, import, target-validate, and rebuild search.
5. Run smoke tests and critical journeys: authentication, practice administration, invitations, wiki, templates, contacts, articles/search/files, extension retrieval, tenant negatives, and privacy sentinels.
6. Obtain go-live approval, enable API-backed traffic, and keep Firestore read-only for the defined observation period.
7. Monitor SLOs, connections, errors, Neon capacity, auth failures, cross-tenant signals, and critical journeys throughout observation.
8. If rollback is required before PostgreSQL-only writes, switch to the recorded prior release and re-enable Firestore writes. After PostgreSQL writes, require an explicit reverse-data decision.
9. After stabilization, archive the final Firestore export, remove feature flags/dependencies, revoke migration credentials, retain the cutover record, and publish dated export/decommission retention.

Evidence: cutover timeline, checksums, migration reports, smoke/critical-journey report, monitoring record, rollback decision or stabilization approval, revoked-credential proof, and decommission schedule.

## Remote exit condition

The remote track is complete only when the managed acceptance and production gates are evidenced, the signed Phase 8 go/no-go exists, production traffic uses the API/PostgreSQL path, rollback is time-bounded and understood, and Firestore is read-only/archived with a dated decommission plan.

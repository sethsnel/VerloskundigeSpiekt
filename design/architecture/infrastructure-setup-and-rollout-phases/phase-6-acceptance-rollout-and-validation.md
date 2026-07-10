# Phase 6 — Acceptance rollout and operational validation

## Goal

Run the complete release and recovery path in acceptance, measure real cold-start and capacity behavior, tune initial settings, and prove that operators can detect and recover from expected failures before production is provisioned for cutover.

## Starting contract from Phase 5

- Acceptance has isolated Azure and Neon resources, a valid HTTPS endpoint, explicit CORS, and correctly configured test clients.
- Verified API and migration artifacts can be deployed by immutable digest.
- Runtime and migration connections and privileges are separated.
- Rollback, secret rotation, and DNS/certificate procedures are documented.
- The application workstream has supplied the release-candidate API, frontend, extension, migration bundle, and test suites needed for the checks below. Full production-candidate validation aligns with application Phase 8 in the [managed PostgreSQL API migration plan](../managed-postgres-api-migration-plan.md).

## Actions

### 1. Deploy the acceptance release

- Promote the selected API digest to acceptance with `minReplicas: 0`, initial `maxReplicas: 3`, 0.5 vCPU, 1 GiB memory, port `8080`, and the approved HTTP concurrency target near 20.
- Verify startup, liveness, and readiness probes. Liveness must not query PostgreSQL; readiness may do so only with a tight timeout.
- Run the matching migration artifact through the manual job and direct Neon endpoint. Confirm migration is absent from API startup.
- Record artifact digests, migration version, Container App revision, database endpoint class, and workflow runs.

### 2. Execute functional and security validation

Run automated tests against the public acceptance URL for:

- smoke and core API behavior;
- Firebase authentication and invalid/expired token handling;
- tenant isolation and RLS, including concurrent tenant contexts through pooled connections;
- frontend and browser-extension contracts;
- CORS allow/deny cases;
- health endpoint semantics; and
- bounded behavior when PostgreSQL is unavailable or resumes after suspension.

Investigate any cross-tenant, authentication, or secret exposure signal as a release blocker.

### 3. Measure cold starts and load behavior

- Measure several cold starts with both Container Apps and Neon suspended, and separately with only one layer cold.
- Capture median and tail latency, time to readiness, request failures/retries, and user-visible client behavior.
- Exercise representative concurrency while observing API replicas, Npgsql connections, Neon CU utilization, response latency, and error rate.
- Decide whether scale-to-zero remains acceptable. If not, record the approved warm-resource choice and cost impact rather than silently changing settings.

### 4. Exercise recovery runbooks

- Move traffic to a previous Container App revision and back using `rollback-revision.ps1`.
- Simulate a failed migration before destructive change, verify the job fails closed, and recover without automatically applying a down-migration.
- Rotate acceptance runtime and migration credentials, publish new Key Vault versions, restart/refresh workloads as required, and revoke old credentials.
- Restore Neon to an isolated target at a selected point in time, validate data, and destroy or expire the isolated copy according to policy.
- Suspend/recover database compute and confirm bounded API degradation and recovery.

### 5. Validate observability and response

- Trigger representative availability, error-rate, latency, database-connectivity, budget, and secret/certificate alerts.
- Confirm notifications reach primary and backup responders and contain actionable context without secret or sensitive payload data.
- Verify structured logs correlate deployment revision, request, and failure while excluding health-check noise and sensitive fields.

### 6. Tune and freeze production-candidate settings

From measurements, adjust and record:

- telemetry sampling and retention;
- Npgsql maximum pool size, timeouts, keepalive, and bounded retry settings;
- Container Apps HTTP concurrency and replica bounds;
- Neon maximum CU and scale-to-zero behavior; and
- alert thresholds and suppression rules.

Repeat affected tests after tuning. Publish the final candidate settings and an acceptance validation report for Phase 7 approval.

## Validation and evidence

- Functional, authentication, tenant-isolation, CORS, and extension suites pass.
- Cold-start results and the accept/warm decision are approved.
- Revision rollback, failed-migration handling, credential rotation, and isolated point-in-time restore are demonstrated with timestamps and owners.
- Alerts reach named responders without unacceptable noise.
- Final settings are backed by measurements and represented in Bicep/parameters or the human-configuration register.
- No unresolved severity-one security, data-integrity, or recovery defect remains.

## End-state and handoff to Phase 7

Phase 6 is complete when the release path, rollback, restore, rotation, alerting, and cold-start behavior have been demonstrated and approved in acceptance. Phase 7 receives:

- approved API and migration artifact digests;
- the acceptance validation report and workflow evidence;
- measured and version-controlled production-candidate settings;
- tested operational runbooks and named responders; and
- an explicit list of accepted residual risks and production go/no-go approvers.

Phase 7 must deploy the same validated infrastructure artifact and application digests; any material change returns the affected validation to Phase 6.

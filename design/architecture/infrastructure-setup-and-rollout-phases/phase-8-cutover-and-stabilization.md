# Phase 8 — Application/data cutover and stabilization

## Goal

Move production application data and traffic from Firestore to the validated ASP.NET Core API and PostgreSQL platform, observe it through an agreed safety window, and retire temporary migration access without losing the ability to roll back during that window.

This phase must be coordinated with Phase 9 of the [managed PostgreSQL API migration plan](../managed-postgres-api-migration-plan.md).

## Starting contract from Phase 7

- Production Azure, Neon, DNS/TLS, schema, observability, alerts, budgets, and no-traffic API revision are validated.
- The approved application and migration digests are traceable to acceptance evidence.
- The cutover runbook names approvers, operators, observation period, rollback thresholds, and exact artifacts.
- Firestore can enter maintenance/read-only mode and remains available as the agreed rollback source.

## Actions

### 1. Hold the go/no-go review

- Confirm all Phase 7 evidence, staff availability, vendor status, backup/restore readiness, client release readiness, and communication channels.
- Freeze unrelated production changes for the cutover window.
- Record timestamps, participants, approved artifact digests, source-data checkpoint, and the explicit go decision.
- Abort before maintenance mode if any critical prerequisite, approver, monitoring path, or rollback artifact is unavailable.

### 2. Quiesce source writes

- Enable the approved maintenance/read-only state and verify clients can no longer create divergent Firestore writes.
- Record the last accepted write/checkpoint and confirm background jobs, admin tools, and extensions honor the freeze.
- Keep authentication and status communication operating as designed.

### 3. Export, import, migrate, and validate

- Run the approved Firestore export with immutable metadata/checksums and protected access.
- Import into production PostgreSQL using one-time migration credentials and the direct endpoint.
- Run any required backward-compatible database migration through the migration job; do not invoke migrations from API startup.
- Rebuild search indexes as required.
- Execute automated and reviewed reconciliation: entity counts, key relationships, sampled records, tenant ownership, required constraints, timestamps, and business totals defined by the application migration plan.
- Stop and follow the runbook if validation thresholds are missed; do not route traffic to questionable data.

### 4. Deploy and test the compatible revision

- Confirm the approved API revision is connected to the imported production database through pooled runtime credentials.
- Run protected smoke, authentication, authorization, RLS/tenant-isolation, and critical user-journey tests against the revision without general client traffic.
- Verify revision/digest, migration version, search version, and health/telemetry correlation.

### 5. Switch clients and traffic

- Update the production frontend/API configuration or traffic routing according to the runbook.
- Confirm the frontend and browser extension use only the production API URL.
- Increase traffic gradually when supported and justified; otherwise use the predefined atomic switch and immediate health checks.
- Record the exact traffic-switch time and retain the previous Container App revision.

### 6. Observe and apply rollback thresholds

Throughout the agreed observation period, monitor:

- Firebase authentication failures and authorization denials;
- HTTP `4xx/5xx`, latency, availability, cold starts, and revision health;
- PostgreSQL connections, pool exhaustion, query failures, locks, and data-integrity signals;
- Neon CU usage, suspend/resume behavior, and storage growth;
- cross-tenant/RLS security signals;
- frontend/extension contract errors; and
- Azure/Neon cost anomalies.

Use the named thresholds and decision owner. Application rollback normally moves traffic to the previous compatible revision and restores the agreed Firestore read-only path; never automatically run EF down-migrations. If new PostgreSQL writes make source rollback non-trivial, follow the approved reconciliation procedure rather than improvising dual-write.

### 7. Stabilize and close the rollout

After the observation window and explicit stabilization approval:

- deactivate obsolete Container App revisions while retaining required digests/artifacts according to policy;
- revoke one-time export/import and migration credentials, rotate ongoing credentials if required, and verify old access fails;
- remove temporary permissions and reapply/finalize resource locks;
- dispose of temporary exports and restore targets according to retention and privacy policy;
- reconcile infrastructure, database, DNS, Firebase, GitHub, and client configuration inventories;
- archive the final runbook, validation report, decisions, incident notes, costs, and workflow evidence; and
- schedule post-cutover cost/security review and later removal of Firestore rollback capability after its separately approved retention window.

## Validation and evidence

- Reconciliation proves the imported application data meets all approved completeness and integrity thresholds.
- Production frontend and extension traffic use the API and PostgreSQL exclusively for application data.
- Authentication, tenant isolation, latency, errors, database connections, CU usage, and cost remain within approved thresholds for the full observation period.
- Previous revision and Firestore rollback artifacts remain available for the agreed window.
- One-time credentials and temporary permissions are revoked and negative access checks pass.
- Final resource/human-configuration inventory and archived runbook match actual state.

## Final end-state

Phase 8 is complete when production application traffic uses the ASP.NET Core API and PostgreSQL exclusively, the stabilization window has passed with explicit approval, temporary migration access is revoked, final protection controls are applied, and the operational evidence/runbook is archived.

The steady-state team now owns normal immutable deployments, expand-and-contract migrations, revision rollback, credential rotation, restore testing, alert response, AVM/dependency upgrades, and monthly cost review for the first six months (quarterly thereafter). Firestore rollback retirement is a later, separately approved action and must not be inferred solely from completion of this phase.


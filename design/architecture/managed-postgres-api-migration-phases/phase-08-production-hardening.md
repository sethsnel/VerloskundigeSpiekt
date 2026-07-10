# Phase 8 — Production hardening and migration rehearsal

## Goal

Demonstrate that the complete new stack is secure, recoverable, observable, supportable, and performant before production data or traffic moves.

## Inputs from Phases 0–7

- Production-shaped API, database, web frontend, and extension.
- Source-data baseline/traceability inventory and accepted behavior.
- Infrastructure operational paths, monitoring ownership, and migration artifact workflow.

## Implementation actions

1. Add dashboards and actionable alerts for error rate, latency, authentication failures, database connections/pool saturation, slow queries, storage, migration jobs, and backup status. Validate routing and redaction.
2. Agree measurable service-level indicators/objectives and load-test thresholds appropriate to the product stage.
3. Load-test wiki reads, template listing, practice switching, search, and concurrent edits at multiples of the three-year target. Include cold starts and connection-budget calculations across maximum replicas.
4. Run dependency failure experiments for unavailable PostgreSQL, exhausted connections, expired/rotated Firebase keys and tokens, and search/storage outages. Verify bounded retries, timeouts, safe errors, and recovery.
5. Restore a backup/point-in-time snapshot into an isolated environment. Validate application behavior and record measured RPO/RTO and operator steps.
6. Review broken object-level authorization, mass assignment, excessive exposure, RLS, CORS, rate limits, secret handling, dependencies, images/SBOM, logs, and extension privacy. Remediate all release-blocking findings.
7. Complete and exercise runbooks for deployment, failed schema migration, revision rollback, credential rotation, tenant export/deletion, incident response, and escalation.
8. Run a full migration rehearsal from a sanitized production-like Firestore export. Compare counts, relationships, identifiers, representative rendered content, search, files, and user journeys with preview.
9. Exercise cold start with Container Apps and Neon suspended, revision rollback, EF migration job failure, database credential rotation, and point-in-time restore using the infrastructure plan.
10. Obtain platform/security approval of evidence and product-owner approval of rehearsed behavior. Track every exception with an owner, risk acceptance, and expiry.

## Deliverables

- Dashboards, alerts, SLOs, and load/failure-test reports.
- Tested backup/restore and operational runbooks with measured RPO/RTO.
- Security review and remediation evidence.
- Sanitized full-migration rehearsal and product acceptance report.
- Go/no-go checklist for Phase 9.

## Verification and evidence

- Trigger representative alerts and confirm the correct responder receives usable context.
- Repeat restore and rollback from the written runbooks with an operator other than the author.
- Demonstrate performance headroom without exceeding connection/cost limits.
- Re-run tenant negative and extension privacy sentinel tests under production-shaped configuration.
- Reconcile rehearsal output against the Phase 0 inventory and document approved exceptions.

## End state and exit criteria

- Restore, rollback, credential rotation, migration failure, and incident paths have been exercised.
- Performance is inside approved targets with no tenant/privacy exposure.
- A full sanitized migration produces reconciled, product-approved behavior.
- All production cutover prerequisites have evidence and explicit go/no-go owners.

## Handoff to Phase 9

Phase 9 receives tested tooling assumptions, measured runbooks/RPO/RTO, approved migration mappings and exceptions, known duration/capacity figures, and a signed go/no-go checklist. Production cutover must not start without this handoff.


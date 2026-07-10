# Phase 9 — Build migration tooling and cut over production

## Goal

Repeatably migrate the production data model to PostgreSQL, reconcile it, switch all application traffic to the API, and retain a controlled, time-bounded rollback and Firestore decommission path.

## Inputs from Phase 8

- Approved go/no-go checklist and product acceptance of rehearsed behavior.
- Exercised restore/rollback/runbooks and measured migration duration/RPO/RTO.
- Approved mappings, validation rules, exceptions, and production capacity.

## Implementation actions

1. Create `tools/migration-firestore-postgres/` with versioned `export`, `transform`, `validate-source`, `import`, `validate-target`, `rebuild-search`, and `report` commands. Use server credentials only through approved secret paths.
2. Make commands idempotent and resumable. Persist migration run ID, export timestamp/checksum, source document ID, target/alias ID, status, retry/error metadata, and tool/schema versions without recording sensitive content in reports.
3. Implement explicit mappings for Firebase users, practices, members, invitations, user state, private articles/pages and nested notes, global articles/sections, navigation ordering, and file metadata. Migrate legacy topics/subtopics only if the inventory confirms they are authoritative.
4. Preserve Firestore identifiers as migration aliases even when target primary keys are UUIDs. Import transactionally in dependency order and make reruns deterministic.
5. Validate source shapes/references/sizes/duplicates before import. Validate target counts, stable IDs, checksums, relationships, memberships, ordering, representative rendering, file references, and search after import.
6. Complete at least two production-like rehearsals. Have a second engineer review reports, failure recovery, runtime, and approved exceptions.
7. Prepare the maintenance window, owner rota, communications, checkpoints, abort criteria, rollback decision authority, and maintenance/read-only-capable application versions. Record deployed versions and take/verify a pre-cutover PostgreSQL backup.
8. At cutover, disable Firestore writes, capture/checksum the final export, run the protected EF migration job over the direct endpoint, then transform, validate source, import, validate target, and rebuild search through direct connections.
9. Run API smoke tests and critical journeys: authentication, practice selection/admin, invitations, wiki read/edit, published templates, contacts, articles/search/files, extension retrieval, and tenant/privacy negatives.
10. Obtain go-live approval and enable the API-backed application. Keep Firestore read-only for the agreed observation period; never dual-write.
11. If rollback is required before PostgreSQL-only writes, switch to the recorded prior frontend and re-enable Firestore writes under the runbook. After PostgreSQL accepts writes, require an explicit reverse-data decision; never treat rollback as a flag flip.
12. After observation, archive and verify a final Firestore export, remove flags/domain dependencies, revoke migration credentials, retain the cutover/rollback record, and document Firestore/export retention and deletion dates.

## Deliverables

- Versioned migration tool with automated tests and operator documentation.
- Rehearsal and production source/target reports.
- Maintenance, checkpoint, go/no-go, rollback, and cutover records.
- Verified archive, revoked credentials, and dated decommission schedule.

## Verification and evidence

- Restart every command after injected failure and prove it resumes without duplication/corruption.
- Independently review final source checksum and target reconciliation report.
- Run tenant-isolation and extension privacy sentinels after migration.
- Monitor agreed SLOs, connections, errors, and critical journeys throughout the observation period.
- Verify migration credentials no longer authenticate and Firestore remains read-only.

## End state and program completion criteria

- Reports reconcile source and target or list approved documented exceptions.
- All production domain data flows through ASP.NET Core to PostgreSQL; browser and extension use documented contracts only.
- Migrations reproduce environments, tenant isolation remains tested, and operational restoration remains proven.
- Firestore is read-only, archived, and scheduled for dated decommissioning.
- Migration credentials are revoked and cutover/rollback evidence is retained.
- Patient/client substitution data remains local to the extension and absent from API requests, logs, analytics, search, and PostgreSQL.

## Handoff to operations

The program closes into normal operations with the API/PostgreSQL stack as the system of record, established deployment and migration runbooks, monitored SLOs, a Firestore/export deletion schedule, and named owners for ongoing security, recovery testing, schema evolution, and provider exit readiness.


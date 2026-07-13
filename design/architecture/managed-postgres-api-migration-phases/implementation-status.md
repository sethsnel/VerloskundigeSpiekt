# Implementation status

Updated 2026-07-12 after the remediation pass. Pending evidence is split between the [local-development execution plan](local-development-execution-plan.md) and the [remote-infrastructure execution plan](remote-infrastructure-execution-plan.md).

| Phase | Status | Evidence / remaining release gate |
| --- | --- | --- |
| 0 | Baseline recorded | `phase-00-evidence.md`; provider commercial/residency evidence still needs platform approval |
| 1 | Locally verified | Backend, non-root image contract, readiness, OpenAPI, migration/service CI, SBOM and enforced audit/image-scan gates |
| 2 | Locally verified | Protected-role bundle application/update/no-op, PostgreSQL 17, command-specific RLS, grants, composite tenant FKs, JSONB, direct-SQL tests, outage and restore rehearsal |
| 3 | Implemented in code | Firebase JWT validation, current-user provisioning, transaction-local tenant context and RLS policies; local test tokens precede the remote real-token matrix |
| 4 | Locally verified | Practice/member/invitation/preference workflows, atomic owner transfer, persisted idempotency, mandatory ETags, reusable authorization handlers and role/token matrix |
| 5 | Locally verified | Wiki history, structural templates, contacts, FTS, authorized object storage, and global article/tag/navigation APIs with tenant/public RLS tests |
| 6 | Locally verified | Generated contract types, bounded transport, tenant-cache lifecycle, API-backed domain hooks, component/E2E tests, and no remaining application-domain Firestore/search imports |
| 7 | Locally verified | Runnable extension, Firebase REST session lifecycle, list/detail API, conservative failure handling, structural substitution and privacy/permission documentation |
| 8 | Local gates executed | See [local Phase 8 evidence](local-phase-08-evidence.md); managed dashboards, regional capacity, PITR and real extension/Firebase revocation remain remote gates |
| 9 | Local rehearsal tooling verified | Recursive canonical checksums, committed run-state schema, deterministic resumable imports, complete approved mappings, reconciliation/corruption checks and search rebuild; production export/cutover intentionally not run |

The local implementation and synthetic rehearsal are complete, but this is not a claim that production has been cut over. Production cutover remains blocked until the remote Phase 8 gates and go/no-go record are signed.

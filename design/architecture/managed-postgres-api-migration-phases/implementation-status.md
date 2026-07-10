# Implementation status

Recorded 2026-07-10 after the initial implementation pass. Pending evidence is split between the [local-development execution plan](local-development-execution-plan.md) and the [remote-infrastructure execution plan](remote-infrastructure-execution-plan.md).

| Phase | Status | Evidence / remaining release gate |
| --- | --- | --- |
| 0 | Baseline recorded | `phase-00-evidence.md`; provider commercial/residency evidence still needs platform approval |
| 1 | Implemented | `backend/`, Dockerfile, Compose, CI, health/OpenAPI smoke tests; Docker daemon was unavailable locally |
| 2 | Implemented in code | EF migrations, PostgreSQL 17 Compose, roles SQL, RLS migration and bundle workflow; local clean-db/role/restore execution precedes remote Neon validation |
| 3 | Implemented in code | Firebase JWT validation, current-user provisioning, transaction-local tenant context and RLS policies; local test tokens precede the remote real-token matrix |
| 4 | Implemented in code | Practice/member/invitation/preference controllers and transactional service; local fixture/UI acceptance precedes remote acceptance deployment |
| 5 | Implemented in code | Page/template/contact/article/search/file metadata contracts; local privacy/storage stubs precede remote Firebase Storage and acceptance tests |
| 6 | Partial | Generated OpenAPI output, transport, cache keys and practice/invitation hooks are API-backed; local browser migration precedes removal of remaining Firestore domain imports |
| 7 | Contract implemented | Extension manifest/client/local substitution boundary added; local sentinel suite precedes remote origin/CORS/rate-limit validation |
| 8 | Runbooks/checklist added | Local load/failure/restore/rehearsal execution is planned; managed dashboards, cold starts, PITR, full rehearsals, and go/no-go require remote infrastructure |
| 9 | Tooling foundation added | Manifest transform/validation/reporting and alias recording are present; production Firebase export adapter, complete domain-row import, reconciliation rehearsals and cutover are intentionally not run |

The implementation is therefore a production-shaped migration foundation, not a claim that production has been cut over. Phase 9 must remain blocked until the Phase 8 go/no-go record is signed.

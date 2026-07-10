# Phase 6 — Add the API client and migrate frontend data access

## Goal

Move React Query from direct Firestore access to a generated ASP.NET Core API client without changing user-visible behavior or leaking cached tenant data.

## Inputs from Phases 4 and 5

- Accepted OpenAPI contracts and fixtures for each feature being migrated.
- Stable authentication, authorization, error, pagination, and concurrency behavior.
- Traceability inventory from Phase 0, updated with API readiness.

This phase may begin per feature after that feature's API contract is accepted. A feature is not complete until its old imports are removed and its tests pass.

## Implementation actions

1. Select and pin an OpenAPI TypeScript generator. Add a reproducible generation command and CI drift check; either commit generated output or generate it deterministically according to team policy. Never hand-maintain duplicate DTOs.
2. Implement one frontend transport for API base URL, Firebase ID-token acquisition/refresh, bearer headers, correlation IDs, Problem Details mapping, abort signals, and timeouts. Avoid token/body logging.
3. Define React Query key factories that include authenticated-user identity and explicit `practiceId` for tenant data. Centralize invalidation rules.
4. On authentication or active-practice change, cancel in-flight tenant requests and remove tenant-scoped cached queries before rendering the new context.
5. Migrate in order: current user/preference; practices; invitations/members; private wiki; templates; contacts; global articles/navigation; search/file metadata.
6. For each feature, replace Firestore imports with generated-client calls, preserve loading/error/empty/mutation states, map concurrency conflicts usefully, update only affected cache keys, and add component plus end-to-end happy-path tests.
7. Use a temporary per-feature Firestore/API selection flag only in development and acceptance. Do not dual-write. Record owner and removal condition for every flag.
8. After a feature passes acceptance, use repository-wide import searches to remove its obsolete Firestore module and update the Phase 0 traceability row.
9. Add CI checks that prevent new application-domain imports from the Firestore modules and verify generated-client drift.
10. Complete regression testing for authentication refresh, practice switching, slow/aborted requests, retry/idempotency, validation errors, stale edits, and removed membership.

## Deliverables

- Reproducible generated TypeScript client and common transport.
- Tenant-safe query keys/cache lifecycle.
- API-backed feature hooks/components and regression tests.
- Removed domain Firestore modules and temporary flags.

## Verification and evidence

- Search all of `frontend/` for domain reads/writes through Firestore and reconcile every result.
- Capture network tests showing application data travels only to `/api/v1` endpoints.
- Switch practices during slow requests and prove prior-practice responses/data cannot appear.
- Run component, end-to-end, frontend build, and generated-client drift checks.
- Prove no feature performs dual writes in any environment.

## End state and exit criteria

- `frontend/` contains no domain-data Firestore reads or writes.
- React Query uses only the ASP.NET Core API for application data.
- Practice switching and identity changes cannot expose stale tenant cache data.
- Temporary migration flags and obsolete modules are removed.

## Handoff to Phase 7

Phase 7 receives proven Firebase bearer-token transport patterns, stable published-template operations, tenant-safe failure handling, and an API that no longer depends on frontend Firestore behavior. Phase 8 receives a fully API-backed web workload for realistic testing.


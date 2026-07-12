# Managed PostgreSQL API migration audit and remediation backlog

Audit date: 2026-07-12  
Reviewed range: `ed1252936cbd5b2b7d11bae7e2b4acd44fc32180^..6984cb4` (inclusive of the main implementation commit)  
Source plans: `design/architecture/managed-postgres-api-migration-phases/README.md`, all phase files, the master migration plan, and `local-development-execution-plan.md`

## Verdict

The implementation is a useful migration foundation, but it does **not** implement all application details required by the plans and does **not** satisfy the local-development exit condition.

The phase status document overstates completion of Phases 1-5. Phases 6-9 are partial or scaffolding. Most importantly, the database-layer tenant-isolation claim is currently false: the restricted runtime role can add itself as an owner of another practice and then read that practice.

Do not treat the current implementation as accepted for deployment, migration rehearsal, or production cutover. Reopen at least Phases 2-5, fix the authorization, RLS, grants, migration-integrity, and test-coverage blockers, and rerun the complete local execution plan before starting remote gates.

Severity used below:

- **Critical:** tenant isolation, privilege escalation, or migration correctness can fail in a way that invalidates a core safety claim.
- **High:** release-blocking behavior, authorization, data integrity, or essential plan requirement is broken or absent.
- **Medium:** important correctness, maintainability, resilience, or defense-in-depth problem.
- **Low:** cleanup or hardening that should be addressed but is not independently release-blocking.

## Critical and high-priority remediation

### MIG-001 — Critical: prevent direct cross-practice self-enrollment

- [ ] Replace the combined `practice_members` policy with command-specific `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies.
- [ ] Do not allow a user to insert a membership merely because `user_id` equals their own user ID.
- [ ] Ensure only an authorized administrator can create ordinary memberships.
- [ ] Ensure only an owner-controlled workflow can grant the `Owner` role.
- [ ] Provide narrowly scoped transactional database/application paths for initial practice-owner creation and invitation acceptance without opening arbitrary self-enrollment.
- [ ] Add direct-SQL tests as `vs_api` proving a user cannot insert themselves into another practice as `Member`, `Administrator`, or `Owner`.
- [ ] Add direct-SQL tests proving cross-practice reads remain denied after attempted write manipulation.

Evidence: `backend/src/VerloskundigeSpiekt.Infrastructure/Migrations/20260710100843_InitialTenancyContent.cs:556` permits `WITH CHECK` when the inserted `user_id` is the current user. Dynamic testing as `vs_api` inserted user B as `Owner` of practice A, after which user B could read both practices. The transaction was rolled back after proof.

### MIG-002 — Critical: prevent administrator-to-owner privilege escalation

- [ ] Reject `Owner` in the normal member-role update endpoint.
- [ ] Reject `Owner` in invitation creation.
- [ ] Restrict ownership changes to the owner-only ownership-transfer workflow.
- [ ] Configure enum deserialization to reject integer enum values and validate allowed role transitions explicitly.
- [ ] Add API, service, and database tests for every role transition.

Evidence: `InfrastructureServices.cs:95-105` allows an administrator to assign any `PracticeRole`, including `Owner`; `InfrastructureServices.cs:145-160` likewise accepts an invitation role without excluding `Owner`.

### MIG-003 — High: repair invitation-response RLS

- [ ] Permit the verified invited identity to accept or decline its own pending invitation without permitting arbitrary invitation mutation.
- [ ] Keep administrative revoke/update rights separate from invitee response rights.
- [ ] Enforce status transition rules and invited-email matching in both application logic and the authorized database path.
- [ ] Make repeated accept/decline requests deterministic as required by the plan.
- [ ] Add runtime-role tests for pending, accepted, declined, revoked, and expired invitations.

Evidence: the invitation policy lets an invitee select a row by normalized email, but its `WITH CHECK` permits updates only for practice administrators (`InitialTenancyContent.cs:557`). Dynamic testing confirmed that user B could read the pending invitation but PostgreSQL rejected acceptance with `new row violates row-level security policy`.

### MIG-004 — High: complete and verify runtime database grants

- [ ] Grant the minimum required runtime privileges for every table actually used by API endpoints, including `articles` and `article_sections`.
- [ ] Review `email_template_keys`, `migration_aliases`, and any later tables and explicitly decide whether the API requires access.
- [ ] Add a grant-verification test that enumerates expected and forbidden privileges.
- [ ] Run all API integration tests under `vs_api`, never the schema owner or `postgres`.
- [ ] Ensure public article and search endpoints work with the production runtime role.

Evidence: `backend/database/roles.sql:8` omits public article tables. The production image returned HTTP 500 from `GET /api/v1/articles`; PostgreSQL reported SQLSTATE `42501`, permission denied for `articles`.

### MIG-005 — High: make database-role bootstrap and migration ownership coherent

- [ ] Split role creation/bootstrap from post-schema table grants.
- [ ] Define a dedicated owner/migration role that owns schema objects and can alter them in later releases.
- [ ] Ensure the runtime role never owns tables and never receives `BYPASSRLS`.
- [ ] Document and automate the exact clean-environment order.
- [ ] Add a test that applies an initial bundle and then a schema-changing follow-up bundle with the protected migration role.

Evidence: when migrations were initially applied as `postgres` and `roles.sql` was applied afterward, `vs_migrator` could create tables but could not alter `users` (`must be owner of table users`). A clean database created and migrated by `vs_migrator` worked, showing that the documented/bootstrap ordering is the problem.

### MIG-006 — High: replace the broken canonical checksum implementation

- [ ] Replace `JSON.stringify(value, Object.keys(value).sort())` with recursive canonical JSON serialization.
- [ ] Specify how Firestore timestamps, undefined values, maps, arrays, and key ordering are normalized.
- [ ] Add tests proving nested value changes alter the checksum.
- [ ] Add tests proving property-order-only changes do not alter the checksum.
- [ ] Version the checksum algorithm in manifests and reports.

Evidence: `tools/migration-firestore-postgres/src/manifest.ts:10`. Two different nested exports generated the same checksum because the replacer stripped nested properties; the effective serialization was `{"collections":[{}]}`.

### MIG-007 — High: implement substantive target reconciliation

- [ ] Validate target domain-row counts by type, not only alias count.
- [ ] Compare stable IDs/aliases, checksums, relationships, memberships, ordering, page sections, representative rendering, file references, and search output.
- [ ] Fail validation when aliases exist but target domain rows are absent or corrupt.
- [ ] Record approved exceptions explicitly with owner and reason.
- [ ] Add automated corruption tests showing `validate-target` detects missing and mismatched rows.

Evidence: `cli.ts:257-259` reports reconciliation solely from `migration_aliases` count. A synthetic run reported `reconciled: true` because eight aliases existed; the validator did not inspect the eight corresponding domain records.

### MIG-008 — High: make migration reruns state-idempotent and resumable

- [ ] Stop generating new row-version bytes for unchanged records on every rerun.
- [ ] Avoid updates when the source checksum and mapped target state are unchanged.
- [ ] Persist per-record status, retry count, error metadata, tool version, and schema version.
- [ ] Define restart checkpoints rather than wrapping the entire import in one all-or-nothing operation and calling that resumable.
- [ ] Make run IDs stable/resumable for the same export or explicitly support a resume token.
- [ ] Inject failures at multiple dependency levels and prove restart without duplication or state churn.

Evidence: three imports of the same synthetic manifest did not duplicate rows, but the stored user row version changed from `4ca99ddc5c7b4aeb9e9219d0ad3bb132` to `65abd1b37eeb497c8868204ca3add489`. The current tool is row-count idempotent, not state-idempotent or meaningfully resumable.

### MIG-009 — High: implement the actual file authorization boundary

- [ ] Add authorized upload/download operations or short-lived signed URLs.
- [ ] Bind storage object paths to practice-owned namespaces server-side.
- [ ] Do not accept an arbitrary client-selected `StorageObjectName` as proof of ownership.
- [ ] Validate filename, MIME type, size, storage object existence, practice ownership, and allowed path.
- [ ] Test URL expiry and immediate denial after membership removal.
- [ ] Migrate the frontend away from direct Firebase Storage operations.

Evidence: `ContentService.cs:132-138` lets any practice member register an arbitrary storage object name and only lists metadata. No signed URL, upload/download authorization, expiry, or storage-object ownership check exists.

### MIG-010 — High: enforce tenant consistency in foreign keys

- [ ] Add composite parent keys and foreign keys so `(practice_id, parent_id)` must reference a parent in the same practice.
- [ ] Apply this to page sections, page versions, template versions, and any other child carrying redundant `practice_id`.
- [ ] Add constraint tests attempting cross-practice parent/child combinations.

Evidence: `AppDbContext.cs:101-123` places `practice_id` on child rows but foreign keys reference only the parent ID. Since RLS evaluates the child `practice_id`, an inconsistent child can undermine tenant assumptions.

## Phase 1 and platform-shaped application work

### MIG-011 — Complete CI/CD gates promised by Phase 1

- [ ] Apply committed migrations to the CI PostgreSQL service.
- [ ] Run actual database integration tests in CI.
- [ ] Validate migration SQL/bundle generation and a clean-database application.
- [ ] Add dependency/security scanning with enforced severity policy.
- [ ] Scan the built image and retain scan output alongside the SBOM.
- [ ] Add generated-client drift checking.
- [ ] Add frontend lint plus component/E2E test jobs once tests exist.
- [ ] Implement immutable image push/promotion and the protected migration-job artifact path, or accurately mark them remote-only rather than implemented.
- [ ] Test readiness, not only liveness and OpenAPI.

Evidence: `.github/workflows/backend.yml` starts PostgreSQL but the two existing smoke tests never use it. The workflow builds an image and SBOM but does not apply migrations, scan dependencies/image, push/promote an immutable digest, or build/test the migration bundle. Frontend CI runs TypeScript/build only.

### MIG-012 — Fix Docker build-context exclusion

- [ ] Add a repository-root `.dockerignore` or `backend/Dockerfile.dockerignore` for the documented root-context build.
- [ ] Exclude Git metadata, local environment files, node modules, build output, test output, planning artifacts, and secrets from the transmitted context.
- [ ] Add a CI assertion inspecting the final image and recording context/image expectations.

Evidence: `backend/.dockerignore` was not used by `docker build -f backend/Dockerfile .`; Docker transferred approximately 74 MB of repository context. Explicit `COPY` prevented source/tests from entering the final image, but the daemon still received the broad context.

### MIG-013 — Pin a matching EF command-line tool

- [ ] Add `.config/dotnet-tools.json` with a `dotnet-ef` version matching the selected EF runtime major/minor.
- [ ] Restore the local tool in CI and documentation before running migrations/bundle creation.
- [ ] Resolve the plan mismatch between required EF Core 10/matching Npgsql and the implemented EF/Npgsql 9.0.4 stack.

Evidence: local migration and bundle execution used globally installed `dotnet-ef` 6.0 against runtime 9.0.4 and emitted a major-version mismatch warning.

### MIG-014 — Remove unsafe production database defaults

- [ ] Remove `postgres/postgres` from base `appsettings.json`.
- [ ] Keep disposable credentials only in development configuration or ignored local settings.
- [ ] Validate that production configuration uses a non-owner runtime role, TLS validation, short connection timeout, and the intended pool limit.
- [ ] Make startup fail when an externally supplied production connection is absent.
- [ ] Either apply `DatabaseOptions.MaximumPoolSize` to the Npgsql builder or remove the unused option in favor of one authoritative setting.

Evidence: base `appsettings.json:3` supplies a usable superuser connection, so database option validation does not demonstrate that deployment configuration is present. The separate `MaximumPoolSize` property is not applied to the data-source builder.

### MIG-015 — Harden correlation IDs and forwarded-header behavior

- [ ] Validate and length-limit caller-supplied correlation IDs; prefer a known format.
- [ ] Do not allow oversized or control-character values into logs/response headers.
- [ ] Configure known proxies/networks for the production reverse proxy and verify HTTPS/HSTS behavior behind Container Apps.

Evidence: `CorrelationIdExtensions.cs:7` accepts any nonblank request header as the trace identifier.

## Authentication, authorization, and API behavior

### MIG-016 — Implement reusable authorization policies and handlers

- [ ] Add separate practice-member, administrator, owner, and global-administrator requirements/handlers.
- [ ] Keep global administrator claims/records distinct from practice roles.
- [ ] Use policies consistently at endpoint/application boundaries rather than duplicating ad hoc role checks.
- [ ] Add the complete token/role matrix: anonymous, invalid, expired, wrong audience, unverified email, member, admin, owner, global admin, removed member, and manipulated IDs.

Evidence: only an `authenticated` policy exists in `Program.cs`; feature services implement local role checks, and global-administrator authorization is absent.

### MIG-017 — Implement real idempotency

- [ ] Persist idempotency key, authenticated caller, request fingerprint, result/status, and expiry.
- [ ] Return the original deterministic response for the same key and equivalent request.
- [ ] Return a stable conflict for the same key with a different request.
- [ ] Cover concurrent/retried practice creation and invitation responses.

Evidence: `InfrastructureServices.cs:47-60` never stores or compares the supplied key. Any nonblank key merely searches for an owner membership with the same slug.

### MIG-018 — Make optimistic concurrency mandatory and protocol-correct

- [ ] Require `If-Match` for updates to existing concurrency-protected resources.
- [ ] Return and consume proper ETag headers, or define and document an equally consistent contract.
- [ ] Map malformed `If-Match` values to a 400 Problem Details response rather than a 500.
- [ ] Ensure the frontend sends the version returned by the API.
- [ ] Test simultaneous writes and stale versions.

Evidence: controllers pass `null` when `If-Match` is absent, and `EnsureVersion` then skips checking. `use-practices.tsx:77` updates without the version. Invalid Base64 throws outside the application validation model.

### MIG-019 — Add systematic request validation

- [ ] Validate required strings before calling `Trim()`.
- [ ] Validate slug format, title/name/key lengths, email syntax/length, phone normalization, file name, content type, and sizes.
- [ ] Reject integer enum inputs and undefined role/status values.
- [ ] Add safe request-body limits appropriate to editor/template documents.
- [ ] Return stable validation Problem Details codes.

Evidence: several DTOs rely on non-nullable C# declarations but have no boundary validation; missing JSON properties can cause null dereferences and HTTP 500 responses.

### MIG-020 — Partition rate limiting appropriately

- [ ] Replace the single global fixed-window bucket with partitions appropriate to authenticated subject/IP/endpoint.
- [ ] Add a stricter extension-template policy and reasonable public-search controls.
- [ ] Test rate-limit behavior and recovery.

Evidence: `Program.cs:45-49` configures one named fixed-window limiter shared by mapped controllers, allowing one caller to consume capacity for others.

## Content-domain implementation gaps

### MIG-021 — Store flexible documents as `jsonb`

- [ ] Map editor documents, snapshots, template definitions, and justified variable metadata to PostgreSQL `jsonb`.
- [ ] Validate the expected document schema rather than only JSON syntax.
- [ ] Add malformed, oversized, excessive-depth, and unsupported-shape tests.

Evidence: the initial migration maps `document_json`, `snapshot_json`, `definition_json`, and `metadata_json` as `text` (`InitialTenancyContent.cs:99,129,322,347,375`).

### MIG-022 — Complete wiki CRUD, seed, and version-history semantics

- [ ] Add explicit idempotent page seed/create behavior rather than a combined implicit upsert contract.
- [ ] Implement required delete and version-history retrieval operations.
- [ ] Store an initial version when a page is created.
- [ ] Replace `CountAsync + 1` version allocation with a concurrency-safe strategy.
- [ ] Preserve all ordered sections rather than returning only the first section as the page document.
- [ ] Test simultaneous edits, rollback, and stale conflicts.

Evidence: `ContentService.cs` creates versions only on updates, derives the number from a count, and maps the first ordered section into the DTO.

### MIG-023 — Replace ineffective template privacy validation

- [ ] Define an explicit allowlist/schema for template keys and placeholders.
- [ ] Use the existing `email_template_keys` model or replace it with a clear validated contract.
- [ ] Validate definitions structurally.
- [ ] Ensure draft/published transitions are explicit and tested.
- [ ] Prove synthetic resolved patient/client values cannot enter requests, storage, logs, search, or reports.

Evidence: `ContentService.cs:75-82` rejects any JSON containing the words `patient` or `client`, which rejects legitimate placeholder names but cannot identify actual resolved personal values. `EmailTemplateKey` is not consulted.

### MIG-024 — Implement contact cursor pagination correctly

- [ ] Decode and validate the input cursor.
- [ ] Apply keyset predicates for `(display_name, id)`.
- [ ] Encode both ordering fields in the next cursor.
- [ ] Reject malformed cursors safely.
- [ ] Test stable traversal with duplicate names and concurrent changes.

Evidence: `ContentService.cs:87-96` accepts `cursor` but never uses it, so every request returns the first page.

### MIG-025 — Implement PostgreSQL full-text search and complete contract semantics

- [ ] Add `tsvector` generation/indexing and a GIN index, or formally approve/document another server-owned search strategy.
- [ ] Enforce practice scope for every private result.
- [ ] Implement deterministic ranking, pagination, limits, and expected filters/facets.
- [ ] Ensure the browser never receives direct search credentials.
- [ ] Remove obsolete frontend index-administration routes/components.

Evidence: backend search uses `%query%` `ILIKE`; frontend compatibility code ignores legacy search options such as skip/top/facets and retains obsolete administration surfaces.

### MIG-026 — Complete global article/navigation behavior

- [ ] Verify all current global article reads and authoring behavior have API equivalents.
- [ ] Return/render all ordered article sections, not only the first.
- [ ] Implement the approved navigation ordering model.
- [ ] Add runtime-role and public-visibility tests.

Evidence: `ListArticlesAsync` and `GetArticleAsync` project only the first section document. Existing Firestore authoring/tag/menu code remains active.

## Frontend migration gaps

### MIG-027 — Use the generated OpenAPI contract instead of duplicate handwritten DTOs

- [ ] Generate typed operations or build wrappers whose request/response types are imported from `openapi.generated.ts`.
- [ ] Remove manually duplicated DTO unions from `lib/api/generated.ts`.
- [ ] Add deterministic generation and CI drift checking.

Evidence: `openapi.generated.ts` is generated but not consumed. `generated.ts` is manually maintained despite its generated-file header.

### MIG-028 — Add real transport timeouts and stable error mapping

- [ ] Combine caller abort signals with a configured timeout signal.
- [ ] Handle Firebase token refresh/reauthentication failures explicitly.
- [ ] Propagate accepted correlation IDs where appropriate.
- [ ] Preserve Problem Details codes and validation fields.
- [ ] Add slow-request, abort, offline, 401, 403, 409, 429, and 500 tests.

Evidence: `transport.ts` forwards `init.signal` but creates no timeout despite the plan requiring abort signals/timeouts.

### MIG-029 — Make tenant cache lifecycle comprehensive

- [ ] Centralize which query keys are tenant-scoped.
- [ ] On identity or practice change, cancel and remove members, invitations, wiki, templates, contacts, files, private search, and all future tenant queries.
- [ ] Ensure delayed old-practice responses cannot repopulate the cache.
- [ ] Add a deterministic delayed-request practice-switch test.

Evidence: `use-practices.tsx:66-69` cancels/removes only `['api','members']`.

### MIG-030 — Finish removing Firestore application-domain access

- [ ] Migrate private wiki/practice articles.
- [ ] Migrate templates.
- [ ] Migrate contacts.
- [ ] Migrate files/storage access.
- [ ] Migrate global article authoring/navigation/tags.
- [ ] Complete search migration and remove obsolete Next search/index routes.
- [ ] Remove corresponding Firestore modules only after feature acceptance.
- [ ] Add a CI import guard preventing new domain Firestore imports.

Evidence: active imports remain in pages, components, containers, article/practice/tag/file hooks, search indexing, and Firebase Storage helpers. The frontend build itself logged `GET TAGS`, showing direct legacy behavior still participates in rendering.

### MIG-031 — Add frontend component and end-to-end coverage

- [ ] Add a component-test framework and scripts.
- [ ] Add browser E2E tests for login/token refresh, practice creation/switching, membership, invitations, wiki, templates, contacts, search, and files.
- [ ] Capture network assertions proving application-domain traffic uses the accepted API boundary.
- [ ] Run the tests in CI.

Evidence: `frontend/package.json` contains no test or E2E command and no frontend test/spec files were found.

## Browser extension gaps

### MIG-032 — Build a runnable extension

- [ ] Add the referenced `background.js`/source build output or update the manifest to a real entry point.
- [ ] Add Firebase authentication, token refresh, reauthentication UX, and logout/revocation handling.
- [ ] Implement both published-template list and detail operations.
- [ ] Handle offline, unavailable contract, unpublished template, removed membership, 401, 403, 404, and 429 safely.
- [ ] Document extension/API version compatibility.

Evidence: `extension/manifest.json:9` references nonexistent `background.js`; the directory contains only the manifest, README, and `template-client.ts`.

### MIG-033 — Make local substitution structurally safe and privacy-tested

- [ ] Substitute inside parsed string nodes instead of replacing raw serialized JSON.
- [ ] Correctly escape quotes, slashes, control characters, and Unicode.
- [ ] Ensure clipboard values are not persisted or logged and are cleared according to the documented lifecycle.
- [ ] Add sentinel tests inspecting network requests, storage, logs, telemetry, and crash payloads.

Evidence: `template-client.ts:11-19` JSON-stringifies the definition and performs raw string replacement, which can produce invalid/injected JSON for values containing JSON-significant characters.

### MIG-034 — Add extension-specific CORS/rate-limit and permission evidence

- [ ] Configure exact extension origins per environment.
- [ ] Add extension-specific conservative rate limits.
- [ ] Verify only required host/clipboard permissions are present.
- [ ] Record effective permission and network inspection evidence.

## Migration tool completeness gaps

### MIG-035 — Complete all required commands and mappings

- [ ] Add `rebuild-search`.
- [ ] Map file ownership/metadata references.
- [ ] Map contacts and email templates once inventory decisions are approved.
- [ ] Resolve tags/topics/subtopics/menu behavior against the authoritative source inventory.
- [ ] Validate and document unsupported legacy shapes rather than silently omitting them.
- [ ] Add tests for every mapped domain and dependency order.

Evidence: the tool exposes no `rebuild-search`; its README explicitly says tags, file metadata, contacts, and email templates remain unmapped.

### MIG-036 — Put migration-run schema in committed migrations

- [ ] Model and migrate `migration_runs` through the reviewed EF/schema workflow.
- [ ] Do not issue `CREATE TABLE IF NOT EXISTS` from normal import execution.
- [ ] Add appropriate constraints, statuses, timestamps, versions, and retention policy.

Evidence: `cli.ts:249` creates `migration_runs` dynamically during import, violating the committed-migrations and separately approved schema-deployment rules.

### MIG-037 — Make the migration tool reproducible and auditable

- [ ] Include the tool in an appropriate workspace or commit its own lockfile.
- [ ] Add `typecheck`, test, lint, and audit scripts.
- [ ] Run those scripts in CI.
- [ ] Pin tool dependencies rather than resolving fresh compatible versions on each operator machine.

Evidence: `pnpm-workspace.yaml` explicitly excludes tools. Initial `pnpm exec tsc` could not find TypeScript; installation required `--ignore-workspace`, and `pnpm audit` could not run because the tool has no lockfile.

## Testing, hardening, and evidence gaps

### MIG-038 — Replace smoke-only backend coverage with the required test matrix

- [ ] Add Testcontainers PostgreSQL fixtures and apply only committed migrations/bundles.
- [ ] Run tests as migration owner, runtime role, and read-only role as appropriate.
- [ ] Cover foreign keys, partial invitation uniqueness, UTC/UUID mapping, concurrency, rollback, clean creation, RLS, direct SQL, pooled reuse, and every API workflow.
- [ ] Add test authentication without weakening production JWT validation.
- [ ] Cover invalid/expired/wrong-audience tokens and every role boundary.
- [ ] Inject failures between multi-record writes.

Evidence: only two backend smoke tests exist: liveness and OpenAPI. The referenced Testcontainers package is unused; readiness and PostgreSQL behavior are not tested.

### MIG-039 — Execute and retain local Phase 8 evidence

- [ ] Define expected 1x/3x workload and run representative load tests.
- [ ] Test PostgreSQL outage and pool exhaustion.
- [ ] Test Firebase key/token invalidation.
- [ ] Test search/storage outage.
- [ ] Exercise backup restore, failed migration bundle, rollback, and credential rotation.
- [ ] Run the complete BOLA/mass-assignment/exposure/CORS/rate-limit/RLS/log/secret/extension security checklist.
- [ ] Run two full migration rehearsals with failure/restart injection.
- [ ] Record reports and approved exceptions with owner/expiry.

Evidence: `operations/` contains checklists/runbook prose, but no load, failure, restore, security, or rehearsal reports were found.

### MIG-040 — Address dependency advisories and enforce future audits

- [ ] Upgrade Next.js to a patched release compatible with the application.
- [ ] Upgrade Firebase/transitive `protobufjs` to patched versions and remove the vulnerable override.
- [ ] Upgrade `tar` and other affected transitive packages.
- [ ] Review all 41 production audit findings, including 17 high-severity advisories, for reachability and remediation.
- [ ] Add an enforced frontend dependency audit to CI.
- [ ] Retain the current successful .NET vulnerability audit in CI.

Evidence: `pnpm audit --prod` reported 41 vulnerabilities: 17 high, 20 moderate, and 4 low. These dependencies mostly predate the API migration commit, so they are not attributed solely to this implementation, but they remain release concerns. `dotnet list package --vulnerable --include-transitive` found no known vulnerable .NET packages.

### MIG-041 — Resolve existing frontend lint warnings

- [ ] Correct missing React hook dependencies in `useFileCenterModal.tsx`.
- [ ] Correct the missing callback dependency in `useModal.tsx`.

Evidence: frontend lint passed with two `react-hooks/exhaustive-deps` warnings.

## Phase-by-phase acceptance status

| Phase | Audit assessment | Required before acceptance |
| --- | --- | --- |
| 0 | Documentation baseline only | Synthetic source manifest/count/checksum evidence; complete caller-level Firebase/Firestore traceability; owners and local/remote classifications reviewed |
| 1 | Partial scaffold | Complete CI gates, readiness test, image/context scan, pinned tooling, validated configuration, container evidence retained |
| 2 | Partial and unsafe | Fix role/bootstrap ownership, grants, tenant FKs, EF version/tooling decision; add real PostgreSQL/role/RLS/restore tests |
| 3 | Authentication/RLS foundation with critical isolation failure | Fix self-enrollment and invitation RLS; add reusable role policies and complete negative auth/direct-SQL/pool-reuse matrix |
| 4 | Routes/services exist but are not accepted | Fix ownership escalation, idempotency, invitation behavior, concurrency, transactional failure tests, fixtures, and UI acceptance |
| 5 | Partial models/routes | JSONB, complete wiki/history, template schema, real cursor, FTS, secure files, all contract/security/concurrency tests |
| 6 | Partial | Migrate every domain, use generated contract types, full cache clearing, remove Firestore modules/flags, component/E2E/network evidence |
| 7 | Non-runnable scaffold | Runnable authenticated extension, detail operation, privacy-safe substitution, tests and inspection evidence |
| 8 | Documentation/checklists only | Local load/failure/restore/security/rollback/rehearsal execution and retained evidence |
| 9 | Partial migration tool | Fix checksum/reconciliation/idempotency, add missing commands/mappings/tests, perform two reviewed rehearsals and cutover dry run |

## Verification completed during this audit

The following checks passed:

- `dotnet restore`, format verification, Release build, and the existing two backend tests.
- Frontend TypeScript, lint, and production build; lint produced the two warnings recorded above.
- Migration CLI TypeScript after installing its separately excluded dependencies.
- Clean PostgreSQL 17 database creation from both committed EF migrations.
- EF migration bundle creation.
- Bundle application to a database owned by `vs_migrator`; a second execution correctly applied no migrations.
- Runtime role attributes: `vs_api` is not superuser, cannot create databases/roles/schema, does not inherit, and does not bypass RLS.
- Transaction-local `app.external_subject`/`app.user_email` reset after commit and did not leak across reused transactions.
- PostgreSQL dump/restore into a second database with matching seeded counts for users, practices, memberships, and articles.
- Production image build and inspection.
- Production image runs as non-root UID 1654.
- Production image contains no SDK, source tree, or tests.
- Production image runs with a read-only root filesystem and a bounded writable `/tmp`.
- `/health/live` and `/health/ready` returned HTTP 200 with PostgreSQL available.
- The container handled `SIGTERM`, logged shutdown, and exited with code 0 without OOM termination.
- .NET package vulnerability audit found no known vulnerable packages.
- Repeated synthetic migration imports did not duplicate the supported domain rows (but did mutate row versions, tracked in MIG-008).

The following checks failed and are captured above:

- Direct SQL cross-practice write isolation under `vs_api`.
- Invitation acceptance under invitee RLS.
- Public article API access under `vs_api`.
- Future table alteration when roles are installed after `postgres`-owned initial migrations.
- Stable migration checksums for nested source values.
- State-idempotent migration reruns.
- Substantive target reconciliation.
- Root-context Docker exclusion.
- Matching/reproducible EF CLI tooling.
- Frontend dependency audit.

## Still unverified or deliberately out of local scope

- Firebase emulator/real-token HTTP authentication matrix was not available in the repository test harness.
- PgBouncer transaction-pooling behavior was not exercised; direct transaction reuse showed correct `SET LOCAL` reset semantics.
- Full API/UI/extension journeys were not executable because fixtures, test authentication, migrated frontend domains, and a runnable extension are absent.
- No load/failure/security rehearsal artifacts exist to execute as written.
- Managed Neon, Azure Container Apps, Key Vault, ACR, OIDC, DNS/TLS, monitoring, provider residency, managed backup/PITR, production capacity, and production cutover are remote gates and remain unverified.

## Positive implementation notes

- The API does not apply EF migrations during startup.
- The committed migrations can reproduce a clean schema.
- The container is genuinely non-root and compatible with a read-only root filesystem.
- Health readiness includes a PostgreSQL connectivity check.
- Sensitive EF/Npgsql parameter logging is disabled.
- Unhandled API errors return a safe generic Problem Details body rather than database details.
- Public and tenant tables are separated conceptually, and most tenant tables have RLS enabled; the policy semantics need correction rather than a complete redesign.
- Application DTOs are separate from EF entities.
- Transaction-local tenant context resets correctly after commit.
- Dump/restore and migration-bundle mechanics work under a coherent owner-role setup.

## Recommended remediation order

1. Fix MIG-001 through MIG-005 and add runtime-role integration tests before changing more domain code.
2. Fix migration checksum, reconciliation, and idempotency issues in MIG-006 through MIG-008 before any rehearsal data is trusted.
3. Enforce tenant foreign keys and complete secure file boundaries.
4. Make CI execute migrations, role/RLS tests, audits, generated-client drift, and container checks.
5. Complete Phase 4 workflow semantics and tests.
6. Complete Phase 5 APIs and database semantics.
7. Finish frontend migration and cache isolation; remove Firestore domain access.
8. Build and test the extension.
9. Execute local Phase 8 and two full Phase 9 rehearsals.
10. Only after all local evidence passes, proceed to remote infrastructure and production gates.

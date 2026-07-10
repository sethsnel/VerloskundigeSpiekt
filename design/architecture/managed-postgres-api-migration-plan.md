# ASP.NET Core API and PostgreSQL migration plan

## 1. Decision and target architecture

### Decision

Use a standalone ASP.NET Core 10 Web API with EF Core 10 and the Npgsql PostgreSQL provider. Use Neon Launch PostgreSQL in an EU region for the initial managed database. Deploy the API as a Linux container to Azure Container Apps Consumption with scale-to-zero enabled. Keep the application in one repository, with the API in a root-level `backend/` folder alongside the existing `frontend/` folder.

Use PostgreSQL rather than SQL Server because:

- Both databases meet the expected scale, so capacity is not the differentiator.
- PostgreSQL has broad managed-provider availability and reduces provider lock-in.
- PostgreSQL provides native `jsonb`, full-text search, partial indexes, transactional DDL, and Row-Level Security, which fit editable wiki content, email templates, tenant isolation, and future billing data.
- EF Core and Npgsql give the team the same ORM and migration workflow they would have with SQL Server.
- SQL Server would be preferable only if an existing Microsoft estate, SQL Server-specific expertise, licensing agreement, or required SQL Server integration outweighed portability. None is currently present.

### Runtime data flow

```text
Next.js frontend ────────┐
Browser extension ───────┼── HTTPS/JSON ──> ASP.NET Core API ──> Managed PostgreSQL
Firebase Authentication ─┘                       │
                                                ├──> Firebase Storage (initially)
                                                └──> Azure Search (only where retained)
```

The frontend and extension must never access PostgreSQL directly. Firebase remains the identity provider during this program. The API validates Firebase ID tokens and derives the user identity from the validated token; client-supplied user IDs are never trusted.

### Proposed monorepo layout

```text
/
├── frontend/                         # Existing Next.js application
├── backend/
│   ├── VerloskundigeSpiekt.slnx
│   ├── src/
│   │   ├── VerloskundigeSpiekt.Api/  # HTTP host, auth, middleware, OpenAPI
│   │   ├── VerloskundigeSpiekt.Application/
│   │   ├── VerloskundigeSpiekt.Domain/
│   │   └── VerloskundigeSpiekt.Infrastructure/ # EF Core and external services
│   └── tests/
│       ├── VerloskundigeSpiekt.UnitTests/
│       └── VerloskundigeSpiekt.IntegrationTests/
├── tools/
│   └── migration-firestore-postgres/ # Added in the final migration phase
├── infrastructure/                   # Azure Bicep, parameters, bootstrap and runbooks
└── design/architecture/
```

Keep the separation pragmatic. Dependencies flow inward: `Api -> Application -> Domain`; `Infrastructure` implements interfaces owned by `Application`. Do not introduce generic repository abstractions over EF Core. Organize application and API code by feature, such as `Practices`, `Wiki`, `Templates`, and `Contacts`, rather than large undifferentiated folders.

### Technical runtime and deployment baseline

Use these pinned baselines when implementation starts:

| Concern | Selection |
| --- | --- |
| Backend framework | .NET 10 / ASP.NET Core 10, pinned by `backend/global.json` |
| API model | Controller-based Web API with `[ApiController]` and OpenAPI |
| ORM/provider | EF Core 10 with the matching Npgsql major |
| Database | PostgreSQL 17 initially; use the same major locally, in CI, acceptance, and production |
| API container | Official Debian-based .NET 10 SDK build image and ASP.NET Core 10 runtime image, pinned to reviewed patch versions/digests |
| Local orchestration | Docker Compose with PostgreSQL 17 and dependency health checks |
| Production API host | Azure Container Apps Consumption, EU region, `0.5 vCPU`, `1 GiB`, `minReplicas: 0`, initial `maxReplicas: 3` |
| Production database | Neon Launch in an approved EU region, `0.25 CU` minimum, initial `1–2 CU` maximum, scale-to-zero enabled |
| Azure IaC | Bicep; see `infrastructure-setup-and-rollout-plan.md` |
| Secrets | .NET Secret Manager locally; Azure Key Vault references through managed identity in hosted environments |
| CI/CD | GitHub Actions, GitHub environment approvals, Azure OIDC, immutable image digests |

The API image must be a multi-stage, non-root Linux image listening on port `8080`. TLS terminates at Azure Container Apps ingress. The runtime image contains published application output only: no SDK, source tree, tests, EF CLI, credentials, or migration tooling. It must handle `SIGTERM`, emit structured logs to stdout/stderr, and keep all durable state outside the container.

Use a separate EF Core migration bundle/container artifact and a manually triggered Azure Container Apps Job for schema deployment. The API must never apply migrations during startup. The runtime uses the Neon pooled/PgBouncer endpoint; migration bundles, `pg_dump`, restore, and data-migration tooling use the direct endpoint.

The separate infrastructure plan owns cloud provisioning, identities, Key Vault, DNS/TLS, monitoring, CI/CD deployment mechanics, cost controls, and production rollout. This application plan owns API/domain behavior and database schema contents.

## 2. Cross-cutting implementation rules

- Expose versioned routes below `/api/v1` and publish OpenAPI.
- Generate the frontend TypeScript client and DTO types from OpenAPI; do not manually duplicate API contracts.
- Keep API DTOs separate from EF entities.
- Return RFC 9457-style Problem Details for errors with stable application error codes.
- Use UTC timestamps and UUID primary keys generated by the application or database.
- Put `practice_id` directly on every practice-owned table, even when it can be inferred through another relationship.
- Use database foreign keys, unique constraints, check constraints, and transactions for invariants.
- Treat the active practice as UI preference, not as authorization context. Every tenant request identifies a practice explicitly and verifies current membership.
- Use optimistic concurrency tokens for mutable content and return `409 Conflict` for stale updates.
- Use cursor pagination for potentially growing collections.
- Do not log request bodies, template substitutions, tokens, or clipboard/client data.
- Run all schema changes through committed EF Core migrations. Production databases are never edited manually.
- Make schema changes expand-and-contract and backward-compatible with the previous API revision so Azure Container Apps revision rollback remains possible.
- Deploy images by immutable digest and keep schema deployment as a separately approved job.

## 3. Delivery phases

The executable phase-specific plans, including prerequisites, verification evidence, exit criteria, and handoff contracts, are indexed in [`managed-postgres-api-migration-phases/README.md`](managed-postgres-api-migration-phases/README.md).

### Phase 0 — Architecture baseline and delivery guardrails

Goal: agree on boundaries and make architectural decisions executable before feature work starts.

1. Record architecture decisions:
   - PostgreSQL instead of SQL Server.
   - Firebase Authentication retained initially.
   - Firebase Storage retained initially and hidden behind the API where access control is required.
   - ASP.NET Core is the only application data API.
   - Logical multi-tenancy in one shared database.
   - No Hasura or direct Supabase data API.
2. Inventory environments: local, pull-request/temporary if required, test, acceptance, and production.
3. Validate Neon Launch and its selected EU region against these acceptance criteria before contracting:
   - EU residency for primary data, replicas, logs, and backups.
   - Automated backups and point-in-time recovery.
   - Documented restore procedure and restore testing support.
   - TLS, encryption at rest, monitoring, maintenance policy, and an export/exit path.
   - Connection limits compatible with the chosen API hosting plan.
4. Adopt the decisions and ownership model in `infrastructure-setup-and-rollout-plan.md`: Azure Container Apps Consumption, Azure Key Vault, Azure Container Registry, Azure Bicep, and GitHub OIDC deployments.
5. Capture baseline production counts for Firebase users, Firestore collections/documents, nested notes, and stored files.
6. Create an endpoint/feature inventory by mapping every import from `frontend/lib/firestore/**` and `frontend/lib/firebase/**` to its future API operation.
7. Add a delivery board with one vertical slice per feature and make the exit criteria below part of the definition of done.

Exit criteria:

- Architecture decisions and provider decision are approved.
- Every current Firestore read/write has an owner and target endpoint.
- Environment, secret, backup, and recovery responsibilities are assigned.

### Phase 1 — Bootstrap the backend and CI/CD

Goal: deploy an empty but production-shaped API before adding domain behavior.

1. Pin the .NET 10 SDK in `backend/global.json` and scaffold the solution under `backend/`. Commit `Directory.Build.props`, central NuGet package management, nullable reference types, warnings-as-errors for project code, deterministic builds, and analyzers.
2. Use controller-based Web APIs with `[ApiController]`, attribute routing, and thin controllers. Keep business logic in application feature handlers/services.
3. Configure:
   - Options validation at startup.
   - Central exception handling and Problem Details.
   - OpenAPI generation.
   - Structured logging and correlation IDs.
   - HTTPS, forwarded headers, HSTS outside development, and restrictive CORS.
   - Liveness and readiness endpoints; readiness must check PostgreSQL once connected.
   - Request timeouts and conservative rate limits, with separate policies for web and extension clients if needed.
4. Add container support:
   - A multi-stage `backend/Dockerfile` using official Debian-based .NET 10 SDK/runtime images pinned to reviewed patch versions/digests.
   - Restore project files before copying the source tree so Docker dependency layers remain cacheable.
   - Publish a Release build and run it as the non-root .NET image user on port `8080`.
   - Add `.dockerignore` entries for source-control data, build output, test results, local secrets, Node modules, and editor files.
   - Add `backend/docker-compose.yml` with PostgreSQL 17, a health check, named local volume, and API dependency conditions.
   - Provide `.env.example` with configuration names only; use .NET Secret Manager or an ignored local environment file for values.
   - Do not require developers to use Neon or another cloud database locally.
5. Add CI jobs for restore, formatting, build, unit tests, integration tests, migration validation, container build, and dependency/security scanning.
6. Build the API image once per commit, scan it, produce an SBOM, push it to Azure Container Registry, and promote the same immutable digest. Build an EF Core migration bundle as a separate artifact and execute it through the protected Container Apps migration job. Schema migration execution must never occur during API startup.
7. Add a smoke test for `/health/live`, `/health/ready`, and the OpenAPI document.

Exit criteria:

- A commit can deploy the API to a non-production EU environment.
- CI builds and tests both frontend and backend.
- Configuration fails fast when required settings are missing.
- The API is observable without logging secrets or request bodies.
- The production image runs non-root, starts successfully with a read-only/ephemeral filesystem model, and shuts down gracefully on `SIGTERM`.

### Phase 2 — Establish PostgreSQL and EF Core foundations

Goal: provide a safe persistence platform and repeatable migration workflow.

1. Add EF Core 10 and the matching Npgsql major to `Infrastructure` and register a scoped `DbContext`. Pin PostgreSQL 17 until a deliberate major-version upgrade is planned.
2. Use separate database principals:
   - Deployment/migration role with DDL privileges.
   - Runtime API role with only required DML privileges and no database-owner or `BYPASSRLS` rights.
   - Read-only operational role where needed.
3. Implement naming conventions, UTC timestamp handling, UUID generation, optimistic concurrency, and database command diagnostics.
4. Create the first migration for identity and tenancy:
   - `users`
   - `practices`
   - `practice_members`
   - `practice_invitations`
   - `user_preferences`
5. Create an explicit migration workflow:
   - Generate migrations locally.
   - Review generated SQL in pull requests.
   - Apply to an ephemeral/test database in CI.
   - Test both upgrade and restoration from backup; do not assume down-migrations are the production rollback mechanism.
   - Generate and test an EF Core migration bundle for each release that changes the schema.
   - Run migrations with the direct Neon endpoint and migration role, never the pooled runtime endpoint.
6. Add PostgreSQL integration tests using an actual disposable PostgreSQL instance. Do not use EF Core's in-memory provider for database behavior.
7. Add indexes for all foreign keys and access paths, including membership lookup by user, pending invitations by normalized email, and practice-scoped slugs.
8. Configure the runtime connection deliberately:
   - Use the Neon PgBouncer transaction-pooled endpoint with TLS validation.
   - Start with Npgsql `Maximum Pool Size=10` per API replica and a short connection timeout.
   - Use bounded transient retries only for safe connection/transaction failures.
   - Verify transaction-local tenant context and RLS behavior through PgBouncer before production.

Exit criteria:

- A clean database can be created entirely from committed migrations.
- The API runtime role cannot change schema or bypass tenant controls.
- EF queries and PostgreSQL constraints are covered by integration tests.

### Phase 3 — Authentication and tenant authorization

Goal: make identity and practice isolation correct before exposing domain data.

1. Configure JWT bearer authentication for Firebase ID tokens:
   - Validate signature, issuer, audience, expiry, and project ID.
   - Map Firebase `sub`/UID to `users.external_subject`.
   - Require verified email for invitation acceptance and other email-bound operations.
2. Implement a current-user service sourced only from validated claims.
3. Provision/update the local user record on first authenticated use or through an explicit `/api/v1/me` operation.
4. Add authorization policies and handlers for:
   - Practice member.
   - Practice administrator.
   - Practice owner.
   - Global administrator, kept separate from practice roles.
5. Build a tenant request context. A route `practiceId` is input to authorization, never proof of authorization.
6. Enable PostgreSQL Row-Level Security for tenant tables as defense in depth:
   - Set the authenticated external subject as transaction-local database context.
   - Write policies that resolve membership through `practice_members`.
   - Require tenant operations to run inside the unit-of-work transaction that sets this context.
   - Give maintenance/migration jobs a separate, explicit execution path.
7. Add integration tests covering anonymous access, expired/invalid tokens, member/admin/owner permissions, removed members, and attempted cross-practice reads and writes.
8. Configure CORS allowlists for deployed frontend origins and known browser-extension origins. Never use wildcard origins with credentials.

Exit criteria:

- Cross-tenant tests fail closed at both API and database layers.
- No endpoint accepts a user ID as a substitute for authenticated identity.
- Removing membership immediately prevents subsequent tenant access.

### Phase 4 — Implement practice administration as the first vertical slice

Goal: replace the complete `origin/preview` practice-management workflow behind the API.

Implement these API capabilities:

1. Current user:
   - `GET /api/v1/me`
   - `GET/PUT /api/v1/me/preferences/active-practice`
2. Practices:
   - List only practices for the current user.
   - Create and update a practice.
   - Read a practice by ID after membership authorization.
3. Membership:
   - List members.
   - Change member role.
   - Remove a member.
   - Transfer ownership.
4. Invitations:
   - List the current user's pending invitations by verified normalized email.
   - Create, accept, decline, and revoke invitations.
   - Enforce one pending invitation per practice/email with a partial unique index.
5. Make practice creation atomic: practice, owner membership, and active-practice preference commit in one transaction.
6. Make invite acceptance atomic and verify that the token identity matches the invited email.
7. Make ownership transfer atomic and prevent removal/demotion of the only owner.
8. Add idempotent behavior where browser retries are plausible, particularly invite responses and practice creation.
9. Add endpoint, domain, database-constraint, and authorization tests for every workflow.

Exit criteria:

- The API never scans all practices to determine a user's memberships.
- All multi-record workflows are transactional.
- The practice administration UI can operate against an API-backed local database using fixtures.

### Phase 5 — Model and implement private wiki, templates, contacts, and shared content

Goal: replace Firestore document access with relational models without losing flexible editor content.

1. Private wiki:
   - Add `practice_pages`, `practice_page_sections`, and `practice_page_versions`.
   - Store stable/queryable metadata in columns and Slate/editor documents in `jsonb`.
   - Store extracted plain text for search and indexing.
   - Use a unique `(practice_id, slug)` constraint.
   - Replace the current read-that-creates behavior with an explicit idempotent create/seed operation.
2. Email templates:
   - Add `email_templates`, `email_template_versions`, and `email_template_keys`.
   - Separate draft and published versions.
   - Validate template keys against an allowlist/schema.
   - Return template definitions only; rendering with external client data occurs locally in the extension.
   - Never accept or persist resolved patient/client values.
3. Contacts:
   - Add practice-scoped contacts with normalized email/telephone fields and extensible `jsonb` metadata only where justified.
   - Add cursor pagination and indexed name/search fields.
4. Shared/global articles:
   - Add `articles`, `article_sections`.
   - Replace the denormalized menu document with an ordered query or explicit navigation table.
5. Search:
   - Start with PostgreSQL full-text search for the expected scale unless an Azure Search-only requirement remains.
   - If Azure Search is retained, include `practice_id` and visibility metadata in every private index record and enforce tenant filtering in the server API.
   - Do not permit frontend code to call search infrastructure directly.
6. Files:
   - Keep Firebase Storage initially but issue authorized upload/download operations through API endpoints or short-lived signed URLs.
   - Store practice ownership and file metadata in PostgreSQL.
7. Add optimistic concurrency to wiki pages and templates and tests for simultaneous edits.

Exit criteria:

- All current global article and preview private-wiki behavior has an API equivalent.
- Tenant-private search results cannot cross practice boundaries.
- Template APIs cannot receive resolved external client values.

### Phase 6 — Add the API client and migrate frontend data access incrementally

Goal: replace React Query -> Firestore with React Query -> generated API client while preserving UI behavior.

1. Generate a TypeScript client from the backend OpenAPI contract and commit or reproducibly generate it according to the team's build policy.
2. Add a single frontend API transport that handles:
   - API base URL.
   - Firebase ID-token acquisition and refresh.
   - `Authorization: Bearer` header.
   - Correlation ID propagation.
   - Problem Details mapping.
   - Abort signals/timeouts.
3. Define React Query key factories that always include the authenticated user and `practiceId` where relevant.
4. Migrate feature by feature in this order:
   - Current user and active-practice preference.
   - Practices.
   - Invitations and members.
   - Private wiki.
   - Email templates.
   - Contacts.
   - Global articles/navigation.
   - Search and file metadata.
5. For each feature:
   - Replace direct Firestore imports with the generated client.
   - Preserve loading/error/mutation states.
   - Invalidate or update only the affected tenant-scoped cache keys.
   - Add frontend component tests and an end-to-end happy path.
   - Remove the obsolete Firestore module only after no imports remain.
6. Prevent stale tenant data in memory when the active practice changes: cancel outstanding requests and remove tenant-specific cached queries.
7. Add a temporary configuration flag selecting Firestore or API per feature only during development and acceptance. Do not implement long-lived dual writes.

Exit criteria:

- `frontend/` contains no domain data reads or writes to Firestore.
- React Query communicates only with the ASP.NET Core API for application data.
- Switching practice cannot display cached data from the previous practice.

### Phase 7 — Adapt the browser extension to the stable API

Goal: expose the minimum safe contract required for template use.

1. Implement extension authentication using Firebase and bearer tokens accepted by the same API.
2. Add narrowly scoped API operations for listing published templates and retrieving one published version.
3. Restrict extension CORS origins and apply appropriate rate limits.
4. Render template substitutions entirely inside the extension process.
5. Add safeguards that prevent resolved values from entering telemetry, crash reports, network payloads, persistent extension storage, or browser logs.
6. Add automated tests using synthetic external-system data and verify through network inspection that only template definitions leave the extension.
7. Document required browser permissions and apply least privilege to host and clipboard access.

Exit criteria:

- No patient-identifiable values reach VerloskundigeSpiekt infrastructure.
- The extension consumes only published, authorized practice templates.
- Authentication and revoked/removed practice membership failures are handled safely.

### Phase 8 — Production hardening and migration rehearsal

Goal: prove the new stack is operable before moving production data.

1. Add dashboards and alerts for API error rate, latency, authentication failures, database connections, slow queries, storage, and backup status.
2. Define service-level objectives appropriate to the product stage.
3. Load-test representative wiki reads, template listing, practice switching, and concurrent edits at multiples of the three-year target.
4. Run dependency failure tests for database unavailability, exhausted connections, expired Firebase keys/tokens, and search/storage outages.
5. Verify backup restoration into an isolated environment and record measured RPO/RTO.
6. Run security review and automated checks for broken object-level authorization, mass assignment, excessive data exposure, CORS, rate limiting, container/image security, and secret handling.
7. Complete operational runbooks for deployment, schema migration failure, rollback, credential rotation, tenant export/deletion, and incident response.
8. Run a full migration rehearsal from a sanitized Firestore export and compare the resulting application behavior with preview.
9. Exercise the infrastructure plan's operational paths: cold start with both Container Apps and Neon suspended, Container App revision rollback, EF migration job failure, database credential rotation, and point-in-time restore to an isolated target.

Exit criteria:

- Restore, rollback, and incident procedures have been exercised rather than only documented.
- Performance is comfortably inside targets with no cross-tenant data exposure.
- Product owners approve the migrated behavior using rehearsal data.

### Phase 9 — Build and execute data migration scripts and cut over

Goal: migrate the data model active in `origin/preview`, switch production to PostgreSQL, and retain a controlled rollback path. This is the final phase; do not begin production cutover until all preceding exit criteria pass.

1. Create `tools/migration-firestore-postgres/` with versioned, repeatable commands:
   - `export`: read Firebase Auth metadata and all required Firestore collections/subcollections using server credentials.
   - `transform`: convert Firestore snapshots into a provider-neutral intermediate manifest.
   - `validate-source`: identify missing references, malformed records, oversized editor documents, duplicate emails/slugs, and unsupported legacy shapes.
   - `import`: write PostgreSQL rows transactionally in dependency order.
   - `validate-target`: compare counts, stable identifiers, checksums, relationships, memberships, and representative rendered documents.
   - `rebuild-search`: rebuild PostgreSQL full-text vectors or the external search index from PostgreSQL.
   - `report`: produce a machine-readable and human-readable migration report without sensitive content.
2. Make every command idempotent and resumable. Record migration run ID, source export timestamp, source document ID, target ID, status, and error details.
3. Cover the preview data model explicitly:
   - Firebase users -> `users.external_subject` and profile fields.
   - `practices/{id}` -> `practices`.
   - `practices/{id}/members/{userId}` -> `practice_members`.
   - `practices/{id}/invites/{inviteId}` -> `practice_invitations`.
   - `userState/{userId}` -> `user_preferences`.
   - `practices/{id}/articles/{slug}` -> `practice_pages` plus page sections/versions.
   - Nested article `notes` maps -> ordered section/note rows with editor JSON and extracted text.
   - Global `articles` and nested notes -> `articles` and `article_sections`.
   - `menu/articles` -> derived ordering/navigation rows only if ordering cannot be reconstructed.
   - File objects -> keep in Firebase Storage initially; migrate only ownership/metadata references.
   - Legacy `topics`/`sub-topics` -> migrate only if the production inventory proves they remain authoritative.
4. Preserve Firestore IDs as migration aliases even if PostgreSQL uses UUID primary keys. This supports traceability, idempotency, and rollback diagnostics.
5. Perform at least two rehearsals from production-like exports and have a second engineer review validation reports.
6. Prepare the production cutover:
   - Announce a short maintenance window.
   - Deploy frontend/API versions capable of maintenance/read-only mode.
   - Take a PostgreSQL backup and record the deployed versions.
   - Disable Firestore writes.
   - Capture the final export and its checksum.
   - Run the protected EF migration job through the direct Neon connection.
   - Run transform, source validation, import, target validation, and search rebuild through direct database connections.
   - Execute API smoke tests and critical user journeys.
7. Enable the API-backed application. Keep Firestore read-only for a defined rollback period; do not dual-write.
8. Define rollback as switching the frontend back to the prior version and re-enabling Firestore writes only if no PostgreSQL-only production writes must be preserved. Once PostgreSQL accepts writes, rollback requires an explicit reverse-data decision rather than a configuration toggle.
9. After the observation period:
   - Take and verify a final archival Firestore export.
   - Remove feature flags and all Firestore domain dependencies from the frontend.
   - Revoke migration credentials.
   - Keep retention/deletion dates for exports and the old database documented.

Exit criteria:

- Source and target validation reports reconcile or contain approved, documented exceptions.
- All production application data flows through the ASP.NET Core API to PostgreSQL.
- Firestore is read-only, archived, and scheduled for decommissioning.
- Migration credentials are revoked and the cutover/rollback record is retained.

## 4. Suggested engineering workstream order

Work may run in parallel after the foundations are stable:

1. Platform team: Phases 0–3.
2. Practice vertical-slice team: Phase 4.
3. Content/template team: Phase 5.
4. Frontend team: Phase 6, starting after each corresponding API contract is accepted.
5. Extension team: Phase 7 after the template contract stabilizes.
6. Platform/security team: Phase 8.
7. A single coordinated team owns Phase 9 cutover.

Avoid parallel edits to the database model without one migration owner coordinating ordering and deployment. API contract changes should be backward-compatible while frontend and extension consumers are migrating.

## 5. Program-level completion criteria

The migration program is complete when:

- The browser and extension use documented API contracts only.
- No application-domain Firestore SDK imports remain in `frontend/`.
- PostgreSQL migrations can reproduce every environment.
- Tenant isolation has automated negative tests at API and database boundaries.
- Multi-record workflows use transactions and database constraints.
- Backups and restoration have been tested.
- The final migration is reconciled and Firestore has a dated decommission plan.
- Patient/client data used by the extension remains local and never enters API requests, logs, analytics, search, or PostgreSQL.

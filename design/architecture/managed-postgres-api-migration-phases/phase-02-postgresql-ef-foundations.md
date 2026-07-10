# Phase 2 — Establish PostgreSQL and EF Core foundations

## Goal

Provide a reproducible, least-privilege PostgreSQL persistence layer and a reviewed schema-delivery workflow suitable for tenant-aware domain work.

## Inputs from Phase 1

- Deployable backend solution and Infrastructure project.
- PostgreSQL 17 Compose service and disposable integration-test path.
- Separate runtime and migration artifact/configuration paths.

## Implementation actions

1. Add EF Core 10 and matching Npgsql packages. Register a scoped application `DbContext`; define naming conventions, UTC conversion/validation, UUID strategy, concurrency tokens, and safe command diagnostics.
2. Provision separate migration, runtime, and optional read-only roles. Grant DDL only to migration, minimum DML to runtime, and neither ownership nor `BYPASSRLS` to runtime.
3. Model `users`, `practices`, `practice_members`, `practice_invitations`, and `user_preferences`, with explicit keys, foreign keys, checks, normalized fields, timestamps, and `practice_id` on practice-owned rows.
4. Add indexes for every foreign key and planned access path: membership by user/practice, normalized pending-invitation email, and practice-scoped identifiers/slugs. Use a partial unique index where pending-state semantics require it.
5. Commit the initial EF migration and reviewed SQL. Document generation, review, ephemeral CI application, migration-bundle creation, protected execution, and restore-based rollback. Never depend on production down-migrations.
6. Run migration bundles with the direct Neon endpoint and migration role. Configure the API for the TLS-validated transaction-pooled endpoint, an initial maximum pool size of 10 per replica, short connection timeout, and bounded retries only around safe transient failures.
7. Add real PostgreSQL integration tests for mappings, constraints, transactions, concurrency, role grants, clean-database creation, and upgrade paths. Do not use EF's in-memory provider for database behavior.
8. Spike transaction-local tenant context through PgBouncer transaction pooling and document the exact transaction/unit-of-work pattern required by Phase 3 RLS.
9. Add PostgreSQL to readiness without exposing connection details in health responses.

## Deliverables

- Initial tenancy schema and committed migration.
- Role/grant definitions and connection configuration.
- Repeatable migration bundle workflow and SQL review evidence.
- PostgreSQL integration tests and pooled-connection/RLS spike result.

## Verification and evidence

- Create a blank database solely from committed migrations and run the test suite.
- Prove the runtime role cannot create/alter schema, assume ownership, or bypass tenant controls.
- Apply the bundle to an ephemeral database and validate an upgrade plus restore rehearsal.
- Inspect indexes with representative queries and verify constraint failures are mapped safely.
- Confirm transaction-local context never leaks between pooled connections.

## End state and exit criteria

- Committed migrations reproduce a clean database.
- Runtime credentials have only required DML privileges and cannot bypass isolation.
- Mappings, PostgreSQL constraints, transactions, and migrations have integration coverage.
- The tenant-context pattern is proven compatible with the production pooling mode.

## Handoff to Phase 3

Phase 3 receives identity/tenancy tables, restricted roles, transaction and concurrency patterns, and a verified mechanism for setting transaction-local authenticated context before any tenant query executes.


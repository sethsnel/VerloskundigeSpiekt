# Managed PostgreSQL API migration: phase plans

This directory turns the program-level [migration plan](../managed-postgres-api-migration-plan.md) into executable, phase-specific plans. The program plan remains the source of truth for architectural decisions and cross-cutting rules; these files define the work and handoff contract for each phase.

## How to use these plans

- Complete a phase's prerequisites before starting its implementation work.
- Treat its exit criteria as release gates, not aspirations.
- Record evidence for each verification item in the delivery board or the relevant pull request.
- Do not start the next phase until its required inputs are present in the preceding phase's end state.
- Phase 6 may start feature-by-feature after the matching Phase 4 or Phase 5 API contract is accepted. Phase 7 waits for the published-template contract. This controlled overlap does not waive any exit criteria.
- Coordinate all EF Core migration ordering through one migration owner.

## Phase sequence

| Phase | Plan | Required handoff |
| --- | --- | --- |
| 0 | [Architecture baseline and delivery guardrails](phase-00-architecture-baseline.md) | Approved decisions, inventories, ownership, and delivery gates |
| 1 | [Backend and CI/CD bootstrap](phase-01-backend-and-ci-bootstrap.md) | Deployable, production-shaped empty API and validated pipeline |
| 2 | [PostgreSQL and EF Core foundations](phase-02-postgresql-ef-foundations.md) | Reproducible schema, restricted roles, and tested persistence |
| 3 | [Authentication and tenant authorization](phase-03-authentication-tenant-authorization.md) | Firebase identity and fail-closed tenant isolation |
| 4 | [Practice administration vertical slice](phase-04-practice-administration.md) | Complete API-backed practice-management workflow |
| 5 | [Content domains](phase-05-content-domains.md) | API contracts for wiki, templates, contacts, articles, search, and files |
| 6 | [Frontend API migration](phase-06-frontend-api-migration.md) | Frontend uses only the generated API client for domain data |
| 7 | [Browser extension API migration](phase-07-browser-extension-api.md) | Extension safely consumes published templates through the API |
| 8 | [Production hardening and rehearsal](phase-08-production-hardening.md) | Operational, security, performance, restore, and rehearsal approval |
| 9 | [Data migration and production cutover](phase-09-data-migration-cutover.md) | Reconciled production cutover and Firestore decommission path |

## Rules that apply to every phase

All phases inherit the cross-cutting rules in the master plan: versioned `/api/v1` routes, OpenAPI-generated clients, separate DTOs and entities, Problem Details with stable codes, UTC/UUID conventions, explicit `practice_id`, database-enforced invariants, optimistic concurrency, cursor pagination, safe logging, committed migrations, expand-and-contract schema changes, immutable images, and separately approved schema deployment.

## Execution tracks for pending gates

Use the [local and remote execution tracks](execution-plans.md) when a phase is implemented but its environment-dependent evidence is still pending. Complete the [local-development execution plan](local-development-execution-plan.md) before the matching [remote-infrastructure execution plan](remote-infrastructure-execution-plan.md). Local completion proves behavior with synthetic data; it does not prove provider, cloud, production, or cutover gates.

# Phase 1 — Bootstrap the backend and CI/CD

## Goal

Deliver an empty but production-shaped ASP.NET Core API that can be built, tested, scanned, deployed, observed, and rolled back before domain behavior is added.

## Inputs from Phase 0

- Approved architecture/provider decisions and environment matrix.
- Named infrastructure, secret, deployment, and recovery owners.
- Delivery gates and configuration-name inventory.

## Implementation actions

1. Scaffold `backend/` with the solution and Api, Application, Domain, Infrastructure, UnitTests, and IntegrationTests projects. Pin .NET 10 with `global.json`; enable central package management, nullable references, deterministic builds, analyzers, and warnings-as-errors for project code.
2. Enforce inward dependencies: Api uses Application, Application owns interfaces and uses Domain, and Infrastructure implements Application interfaces. Organize code by feature and keep controllers thin.
3. Configure startup-validated options, centralized exception handling, RFC 9457-style Problem Details and stable error codes, OpenAPI, structured logging, correlation IDs, forwarded headers, production HSTS, restrictive CORS, timeouts, and conservative rate limits.
4. Expose liveness, readiness, and OpenAPI endpoints. Keep readiness extensible for the Phase 2 PostgreSQL check.
5. Add a multi-stage, non-root Linux `backend/Dockerfile` on reviewed .NET 10 SDK/runtime images. Publish Release output only, listen on `8080`, support a read-only/ephemeral filesystem, and handle `SIGTERM` gracefully. Add a suitable `.dockerignore`.
6. Add local Docker Compose with PostgreSQL 17, health checks, a named volume, API dependency conditions, and an `.env.example` containing names but no values. Document Secret Manager/ignored-local-file use.
7. Implement CI for restore, formatting, build, unit/integration tests, migration validation placeholder, container build, dependency/security scans, SBOM, and frontend checks.
8. Build the API image once per commit, push to ACR, and promote the same immutable digest. Establish a distinct EF migration bundle artifact and protected Container Apps migration job path; the API startup path must never migrate schemas.
9. Add smoke tests for liveness, readiness, and OpenAPI in CI and a deployed non-production EU environment.

## Deliverables

- Compilable backend solution and tests.
- Production-shaped container and local Compose workflow.
- CI/CD workflow, immutable artifact promotion, SBOM, and scan output.
- Validated configuration and safe observability baseline.

## Verification and evidence

- Run frontend and backend CI from a clean checkout.
- Start Compose and execute endpoint smoke tests.
- Run the container as non-root and verify port `8080`, no embedded source/secrets/tooling, graceful termination, and operation with ephemeral writable paths only.
- Remove a required setting and confirm startup fails with a useful, non-secret error.
- Deploy the exact scanned digest to non-production and confirm logs correlate requests without bodies or tokens.

## End state and exit criteria

- Any commit can deploy the API to a non-production EU environment.
- CI builds and tests both applications and produces reviewed artifacts.
- Required configuration fails fast; logs and health signals are safe and useful.
- The runtime image is non-root, production-minimal, and gracefully terminable.

## Handoff to Phase 2

Phase 2 receives deployable Api/Infrastructure seams, PostgreSQL 17 local orchestration, integration-test infrastructure, protected migration-artifact plumbing, and configuration hooks for direct migration and pooled runtime connections.


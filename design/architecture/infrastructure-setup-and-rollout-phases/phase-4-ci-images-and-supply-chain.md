# Phase 4 — Establish CI, images, and supply-chain controls

## Goal

Produce immutable, tested, scanned, and traceable API and database-migration artifacts, then enforce promotion rules that prevent failed or vulnerable artifacts from reaching acceptance or production.

## Starting contract from Phase 3

- GitHub-to-Azure OIDC and protected environments are operational.
- ACR exists with admin credentials disabled.
- Acceptance PostgreSQL supports integration and migration tests.
- Runtime uses the pooled connection path; migration tooling uses the direct path.
- Key Vault and database privileges are isolated by workload and environment.
- The application workstream has delivered a buildable ASP.NET Core solution, PostgreSQL integration tests, an OpenAPI contract, and EF Core migrations. Infrastructure Phase 4 should be coordinated with application Phases 1–3 in the [managed PostgreSQL API migration plan](../managed-postgres-api-migration-plan.md).

## Actions

### 1. Implement backend CI gates

In `.github/workflows/backend-ci.yml`, run for every relevant change:

1. restore using the pinned .NET SDK;
2. formatting/style validation;
3. build with warnings policy;
4. unit tests;
5. PostgreSQL integration tests against a fresh disposable PostgreSQL 17 container;
6. authentication, RLS/tenant-isolation, and health-endpoint tests where available;
7. OpenAPI compatibility checks against the accepted contract;
8. API container build;
9. vulnerability scan; and
10. SBOM and provenance generation.

Do not use EF's in-memory provider as the database compatibility gate. Keep CI secrets out of pull-request workflows from untrusted forks.

### 2. Harden and build the API image once

- Use a multi-stage build based on reviewed, digest-pinned official .NET 10 SDK and Debian-based ASP.NET Core runtime images.
- Publish only runtime output; exclude source, tests, SDK, EF tooling, credentials, and migration connection details.
- Run as the official non-root user, listen on `8080`, emit structured JSON to stdout/stderr, and support graceful `SIGTERM` shutdown.
- Use a read-only root filesystem where supported and bound `/tmp` usage.
- Build once per commit, tag with the full Git SHA, push through GitHub OIDC, and resolve/store the immutable ACR digest.

### 3. Create a distinct migration artifact

- Build an EF Core migration bundle or dedicated migration image separately from the API image.
- Include only the migration tooling and schema changes needed for the release.
- Require the direct migration connection at job execution time through the migration identity; do not bake it into the artifact.
- Ensure API startup never invokes schema migration.

### 4. Add supply-chain evidence and policy

- Generate an SBOM for each API and migration artifact.
- Sign images and retain build provenance using supported GitHub/Azure tooling.
- Record source commit, workflow run, test results, base-image digests, artifact digest, scan result, SBOM, signature, and provenance as one promotion record.
- Define severity and exception policy. A failed test, missing evidence, invalid signature, or vulnerability above the approved threshold blocks promotion unless a time-bounded, reviewed exception is recorded.

### 5. Implement deploy and migration workflows

- `backend-deploy.yml` accepts an existing digest, verifies promotion evidence, updates a Container App revision, and never rebuilds the image.
- `database-migrate.yml` accepts the matching migration artifact, uses the manual migration job, and requires protected approval in production.
- Acceptance deployment follows successful CI automatically after the main-branch build; production requires human approval.
- Workflows retain the previous revision/digest and expose the documented rollback command.

### 6. Configure dependency automation

Cover .NET SDK/runtime patches, NuGet dependencies, official base-image digests, AVM versions, direct Bicep API versions, and GitHub Actions pinned to commit SHAs. AVM changes use dedicated pull requests with changelog review, Bicep validation, and `what-if`; automation must not merge infrastructure upgrades solely because they are newer.

## Validation and evidence

- A representative commit can be traced from source through tests, scan, SBOM, signature/provenance, ACR digest, and acceptance revision.
- Rebuilding is not part of acceptance-to-production promotion.
- Failed tests, disallowed vulnerabilities, unsigned images, and digest mismatches demonstrably block deployment.
- The API image runs non-root, contains no SDK/migration bundle/secrets, and starts on port `8080`.
- The migration artifact can run through the job with direct access while the API has only pooled runtime access.

## End-state and handoff to Phase 5

Phase 4 is complete when a release produces immutable API and migration artifacts with enforceable evidence, and only verified digests can deploy. Phase 5 receives:

- a deployable acceptance API digest and matching migration artifact;
- automated digest-based deployment and protected migration workflows;
- a stable Container Apps ingress target for domain binding; and
- traceability sufficient to identify exactly which artifact a public endpoint serves.

Phase 5 changes endpoint and client configuration only; it must not weaken artifact verification or introduce secrets into client settings.

# Phase 3 — Provision Neon and database access

## Goal

Create isolated acceptance and production PostgreSQL services in the approved EU region, enforce separate migration and runtime privileges, and deliver connection details to Azure through Key Vault without exposing credentials in source or logs.

## Starting contract from Phase 2

- Acceptance and production Azure foundations, Key Vaults, Container Apps identities, placeholder API, and migration job exist.
- Runtime identities can access only their environment's runtime secret slot; migration identities can access only their migration secret slot.
- Neon account, region, ownership, DPA, and production/non-production separation were approved in Phase 0.

## Actions

### 1. Create isolated Neon projects

- Create separate acceptance and production projects; do not model production as a branch under non-production ownership or credentials.
- Select the approved EU location, initially an Azure-hosted Frankfurt region when available and acceptable.
- Select PostgreSQL 17 when supported and ensure both environments use the same major version.
- Record project ID, region, PostgreSQL major, endpoint hostnames, and ownership in the environment inventory. Treat credentials as secrets and exclude them.

### 2. Configure capacity and recovery

- Start with 0.25 CU minimum, 1–2 CU maximum, scale-to-zero after five idle minutes, and a seven-day restore window where the selected plan supports them.
- Confirm where backups and restore data reside.
- Record settings and their human operator/reviewer in `infrastructure/HUMAN_CONFIGURATION.md`.
- Document the process for changing CU bounds and restore settings; no scaling change should be an untracked console delta.

### 3. Create database roles

- Create a migration-owner role that can apply the approved schema changes through the direct endpoint.
- Create a restricted runtime login that can use only required schemas, tables, sequences, and functions.
- Ensure the runtime role cannot create or alter schema objects, grant privileges, assume the migration owner, or bypass Row-Level Security.
- Apply default privileges so new migration-created objects receive the intended runtime access without broad ownership.

### 4. Build the secret-bootstrap script

Implement `infrastructure/scripts/configure-neon-secret.ps1` with explicit environment, vault, pooled/direct endpoint, and secret-name parameters. It must:

- accept secret values securely and non-interactively where used in automation;
- write the pooled restricted-runtime connection to `postgres-runtime-connection`;
- write the direct migration-owner connection to `postgres-migration-connection`;
- verify secret presence/version without printing values; and
- refuse cross-environment vault/project combinations when they can be detected.

Use an approved workstation or protected workflow, record operator/reviewer and secret version IDs, and never store connection strings in shell history, Bicep parameters, GitHub variables, or artifacts.

### 5. Connect Azure workloads

- Bind the API placeholder's secret reference to the runtime vault secret through the runtime identity.
- Bind the migration job only to the migration vault secret through the migration identity.
- Configure the API to use the Neon pooled endpoint and the migration job/tooling to use the direct endpoint.
- Start Npgsql with maximum pool size 10 per API replica, a short connection timeout, TCP keepalive, and bounded transient retries. Application transaction retry behavior remains an application concern.

### 6. Validate permissions and connectivity in acceptance

From the acceptance Container Apps environment:

- connect through the pooled endpoint as runtime and execute permitted read/write operations;
- connect through the direct endpoint as migration owner and apply a harmless validation migration or migration-bundle check;
- prove the runtime user cannot create/drop/alter schema objects, change roles, or bypass RLS;
- prove runtime and migration managed identities cannot resolve each other's secrets; and
- validate transaction-local tenant context and RLS behavior through PgBouncer transaction mode.

Do not perform production schema migration yet; restrict production testing to an approved connectivity/permission check that creates no application data.

## Validation and evidence

- Non-secret Neon inventory and human-configuration entries are complete.
- Acceptance pooled and direct connection tests pass from Container Apps.
- Negative database privilege and Key Vault access tests fail as expected.
- PostgreSQL major, autoscaling, scale-to-zero, and restore settings match between documented intent and actual configuration.
- No secret appears in Git history, workflow logs, artifacts, Container App plain environment variables, or inventory files.

## End-state and handoff to Phase 4

Phase 3 is complete when both Neon projects exist with approved settings, secrets are held only in their environment vaults, identities and database roles are separated, and acceptance connectivity/RLS tests pass. Phase 4 receives:

- a usable acceptance PostgreSQL target for integration and deployment validation;
- confirmed pooled runtime and direct migration connection paths;
- least-privilege runtime and migration identities; and
- documented, repeatable secret-bootstrap and rotation procedures.

Phase 4 artifacts must preserve this separation: the API image must not contain migration tooling or secrets, and the migration artifact must use the direct connection only at runtime.


# Phase 7 — Production foundation rollout

## Goal

Create and validate the production platform, database, endpoint, empty schema, monitoring, and rollback controls before any application data or user traffic is moved.

## Starting contract from Phase 6

- Acceptance has approved production-candidate settings and demonstrated rollback, restore, rotation, and alerting.
- The exact compiled ARM artifact, API digest, and migration artifact are approved and traceable.
- Production deployment and migration workflows require protected GitHub approval.
- Named go/no-go approvers and residual risks are recorded.

## Actions

### 1. Apply the production Azure foundation

- Obtain production infrastructure approval and deploy the exact compiled ARM JSON artifact validated through acceptance.
- Confirm names, approved EU locations, tags, identity scopes, Key Vault protections, ACR access, observability, budgets, alert action groups, and production replica/CU bounds.
- Review `what-if` immediately before apply and stop for unexpected destructive or cross-scope changes.
- Record deployment artifact checksum, workflow run, approver, deployment outputs, and post-deployment validation.

### 2. Provision and connect production Neon

- Execute the Phase 3 Neon checklist for the separate production project in the approved EU region and matching PostgreSQL major.
- Create production migration-owner and restricted runtime roles.
- Write pooled runtime and direct migration connections to the production vault using the approved script and operators.
- Run negative Key Vault and database privilege checks. Do not copy acceptance data or credentials.
- Record non-secret settings and human configuration, including restore and autoscaling values.

### 3. Configure production DNS, TLS, Firebase, and CORS

- Execute the Phase 5 production hostname and certificate procedure.
- Configure only production frontend and extension origins in production CORS/Firebase settings.
- Verify HTTPS, certificate monitoring, client environment isolation, and rollback without advertising or switching the production frontend to the new API.

### 4. Deploy at no user traffic

- Deploy the approved API digest as a production Container App revision without moving application traffic to it.
- Access the revision through the safest supported test path, such as revision URL/label with appropriate protection.
- Confirm the revision uses the production runtime identity and vault secret and has no migration permissions.

### 5. Initialize the empty database

- Run the approved initial migration artifact through the production migration job and direct endpoint after protected approval.
- Verify migration history, schema ownership, grants/default privileges, RLS policies, and absence of application data.
- Do not run destructive/down migrations or Firestore import in this phase.

### 6. Validate production operations

- Run synthetic smoke, authentication metadata, health, permission, and empty-state tests that do not create real user data.
- Verify logs, metrics, alert delivery, dashboards, budgets, connection behavior, revision identification, and artifact traceability.
- Confirm rollback target/digest, secret-rotation path, Neon restore procedure, incident contacts, and cutover permissions.
- Reconcile actual configuration with Bicep and `infrastructure/HUMAN_CONFIGURATION.md`; remove or document every portal delta.

### 7. Stabilize protection

After configuration is verified, add the planned production resource locks, including Key Vault deletion protection, without blocking the documented deployment and rotation workflows. Capture exceptions and lock removal/reapplication steps for recovery.

## Validation and evidence

- Production deployment uses the acceptance-validated compiled ARM artifact and approved application digests.
- Production Neon is isolated, empty except for schema/control data, and uses restricted roles/secrets.
- API revision, HTTPS, health, observability, budgets, and alerts work without receiving user traffic.
- Resource inventory reconciles with Bicep and the human-configuration register; there is no undocumented portal delta.
- Locks and protection controls are present and operational procedures still work.
- The cutover checklist identifies decision makers, observation period, rollback thresholds, and exact rollback artifacts.

## End-state and handoff to Phase 8

Phase 7 is complete when production infrastructure and empty schema are ready and observable before data cutover, with no user traffic moved and no undocumented configuration. Phase 8 receives:

- a validated no-traffic API revision and production PostgreSQL schema;
- approved migration/import/search-rebuild tooling and protected workflows;
- live monitoring, alerts, dashboards, DNS/TLS, and incident response;
- retained prior-path and revision rollback artifacts; and
- a signed cutover runbook with owners, thresholds, timings, approvals, and stop/rollback conditions.

Do not begin Phase 8 without a cutover approval and a verified Firestore rollback/read-only path.


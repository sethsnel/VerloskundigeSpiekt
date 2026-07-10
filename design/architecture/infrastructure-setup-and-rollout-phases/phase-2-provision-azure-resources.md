# Phase 2 — Provision shared and environment Azure resources

## Goal

Implement a reproducible Bicep solution for the shared Azure platform and isolated acceptance and production environments, using pinned Azure Verified Resource Modules (AVM) by default.

## Starting contract from Phase 1

- GitHub OIDC validation and environment apply identities work at their approved scopes.
- Production deployment is protected by GitHub environment approval.
- Subscription, tenant, region, naming, tags, and ownership inputs are recorded.
- No workflow depends on a stored Azure client secret.

## Actions

### 1. Create the infrastructure solution structure

Create the `infrastructure/` layout specified by the master plan: `main.bicep`, `bicepconfig.json`, environment parameter files, local composition modules, bootstrap assets, scripts, and infrastructure workflows. Parameter files may contain identifiers and configuration but never secret values.

Configure Bicep linting and set `use-recent-module-versions` to warning. Pin every AVM registry reference to an exact reviewed version. Add a documented exception-register entry and an inline reason for each direct resource declaration.

### 2. Compose shared resources

- Provision the shared or designated ACR through AVM, with admin credentials disabled and retention that preserves promoted rollback digests.
- Apply required resource tags: `application`, `environment`, `owner`, `costCenter`, `managedBy=bicep`, and `dataClassification`.
- Use a meaningful `container-registry.bicep` composition boundary rather than local wrappers that merely mirror AVM.

### 3. Compose each environment

For acceptance and production, provision or compose:

- the resource group at subscription scope;
- Container Apps managed environment;
- runtime and migration user-assigned identities;
- Key Vault with RBAC, soft delete, and production-ready purge-protection settings;
- Log Analytics and Application Insights with intentional sampling and retention;
- an externally accessible API Container App placeholder configured for port `8080`, health paths, replica limits, and multiple-revision rollout;
- a manual-trigger Container Apps migration job with its separate identity;
- ACR pull permission for the runtime identities and correctly scoped Key Vault permissions;
- action group, budget thresholds, and cost/availability alerts.

Create secret references and names, but do not create secret values. Keep runtime and migration secret access separate.

### 4. Implement validation and promotion workflows

- On pull requests, run `bicep restore`, lint, build, and Azure `what-if`.
- Reject floating AVM versions, unapproved/non-EU locations, secret-like parameter values, enabled ACR admin credentials, and replica settings outside approved bounds.
- Retain compiled ARM JSON and `what-if` results as immutable workflow artifacts.
- Deploy the exact compiled artifact validated in acceptance to production; do not rebuild it or re-resolve AVM modules during promotion.

### 5. Add operational scripts and documentation

Add `validate-environment.ps1`, `smoke-test.ps1`, and `rollback-revision.ps1` contracts, even if application-specific probes are completed later. Scripts must accept explicit parameters, fail on errors, and avoid printing secrets. Document deployment, teardown/recreate, drift review, AVM upgrade, exception review, and rollback procedures in `infrastructure/README.md`.

### 6. Reproduction test

Deploy acceptance from a clean or intentionally emptied acceptance scope using only the documented bootstrap and generated artifacts. Compare actual resources and role assignments to outputs, run validation, delete/recreate where approved, and confirm that no portal-only knowledge is required. Do not delete production for this test.

## Validation and evidence

- Bicep restore, lint, build, policy checks, and `what-if` pass.
- The compiled ARM artifact is retained and its checksum is recorded through promotion.
- Acceptance recreate succeeds from source and documented non-secret inputs.
- ACR admin credentials are disabled; identities, vault access, and scopes are separated.
- Placeholder app and migration job exist without embedded connection strings.
- Every AVM dependency is pinned and every direct resource has a reviewed exception.
- Budget and alert test notifications reach the named contacts.

## End-state and handoff to Phase 3

Phase 2 is complete when Azure resources can be reproduced from Bicep plus the documented bootstrap, acceptance recreation needs no undocumented portal action, and the security/observability/cost foundation is present. Phase 3 receives:

- environment resource names, identity principal IDs, vault names, and Container Apps network/runtime details;
- empty Key Vault secret slots for runtime and migration connections;
- isolated runtime and migration access policies; and
- a runnable acceptance API placeholder and migration job from which database connectivity can be tested.

Phase 3 may populate secret values through an approved script, but it must not place them in Bicep, workflow logs, or ordinary Container App configuration.


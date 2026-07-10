# Phase 1 — Bootstrap deployment identities

## Goal

Create a repeatable, auditable, and secretless trust path from GitHub Actions to Azure, with separate validation and environment deployment identities and mandatory production approval.

## Starting contract from Phase 0

- Azure subscription, Entra tenant, GitHub repository, and approved regions are recorded.
- Bootstrap operators and temporary privileges are approved.
- Acceptance and production GitHub environments and approvers are known.
- Primary and backup security and infrastructure owners are named.

## Actions

### 1. Add bootstrap assets

- Create `infrastructure/bootstrap/bootstrap-azure.ps1` and its `README.md`.
- Make the script non-interactive by default, parameterized for tenant, subscription, repository, branch/environment, and identity names, idempotent where practical, and terminating on error.
- Ensure output contains only non-secret identifiers. Document required operator roles, verification, rerun behavior, and cleanup.
- Create `infrastructure/HUMAN_CONFIGURATION.md` using the register fields in the master plan.

### 2. Establish GitHub environment controls

- Create or verify `acceptance` and `production` GitHub environments.
- Require designated reviewers for production infrastructure apply, database migration, and traffic-change workflows.
- Restrict deployment branches/tags according to the repository release policy.
- Store tenant ID, subscription ID, client IDs, locations, and resource names as non-secret variables. Do not add an Azure client secret.

### 3. Create separated identities and federation

- Create a read-only pull-request validation identity.
- Create distinct acceptance and production apply identities. Do not reuse the runtime or database migration identities provisioned later.
- Add GitHub OIDC federated credentials whose subjects are restricted to the exact organization, repository, and branch or GitHub environment.
- Prefer one identity per trust boundary so production access cannot be obtained through acceptance or pull-request workflows.

### 4. Assign least privilege

- Give the pull-request identity only the read and deployment-validation permissions needed for `what-if`.
- Scope acceptance apply permissions to acceptance resources and production apply permissions to production resources.
- Handle role-assignment creation through an explicitly approved narrow mechanism; do not grant permanent subscription-wide Owner rights to workflow identities.
- Record every role, scope, assignee ID, reason, operator, and reviewer.

### 5. Add and run a trust-verification workflow

- Add a minimal workflow that obtains an Azure token through OIDC and reports subscription, tenant, and allowed scope without exposing token material.
- Prove that acceptance authentication and validation succeed.
- Prove that production authentication requires the protected environment approval.
- Run a negative test showing that a pull-request context cannot assume a production identity or deploy outside its scope.

### 6. Remove bootstrap access

After verification, remove temporary elevated assignments and capture the resulting role-assignment inventory. Document the approved recovery/bootstrap rerun procedure.

## Validation and evidence

- Successful OIDC workflow URLs for validation and acceptance are recorded.
- A production workflow shows an approval gate before Azure authentication or deployment.
- Negative scope and subject tests fail as expected.
- GitHub contains no Azure client secret, certificate private key, or long-lived deployment credential.
- Temporary bootstrap access is absent from the final role inventory.

## End-state and handoff to Phase 2

Phase 1 is complete when GitHub Actions can validate and deploy through OIDC, production apply is approval-gated, identities are environment-specific and least-privileged, and temporary bootstrap access has been removed. Phase 2 receives:

- tenant, subscription, and deployment identity IDs as non-secret inputs;
- working acceptance and production workflow trust boundaries;
- approved deployment scopes and role-assignment mechanism; and
- bootstrap scripts and records sufficient to recreate the trust setup.

Phase 2 must use these identities and may not introduce stored Azure credentials.


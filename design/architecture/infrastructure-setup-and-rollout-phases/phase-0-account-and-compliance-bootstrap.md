# Phase 0 — Account and compliance bootstrap

## Goal

Establish the account ownership, regional, legal, security, billing, and approval decisions needed to provision infrastructure safely. This phase creates governance and records only; it does not deploy application infrastructure.

## Starting conditions

- The platform choices in the [master infrastructure plan](../infrastructure-setup-and-rollout-plan.md) are accepted in principle.
- A person is authorized to coordinate Azure, Neon, Firebase, GitHub, privacy/compliance, and billing stakeholders.
- No production data is moved or copied during this phase.

## Actions

### 1. Confirm Azure ownership and policy

- Record the Azure subscription ID, Entra tenant ID, subscription owner, billing contact, and break-glass contact.
- Confirm that West Europe is permitted for the API, registry, Key Vault, and telemetry. Record approved alternatives in case a required service or quota is unavailable.
- Confirm who may create Entra identities, federated credentials, role assignments, resource locks, and subscription-scope deployments.
- Check Container Apps, ACR, Key Vault, Log Analytics, and Application Insights availability and relevant quotas in the approved region.

### 2. Confirm Neon governance

- Create or confirm the organization, billing owner, technical owner, and at least one backup owner.
- Review the DPA, subprocessor terms, EU residency, backup/restore location, support level, and incident escalation route.
- Confirm that production and non-production will use separate projects and credentials.
- Record the approved EU region-selection rule without creating connection secrets yet.

### 3. Confirm Firebase and GitHub governance

- Verify owners and backup owners for production and non-production Firebase projects and confirm MFA.
- Verify GitHub organization and repository ownership, Actions availability, branch protection, and the ability to create protected `acceptance` and `production` environments.
- Name production deployment and migration approvers. Approvers must not depend on a single individual.

### 4. Assign operational ownership

Name a primary and backup owner for infrastructure, database operations, security response, deployment approval, billing/cost response, DNS, and application cutover. Record an incident contact path and the expected response to budget, security, availability, and data-integrity alerts.

### 5. Create the decision and evidence record

- Create an initial environment inventory containing non-secret account IDs, approved regions, owners, contacts, and decision dates.
- Create the initial human-configuration register or a tracked action to create `infrastructure/HUMAN_CONFIGURATION.md` at the start of Phase 1.
- Record unresolved legal, quota, ownership, or regional questions as blockers; do not silently convert them into implementation assumptions.

## Validation and evidence

- Each vendor account has two tested owner accounts with MFA.
- The privacy/compliance owner has recorded acceptance of residency and processor terms.
- Named owners acknowledge their role and escalation path.
- GitHub production environment approvers are documented.
- The inventory contains no passwords, tokens, service-account keys, or connection strings.

## End-state and handoff to Phase 1

Phase 0 is complete when vendor accounts, EU-region policy, billing and incident contacts, production approvals, and primary/backup owners are approved and recorded. Phase 1 receives:

- Azure subscription and Entra tenant identifiers;
- approved resource regions and naming/tagging ownership values;
- the authorized bootstrap operators and their temporary permission boundary;
- GitHub repository and environment names plus production approvers; and
- a human-configuration register ready to capture non-IaC changes.

Do not begin Phase 1 if account ownership, regional approval, or production approval responsibility is unresolved.


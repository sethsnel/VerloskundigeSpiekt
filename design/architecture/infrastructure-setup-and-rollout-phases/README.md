# Infrastructure setup and rollout phase plans

This directory turns the phases from the [infrastructure setup and rollout plan](../infrastructure-setup-and-rollout-plan.md) into executable, phase-specific plans. The parent plan remains the source of truth for platform decisions, security policy, runtime configuration, cost controls, and the human-configuration register.

Execute the phases in order. A phase is complete only when its end-state and evidence are present; that end-state is the entry contract for the next phase.

| Phase | Plan | Result handed to the next phase |
| --- | --- | --- |
| 0 | [Account and compliance bootstrap](phase-0-account-and-compliance-bootstrap.md) | Approved vendors, regions, owners, and governance |
| 1 | [Bootstrap deployment identities](phase-1-bootstrap-deployment-identities.md) | Secretless, approval-gated GitHub-to-Azure deployment access |
| 2 | [Provision Azure resources](phase-2-provision-azure-resources.md) | Reproducible shared and per-environment Azure foundation |
| 3 | [Provision Neon and database access](phase-3-provision-neon-and-database-access.md) | Isolated databases, roles, and Key Vault-backed connections |
| 4 | [Establish CI and supply-chain controls](phase-4-ci-images-and-supply-chain.md) | Tested, signed, traceable API and migration artifacts |
| 5 | [Configure DNS, TLS, and clients](phase-5-dns-tls-and-clients.md) | Secure public API endpoint and correctly configured clients |
| 6 | [Acceptance rollout and validation](phase-6-acceptance-rollout-and-validation.md) | Operationally proven release candidate and tuned settings |
| 7 | [Production foundation rollout](phase-7-production-foundation-rollout.md) | Production platform ready for data cutover, with no live traffic |
| 8 | [Application/data cutover and stabilization](phase-8-cutover-and-stabilization.md) | PostgreSQL-backed production service and archived final runbook |

## Completion rule

For every phase:

1. Store commands, workflow run URLs, reports, screenshots, decisions, and approvals in the locations named by that phase.
2. Record all portal-only or vendor-console changes in `infrastructure/HUMAN_CONFIGURATION.md` once that file exists.
3. Resolve failed validation before beginning the next phase; do not carry undocumented exceptions forward.
4. Obtain the named approval for any production, security, compliance, or data-handling decision.


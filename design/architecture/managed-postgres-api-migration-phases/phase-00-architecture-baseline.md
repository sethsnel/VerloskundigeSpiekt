# Phase 0 — Architecture baseline and delivery guardrails

## Goal

Turn the proposed architecture into approved, owned, and measurable delivery constraints before feature implementation begins.

## Prerequisites

- The master migration plan and infrastructure rollout plan are available for review.
- Product, application, platform, security, and data-migration owners can approve decisions.
- Read access is available to the current frontend, Firebase project metadata, Firestore inventory, and storage inventory.

## Implementation actions

1. Create or approve architecture decision records for PostgreSQL, ASP.NET Core as the only application data API, retained Firebase Authentication, initially retained Firebase Storage, logical shared-database multi-tenancy, and the rejection of direct database/data APIs.
2. Define local, test, acceptance, production, and any temporary pull-request environments. For each, record data classification, owner, deployment authority, secret owner, retention, and teardown policy.
3. Complete the Neon provider assessment for the chosen EU region. Capture evidence for residency of data/logs/backups, backup and point-in-time recovery, restore support, TLS and at-rest encryption, monitoring, maintenance, export/exit, and connection limits. Record the approval or select another provider before proceeding.
4. Adopt the ownership split from `infrastructure-setup-and-rollout-plan.md` for Container Apps, Key Vault, Container Registry, Bicep, GitHub OIDC, DNS/TLS, monitoring, and production operations.
5. Produce a dated baseline inventory: Firebase users, each Firestore collection and subcollection, document counts, nested notes, storage objects, sizes, and known legacy shapes.
6. Search every import below `frontend/lib/firestore/**` and `frontend/lib/firebase/**`. Build a traceability table containing caller, current operation, data touched, target `/api/v1` operation, target phase, owner, and migration/removal status.
7. Create a delivery board with vertical slices and dependencies. Add each phase's exit criteria to its definition of done and assign one EF migration owner.
8. Record open risks and time-boxed spikes, especially RLS through pooled connections, Firebase token validation, extension CORS/authentication, editor JSON size, and search-provider retention.

## Deliverables

- Approved decision records and provider assessment.
- Environment/responsibility matrix.
- Dated source-data baseline and endpoint/feature traceability inventory.
- Delivery board, risk register, and named owners.

## Verification and evidence

- Review the import inventory against `rg` results; every direct Firebase/Firestore dependency has a row.
- Have the application, platform, security, and product owners sign off on their responsibilities.
- Confirm each current workflow maps to an owned future endpoint or an explicitly approved retirement.
- Confirm provider evidence satisfies every acceptance criterion rather than relying on sales assumptions.

## End state and exit criteria

- Architecture and managed-provider decisions are approved.
- Every current Firestore read/write has an owner and target endpoint.
- Environment, secret, backup, recovery, and migration responsibilities are assigned.
- Baseline counts and acceptance evidence can later be reused for rehearsal reconciliation.

## Handoff to Phase 1

Phase 1 receives fixed runtime/deployment choices, environment configuration names, responsibility boundaries, and CI/CD acceptance gates. It must not need to revisit foundational provider or hosting decisions to bootstrap the backend.


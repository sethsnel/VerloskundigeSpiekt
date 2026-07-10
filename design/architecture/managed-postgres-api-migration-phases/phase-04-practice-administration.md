# Phase 4 — Practice administration vertical slice

## Goal

Replace the complete preview practice-management workflow with a transactional, authorized API vertical slice and make it usable by the local UI with fixtures.

## Inputs from Phase 3

- Validated current-user identity and `/api/v1/me` foundation.
- Member, administrator, owner, and global policies.
- RLS-protected tenancy schema and required unit-of-work transaction pattern.

## Implementation actions

1. Finalize `GET /api/v1/me` and implement `GET/PUT /api/v1/me/preferences/active-practice`. Validate that a selected practice is currently accessible; preference is never authorization.
2. Implement practice list, create, authorized read, and update. Query memberships directly rather than scanning practices.
3. Implement member listing, role changes, removal, and ownership transfer with explicit administrator/owner policies.
4. Implement pending invitations for the current user's verified normalized email, plus create, accept, decline, and revoke operations. Enforce one pending invitation per practice/email with a partial unique index.
5. Make practice creation atomic across practice, owner membership, and active preference. Add an idempotency mechanism for plausible browser retries.
6. Make invitation acceptance atomic, idempotent, and bound to the token's verified normalized email. Define stable results for already accepted/declined/revoked/expired invitations.
7. Make ownership transfer atomic. Enforce at domain and database/transaction boundaries that the only owner cannot be removed or demoted.
8. Define DTOs, Problem Details codes, cursor behavior where collections can grow, and OpenAPI examples. Do not expose EF entities.
9. Add domain, controller/contract, authorization, constraint, concurrency, transaction rollback, and retry/idempotency tests for every workflow.
10. Generate fixtures and connect the practice-administration UI locally to these endpoints as an acceptance proof; the full frontend migration remains Phase 6.

## Deliverables

- Stable practice, membership, invitation, preference, and current-user API contracts.
- Atomic handlers and database constraints.
- OpenAPI output, fixture set, and vertical-slice acceptance tests.

## Verification and evidence

- Exercise happy and negative paths for every role and invitation state.
- Inject failures between writes and prove transactions leave no partial state.
- Repeat creation and invitation-response requests and prove deterministic outcomes.
- Inspect generated SQL/query plans to confirm membership lookup does not scan all practices.
- Run the local UI workflow entirely against API-backed PostgreSQL fixtures.

## End state and exit criteria

- Practice administration has no need for Firestore behavior at the contract level.
- Every multi-record workflow is transactional and protected by constraints.
- The API never scans all practices to find a user's memberships.
- Accepted OpenAPI contracts are ready for incremental frontend client generation.

## Handoff to Phase 5

Phase 5 receives a complete tenant/role lifecycle, stable practice-scoped routing and authorization patterns, concurrency/error conventions, and seeded fixtures. New content tables and endpoints can consistently attach ownership to an authorized practice.


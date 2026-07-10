# Phase 3 — Authentication and tenant authorization

## Goal

Establish validated Firebase identity and fail-closed practice isolation at both API and database boundaries before domain data is exposed.

## Inputs from Phase 2

- Identity/tenancy schema, least-privilege roles, and real PostgreSQL tests.
- Verified transaction-local context under the runtime pooled connection.
- Unit-of-work and concurrency conventions.

## Implementation actions

1. Configure JWT bearer validation for Firebase ID tokens, including signature, issuer, audience, expiry, and project ID. Define key-refresh/failure behavior without accepting unverifiable tokens.
2. Implement a current-user abstraction sourced exclusively from validated claims. Map `sub`/UID to `users.external_subject`; never accept a client user ID as identity.
3. Add an idempotent `/api/v1/me` provisioning/update flow. Define which profile claims may synchronize and require verified email for invitation/email-bound workflows.
4. Implement separate policies/handlers for practice member, administrator, owner, and global administrator. Keep global privilege distinct from practice roles.
5. Create a tenant request context that treats route `practiceId` as authorization input. Resolve current membership for each tenant operation; never infer authorization from the active-practice preference.
6. Enable RLS on tenant tables. Set the external subject transaction-locally, resolve membership through `practice_members`, require tenant queries inside that transaction, and provide an explicit separately credentialed maintenance/migration path.
7. Configure exact frontend and extension CORS allowlists. Never combine wildcard origins with credentials.
8. Add integration tests for anonymous, invalid, expired, wrong-audience and unverified-email cases; every role boundary; removed members; route/body ID manipulation; cross-practice reads/writes; direct database access; and pooled-connection context reuse.
9. Return consistent 401, 403, 404-as-required-for-information-hiding, and Problem Details application codes.

## Deliverables

- Firebase authentication and current-user service.
- Authorization policies, tenant context, and transaction integration.
- RLS policies and explicit maintenance path.
- Negative authorization test matrix and CORS configuration.

## Verification and evidence

- Run all negative cases through HTTP and, where applicable, direct SQL as the runtime role.
- Remove a membership and prove the next request fails without cache delay.
- Reuse pooled connections across different test identities and prove tenant context does not leak.
- Search endpoint inputs/DTOs to confirm no user ID substitutes for authenticated identity.

## End state and exit criteria

- Cross-tenant access fails closed at API and database layers.
- Authenticated identity always comes from a validated token.
- Membership removal immediately blocks tenant access.
- Domain feature teams can reuse tested policies and tenant transactions.

## Handoff to Phase 4

Phase 4 receives authenticated `/me`, reusable member/admin/owner policies, RLS-protected tenancy tables, and transactional request context. This is sufficient to implement practice workflows without inventing feature-local authorization.


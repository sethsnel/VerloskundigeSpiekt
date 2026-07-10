# Phase 5 — Private wiki, templates, contacts, and shared content

## Goal

Replace Firestore content access with authorized relational APIs while preserving flexible editor documents, safe template behavior, search isolation, and file ownership.

## Inputs from Phase 4

- Stable practice-scoped routing, authorization, transaction, error, and concurrency patterns.
- Complete membership lifecycle and fixtures.
- Accepted OpenAPI workflow that Phase 6 can consume per completed feature.

## Implementation actions

1. Model private wiki content with `practice_pages`, `practice_page_sections`, and `practice_page_versions`. Keep stable metadata in columns, editor documents in `jsonb`, extracted text in a search/indexing column, ordered sections, and a unique `(practice_id, slug)` constraint.
2. Replace read-that-creates semantics with an explicit idempotent seed/create operation. Implement authorized CRUD, version history as required by current behavior, optimistic concurrency, and `409 Conflict` for stale edits.
3. Model `email_templates`, `email_template_versions`, and `email_template_keys`; separate draft and published versions. Validate keys against an allowlist/schema. API requests/responses may contain definitions but must never accept or persist resolved patient/client substitutions.
4. Model practice contacts with normalized email/telephone fields, indexed name/search fields, cursor pagination, and `jsonb` metadata only for genuinely variable data. Implement authorized operations matching the inventory.
5. Model global `articles` and `article_sections`. Replace the denormalized menu document with an ordered query or explicit navigation table and preserve current public visibility/order behavior.
6. Implement PostgreSQL full-text search as the default. If the Phase 0 inventory proves Azure Search is still required, index `practice_id` and visibility metadata, enforce tenant filters server-side, and prohibit browser access to search infrastructure.
7. Retain Firebase Storage initially but add PostgreSQL file metadata/ownership and authorized API-mediated upload/download or short-lived signed URL operations. Validate practice ownership, object scope, size/type policy, and expiry.
8. Apply RLS and explicit `practice_id` to every practice-owned table; add foreign keys, access-path indexes, checks, cursor ordering, and concurrency tokens.
9. For each feature, finalize DTOs/OpenAPI, add fixtures, and test authorization, cross-tenant negatives, constraints, pagination, simultaneous edits, version transitions, search filtering, and malformed/oversized editor documents.
10. Mark each accepted feature contract independently so Phase 6 can migrate it without waiting for unrelated content features.

## Deliverables

- Migrations, models, handlers, controllers, and OpenAPI contracts for all inventoried content domains.
- Search and file-access implementation decisions.
- Extracted-text/editor transformation and template-key validation services.
- Domain, database, authorization, contract, and concurrency tests.

## Verification and evidence

- Compare every global article and preview private-wiki behavior with an API equivalent.
- Run cross-practice search and direct-SQL negative tests.
- Simulate concurrent wiki/template edits and verify one stale writer receives `409` without data loss.
- Inspect template network DTOs and logs using synthetic patient values; prove resolved values are rejected and never retained.
- Exercise signed file access after membership removal and URL expiry.

## End state and exit criteria

- Current global article and preview private-wiki behavior has an API equivalent.
- Private search and file access cannot cross practice boundaries.
- Template contracts contain definitions only and cannot receive resolved client data.
- Each accepted OpenAPI feature contract is stable enough for generated-client consumption.

## Handoff to Phase 6

Phase 6 receives accepted contracts, generated-client inputs, Problem Details/concurrency semantics, fixtures, and a feature-by-feature readiness list covering practices, wiki, templates, contacts, articles/navigation, search, and files.


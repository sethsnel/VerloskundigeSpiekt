# Phase 0 evidence: architecture baseline

Status: implementation baseline recorded on 2026-07-10. Provider and production cutover approvals remain explicit release gates.

## Approved architecture decisions

| Decision | Baseline | Owner |
| --- | --- | --- |
| Application data API | ASP.NET Core 10 under `/api/v1`; browsers and the extension do not connect to PostgreSQL | Application |
| Database | PostgreSQL 17, one logically shared database with explicit `practice_id` ownership | Platform |
| Identity | Firebase Authentication ID tokens remain the identity provider initially | Security |
| Files | Object storage is private; metadata, namespace selection, signed access, and authorization are API-owned. Local development uses the filesystem adapter. | Application |
| Hosting | Azure Container Apps Consumption, EU region; Neon Launch PostgreSQL in an approved EU region | Platform |
| IaC and delivery | Azure Bicep, Key Vault, ACR, GitHub OIDC, immutable image digests | Platform |
| Rejected alternatives | Hasura, direct Supabase data API, direct browser/database access, and application dual writes | Architecture |

## Environment and responsibility matrix

| Environment | Data classification | Deployment authority | Secret owner | Retention/teardown |
| --- | --- | --- | --- | --- |
| Local | Synthetic/developer data only | Developer | .NET Secret Manager or ignored `.env` | Developer-owned; disposable |
| Pull request | Synthetic fixtures only | GitHub Actions | CI environment | Automatically removed after review |
| Test | Sanitized test data | Platform | CI/test environment | Retained for test evidence, then recycled |
| Acceptance | Sanitized production-like data | Platform with product approval | Azure Key Vault | Retained for rehearsal; explicit teardown |
| Production | Personal and practice data | Protected GitHub environment | Azure Key Vault/managed identity | Per retention policy and legal review |

## Provider assessment gate

Before contracting or production use, the platform owner must attach provider evidence for EU residency of primary data, replicas, logs and backups; automated backups/PITR; restore support; TLS; encryption at rest; monitoring; maintenance; export/exit; and connection limits. This repository records the acceptance criteria, but cannot assert commercial/provider evidence without access to the selected account.

## Current source inventory and traceability

The initial repository search found direct domain access in `frontend/lib/firestore/**`, `frontend/lib/firebase/files/**`, and callers in hooks, pages, layout, search, and admin components. The authoritative machine-readable inventory is generated with:

```powershell
rtk rg -n "firebase|firestore" frontend/lib frontend/app frontend/components
```

| Current area | Current operations | Target API | Phase | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| Removed `lib/firestore/practices` | practices, members, invites, active practice, practice articles | `/api/v1/me`, `/api/v1/practices`, `/api/v1/practices/{practiceId}/...` | 4/6 | Application | Migrated; import guard enforced in CI |
| Removed `lib/firestore/articles` | global articles, notes, menu, tags, search source | `/api/v1/articles`, `/api/v1/tags`, `/api/v1/search` | 5/6 | Content | Migrated; PostgreSQL FTS and API authoring are authoritative |
| Removed `lib/firebase/files` | list/upload/download/delete storage objects | `/api/v1/practices/{practiceId}/files` and signed storage routes | 5/6 | Application | Migrated to the API authorization boundary |
| `lib/auth` and server Firebase helpers | Firebase sign-in and token verification | Firebase remains identity; API validates bearer token | 3/6 | Security | Retained by design |
| admin Firebase routes | Firebase user administration | `/api/v1/admin` or explicit identity-admin boundary | 6 | Security | Existing admin surface requires separate review |

## Delivery board and risks

| Slice | Dependency | Exit evidence |
| --- | --- | --- |
| Backend bootstrap | Phase 0 | Build, health, OpenAPI, container and CI checks |
| Tenancy/authentication | Bootstrap + database | Negative authorization tests and RLS evidence |
| Practice administration | Tenancy/authentication | Transactional workflow acceptance |
| Content domains | Practice administration | Accepted contracts and isolation tests |
| Frontend client | Per accepted contract | No domain Firestore imports |
| Extension templates | Published template contract | Privacy sentinel/network tests |
| Hardening/rehearsal | All consumers | Restore, load, security, and go/no-go evidence |
| Cutover | Rehearsal approval | Reconciled import and rollback record |

| Risk | Mitigation | Owner |
| --- | --- | --- |
| RLS with transaction pooling | `SET LOCAL` inside every tenant unit-of-work; integration test connection reuse | Platform |
| Firebase key/token failures | Strict issuer/audience/signature validation and bounded key refresh | Security |
| Editor JSON growth | JSON size validation, extracted text, and load tests | Content |
| Extension privacy | Definition-only DTOs and synthetic sentinel network/storage tests | Extension |
| Provider evidence unavailable | Do not pass Phase 0 provider gate until evidence is attached | Platform |


# Phase 8 rehearsal checklist

Record evidence for each release candidate:

- API 5xx rate, p95 latency, authentication failures, rate-limit rejections, and database pool saturation dashboards.
- PostgreSQL backup/PITR restore into an isolated target with measured RPO/RTO.
- Load tests for practice switching, wiki reads/edits, published-template listing, contacts, and search at 3x the target workload.
- Failure tests for unavailable database, exhausted connections, expired Firebase keys, search/storage outage, cold start, revision rollback, migration-job failure, and credential rotation.
- Security review for object-level authorization, mass assignment, CORS, rate limits, secret/log redaction, RLS, image/SBOM, and extension privacy.

Production cutover remains blocked until platform/security and product owners sign the go/no-go checklist and all exceptions have an owner and expiry.

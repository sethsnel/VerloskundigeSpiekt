# Firestore → PostgreSQL migration tool

The tool is intentionally manifest-first: source export, transformation, validation, checkpointed import, target validation, and reporting are separate resumable commands. Every record retains its Firestore collection/document path as a migration alias, and reports contain counts/checksums/error codes only.

Typical rehearsal:

```powershell
pnpm --dir tools/migration-firestore-postgres install
pnpm --dir tools/migration-firestore-postgres export -- --env-file ../../frontend/.env --output artifacts/dev-export.json
pnpm --dir tools/migration-firestore-postgres transform -- --input artifacts/dev-export.json --output artifacts/dev-manifest.json
pnpm --dir tools/migration-firestore-postgres validate-source -- --input artifacts/dev-manifest.json --output artifacts/dev-validated.json
pnpm --dir tools/migration-firestore-postgres run import -- --input artifacts/dev-validated.json --database-url $env:MIGRATION_DATABASE_URL
pnpm --dir tools/migration-firestore-postgres validate-target -- --input artifacts/dev-validated.json --database-url $env:MIGRATION_DATABASE_URL --output artifacts/dev-target-report.json
pnpm --dir tools/migration-firestore-postgres report -- --input artifacts/dev-validated.json --output artifacts/dev-report.json
```

`export` reads Firestore and Firebase Auth with the Firebase Admin credentials from the supplied env file. It recursively captures root collections and subcollections. Use `--input` instead when wrapping an existing JSON snapshot. The export and manifest contain source payloads; keep them local and do not commit them.

The Firebase export adapter is the only component that may use server credentials. The API and extension never receive this tool's credentials or source payloads. The `import` command records aliases and loads supported users, practices, memberships, invitations, preferences, contacts, templates/versions, file metadata, pages/sections, global articles/sections, tags, and article-tag links with durable restart checkpoints. Menu ordering is used for article positions; unsupported domains fail target validation instead of being silently treated as reconciled.

## Integrity and restart behavior

The tool consumes sanitized Firestore-shaped exports and writes only to a schema
that has already been created by the committed EF migration bundle. It never
creates operational tables at import time.

Checksums use `canonical-json-sha256-v1`: object keys are recursively sorted,
array order is preserved, undefined object properties are omitted, undefined
array entries become `null`, maps become sorted string-keyed objects, and
Firestore timestamps/dates become ISO-8601 strings. Unsupported or cyclic
values fail rather than being silently normalized.

The run ID is deterministic for the source checksum and checksum algorithm.
Domain row versions are deterministic for mapped source state, and conflict
updates are skipped when that state is unchanged. `migration_runs` and
`migration_record_states` retain status, retry/error metadata, tool version,
schema version, and restart state. Domain writes are durable record-level
checkpoints, so a retry does not duplicate rows or churn unchanged versions.
Rehearsal tests may pass `--inject-failure after-domain-writes` to prove a
stable run can resume after durable domain writes; this switch is for synthetic
failure testing and must not be used for a production import.

`validate-target` checks aliases and actual rows by domain type, including
tenant relationships, roles, ordering, publication state, and stored document
JSON. Optional exceptions must be JSON entries containing `sourceDocumentId`,
`owner`, and `reason`.

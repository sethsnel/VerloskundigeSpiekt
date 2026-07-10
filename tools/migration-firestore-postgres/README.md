# Firestore → PostgreSQL migration tool

The tool is intentionally manifest-first: source export, transformation, validation, transactional import, target validation, and reporting are separate resumable commands. Every record retains its Firestore collection/document path as a migration alias, and reports contain counts/checksums/error codes only.

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

The Firebase export adapter is the only component that may use server credentials. The API and extension never receive this tool's credentials or source payloads. The `import` command records aliases and loads supported users, practices, memberships, invitations, preferences, pages, sections, and global articles transactionally. Menu ordering is used for article positions; tags, file metadata, contacts, and email templates remain unmapped until their source inventory and target mapping are reviewed.

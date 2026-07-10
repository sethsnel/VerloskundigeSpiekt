# Firestore → PostgreSQL migration tool

The tool is intentionally manifest-first: source export, transformation, validation, import alias recording, target validation, and reporting are separate resumable commands. Every record retains its Firestore collection/document path as a migration alias, and reports contain counts/checksums/error codes only.

Typical rehearsal:

```powershell
pnpm --dir tools/migration-firestore-postgres install
pnpm --dir tools/migration-firestore-postgres transform -- --input export.json --output manifest.json
pnpm --dir tools/migration-firestore-postgres validate-source -- --input manifest.json --output validated.json
pnpm --dir tools/migration-firestore-postgres import -- --input validated.json --database-url $env:MIGRATION_DATABASE_URL
pnpm --dir tools/migration-firestore-postgres validate-target -- --input validated.json --database-url $env:MIGRATION_DATABASE_URL --output target-report.json
pnpm --dir tools/migration-firestore-postgres report -- --input validated.json --output migration-report.json
```

The Firebase export adapter is the only component that may use server credentials. The API and extension never receive this tool's credentials or source payloads. The `import` command records aliases transactionally; domain-row adapters are added only after the rehearsal mapping is reviewed against the actual production inventory.

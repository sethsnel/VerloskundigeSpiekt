# Schema delivery workflow

1. Generate a migration locally with `dotnet ef migrations add <Name>`.
2. Inspect the generated migration and SQL script in review; verify expand-and-contract compatibility.
3. Apply it to a clean/ephemeral PostgreSQL 17 database in CI.
4. Build a separate EF migration bundle with `scripts/create-migration-bundle.ps1`.
5. Execute the bundle from the protected Container Apps migration job using the direct Neon endpoint and `vs_migrator`. The API uses the pooled runtime endpoint and never migrates on startup.
6. Treat restore/redeploy as the rollback mechanism. Production down-migrations are not an incident rollback plan.

The request middleware sets `app.external_subject` and `app.user_email` with `SET LOCAL` inside a transaction. This is required for RLS correctness through transaction pooling; a pooled connection must never receive a session-level tenant setting.

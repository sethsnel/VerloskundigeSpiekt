# Schema delivery workflow

1. Generate a migration locally with `dotnet ef migrations add <Name>`.
2. Inspect the generated migration and SQL script in review; verify expand-and-contract compatibility.
3. Apply it to a clean/ephemeral PostgreSQL 17 database in CI.
4. Build a separate EF migration bundle with `scripts/create-migration-bundle.ps1`.
5. Execute the bundle from the protected Container Apps migration job using the direct Neon endpoint and `vs_migrator`. The API uses the pooled runtime endpoint and never migrates on startup.
6. Treat restore/redeploy as the rollback mechanism. Production down-migrations are not an incident rollback plan.

The request middleware sets `app.external_subject` and `app.user_email` with `SET LOCAL` inside a transaction. This is required for RLS correctness through transaction pooling; a pooled connection must never receive a session-level tenant setting.
## Clean-environment order

1. A cluster administrator runs `database/bootstrap-roles.sql` and injects role passwords out of band.
2. `vs_migrator`, which owns the database and `public` schema, applies the reviewed bundle over the direct database endpoint.
3. `vs_migrator` runs `database/roles.sql` to grant the minimum endpoint privileges to `vs_api`.
4. The application starts with `vs_api`; it never owns schema objects, migrates at startup, inherits another role, or bypasses RLS.

CI applies the bundle first to the initial migration boundary and then to the
latest migration with the same protected owner role, proving follow-up ALTERs.
Image promotion and the cloud migration job remain remote-only gates until an
approved registry/environment and protected deployment identity are available.

# Local backend development

The backend uses PostgreSQL. The VS Code MSSQL extension is for SQL Server and Azure SQL; use a PostgreSQL-capable extension such as Microsoft’s PostgreSQL extension (`ms-ossdata.vscode-pgsql`) instead.

## Prerequisites

- Docker Desktop using the Linux engine
- The .NET SDK specified in `global.json`
- VS Code with a PostgreSQL database extension

## Start PostgreSQL

From the repository root:

```powershell
rtk docker compose -f backend/docker-compose.yml up -d postgres
rtk docker compose -f backend/docker-compose.yml ps
```

The local database is exposed at `localhost:5432` with these defaults:

```text
Database: verloskundigespiekt
Username: postgres
Password: postgres
```

## Bootstrap roles and apply the EF schema

The clean-environment order is mandatory: create restricted roles first, make
`vs_migrator` the database/schema owner, apply the committed bundle as that
role, and only then apply runtime grants. The API never applies migrations.

```powershell
cd backend

$env:PGPASSWORD = 'postgres'
rtk psql -h localhost -U postgres -d verloskundigespiekt -f database/bootstrap-roles.sql
rtk psql -h localhost -U postgres -d verloskundigespiekt -c "ALTER ROLE vs_migrator PASSWORD 'local-migrator'; ALTER ROLE vs_api PASSWORD 'local-runtime';"
rtk dotnet tool restore
rtk ./scripts/create-migration-bundle.ps1 -Output artifacts/efbundle.exe
rtk ./artifacts/efbundle.exe --connection "Host=localhost;Port=5432;Database=verloskundigespiekt;Username=vs_migrator;Password=local-migrator"
$env:PGPASSWORD = 'local-migrator'
rtk psql -h localhost -U vs_migrator -d verloskundigespiekt -f database/roles.sql
```

## Start the API

Open a second terminal:

```powershell
cd backend

rtk dotnet run `
  --project src/VerloskundigeSpiekt.Api/VerloskundigeSpiekt.Api.csproj `
  -- `
  --urls http://localhost:8080 `
  --environment Development
```

Useful endpoints:

- `http://localhost:8080/health/live`
- `http://localhost:8080/health/ready`
- `http://localhost:8080/openapi/v1.json`

## Connect from VS Code

Install a PostgreSQL extension and create a connection using:

```text
Host:     localhost
Port:     5432
Database: verloskundigespiekt
Username: postgres
Password: postgres
SSL:      Disable
```

Connect as `vs_api` when validating application behavior and as `vs_migrator`
only for schema inspection. `postgres` is limited to initial cluster bootstrap.

Useful inspection queries:

```sql
select current_database(), current_user;

select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

select * from users;
select * from practices;
select * from practice_members;
select * from "__EFMigrationsHistory";
select * from migration_aliases;
```

## Stop or reset the environment

Stop the API with `Ctrl+C`. Stop PostgreSQL while preserving its local volume with:

```powershell
rtk docker compose -f backend/docker-compose.yml down
```

To delete the local database volume and start from an empty database:

```powershell
rtk docker compose -f backend/docker-compose.yml down -v
```

The `-v` command is destructive to local database data.

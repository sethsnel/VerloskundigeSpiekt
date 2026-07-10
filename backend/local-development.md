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

## Apply the EF schema

Run migrations separately; the API does not apply migrations during startup.

```powershell
cd backend

rtk dotnet ef database update `
  --project src/VerloskundigeSpiekt.Infrastructure/VerloskundigeSpiekt.Infrastructure.csproj `
  --startup-project src/VerloskundigeSpiekt.Api/VerloskundigeSpiekt.Api.csproj
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

Connect as `postgres` when inspecting local data. The API runtime role is intentionally restricted by PostgreSQL row-level security.

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

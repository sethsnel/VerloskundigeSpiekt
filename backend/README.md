# VerloskundigeSpiekt API

The API is the only application data boundary. Run locally with `dotnet run --project src/VerloskundigeSpiekt.Api` or start PostgreSQL and the API with `docker compose up --build`.

Required configuration is validated at startup. Store local secrets in .NET Secret Manager or an ignored environment file; `.env.example` contains names only. The API never applies EF migrations during startup. Generate and execute migration bundles separately with the direct migration connection and role.

`Firebase:ProjectId` must be the same project ID used by the frontend. Development defaults to `verloskundigespiekt-dev` through `appsettings.Development.json`; production must provide the project ID through deployment configuration (for example, `Firebase__ProjectId`).

## Verification

```powershell
rtk dotnet restore VerloskundigeSpiekt.slnx
rtk dotnet build VerloskundigeSpiekt.slnx --configuration Release
rtk dotnet test VerloskundigeSpiekt.slnx --configuration Release
```

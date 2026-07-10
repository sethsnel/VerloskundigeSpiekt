param(
  [string]$Output = "artifacts/efbundle.exe"
)

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force (Split-Path -Parent $Output) | Out-Null
dotnet ef migrations bundle `
  --project src/VerloskundigeSpiekt.Infrastructure/VerloskundigeSpiekt.Infrastructure.csproj `
  --startup-project src/VerloskundigeSpiekt.Api/VerloskundigeSpiekt.Api.csproj `
  --configuration Release `
  --self-contained `
  --output $Output
Write-Output "Migration bundle created at $Output. Execute it only with the direct database endpoint and migration role."

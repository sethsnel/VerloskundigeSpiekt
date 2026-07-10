# Infrastructure setup and rollout plan

## 1. Purpose and infrastructure decisions

This plan provisions and operates the infrastructure for the standalone ASP.NET Core API described in `managed-postgres-api-migration-plan.md`. It separates repeatable infrastructure from one-time account, compliance, DNS, and secret-bootstrap work.

### Selected platform

- API runtime: ASP.NET Core 10 Web API in a Linux container.
- API hosting: Azure Container Apps Consumption in an EU region, initially West Europe.
- API scaling: HTTP scaling with `minReplicas: 0` and an initial `maxReplicas: 3`.
- Database: Neon Launch PostgreSQL in the closest acceptable EU region, initially an Azure-hosted Frankfurt region if available during provisioning.
- Identity provider: Firebase Authentication.
- Image registry: Azure Container Registry.
- Secret store: Azure Key Vault.
- Telemetry: Azure Monitor/Application Insights using OpenTelemetry, with sampling and capped retention.
- IaC: Plain Bicep for solution composition, with pinned Azure Verified Resource Modules (AVM) as the default implementation for supported Azure resources. Direct resource declarations are allowed only for documented AVM gaps. Neon is initially provisioned through its managed console and documented scripts/API checks because the available Terraform provider is community-maintained rather than part of the selected provider's supported control plane.
- CI/CD: GitHub Actions with OpenID Connect federation to Azure. Do not store an Azure client secret in GitHub.

### Why Bicep and Azure Verified Modules instead of one cross-provider Terraform stack

Azure is the only infrastructure control plane in the first deployment; Neon is a managed external dependency with a small number of account-level settings. Bicep gives native support for Container Apps, Key Vault, managed identities, RBAC, monitoring, budgets, and Azure Container Registry without Terraform state or a community Neon provider in the production trust chain.

Azure Verified Modules are versioned Bicep modules published in Azure's public registry. Use AVM resource modules as tested, standardized building blocks while keeping environment composition and application-specific decisions in project-owned Bicep. This is not a choice between Bicep and AVM: AVM is the default resource-module layer within the Bicep solution.

Revisit Terraform/OpenTofu only if the project adds several supported non-Azure providers or Neon publishes/adopts a provider the team is willing to support. Do not run Bicep and Terraform against the same Azure resources.

### AVM usage policy

Prefer published, active AVM resource modules for:

- Container Apps managed environments.
- The API Container App.
- The database migration Container Apps Job.
- Azure Container Registry.
- Key Vault.
- User-assigned managed identities.
- Log Analytics and Application Insights.
- Storage accounts and common role assignments where the module contract fits.

Use project-owned Bicep to compose those modules into application-level concerns such as `api-host`, `security`, `observability`, and `cost-management`. Do not create a one-to-one local wrapper around every AVM module; a local module should express a meaningful VerloskundigeSpiekt infrastructure boundary or policy.

Use a direct Bicep `resource` declaration only when:

- No published and active AVM module exists.
- The pinned AVM version lacks a required Azure property.
- An AVM defect blocks deployment.
- The AVM abstraction makes a simple resource materially less maintainable.

Every direct-resource exception must include a code comment and an entry in an architecture decision record or infrastructure exception register. Reassess exceptions during AVM upgrades. Do not copy and modify AVM source in this repository; that creates a private fork the team would have to secure and maintain.

Do not use the full AVM Container Apps landing-zone pattern initially. Its networking and platform scope is disproportionate to this application. Reconsider it if the platform later requires hub/spoke networking, controlled egress, pervasive private endpoints, multiple applications in a shared landing zone, or a separately governed clinical-data environment.

AVM references must use exact versions, for example:

```bicep
module api 'br/public:avm/res/app/container-app:<exact-version>' = {
  name: 'api'
  params: {
    // Environment-specific values supplied by the solution layer.
  }
}
```

Never use an unversioned or floating `latest` reference. Enable Bicep's `use-recent-module-versions` analyzer as a warning, but upgrade modules only through reviewed pull requests. Relevant references: [Azure Verified Modules](https://azure.github.io/Azure-Verified-Modules/), [AVM Bicep module index](https://azure.github.io/Azure-Verified-Modules/indexes/bicep/), and [Bicep module guidance](https://learn.microsoft.com/azure/azure-resource-manager/bicep/modules).

## 2. Environment topology

Use three long-lived environments:

| Environment | API | Database | Data | Deployment approval |
| --- | --- | --- | --- | --- |
| Development | Local Docker Compose; optional shared Container App | Local PostgreSQL 17; optional Neon non-production branch | Synthetic only | None |
| Acceptance | Azure Container App | Separate Neon non-production project/branch | Synthetic or sanitized | Automatic after main build |
| Production | Azure Container App | Separate Neon production project | Production | Required human approval |

Production and non-production must use separate Neon projects and credentials. Do not put production data in a branch that shares access credentials or operational ownership with development. Pull-request environments are optional and should be introduced only when their maintenance cost is justified.

Use a consistent naming scheme, for example:

```text
rg-vs-platform-weu                 # Shared ACR and optional shared monitoring
rg-vs-acceptance-weu
rg-vs-production-weu
crvsplatform                      # ACR name must be globally unique
cae-vs-acceptance-weu
cae-vs-production-weu
ca-vs-api-acceptance
ca-vs-api-production
kv-vs-acceptance-<suffix>
kv-vs-production-<suffix>
appi-vs-api-acceptance
appi-vs-api-production
```

Tag every Azure resource with `application`, `environment`, `owner`, `costCenter`, `managedBy=bicep`, and `dataClassification`.

## 3. Proposed repository layout

```text
/
├── backend/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .dockerignore
│   ├── global.json
│   ├── VerloskundigeSpiekt.slnx
│   ├── src/
│   └── tests/
├── infrastructure/
│   ├── README.md
│   ├── bicepconfig.json
│   ├── main.bicep
│   ├── environments/
│   │   ├── acceptance.bicepparam
│   │   └── production.bicepparam
│   ├── modules/
│   │   ├── api-host.bicep          # Composes AVM environment, app and job modules
│   │   ├── security.bicep          # Composes AVM Key Vault, identity and RBAC modules
│   │   ├── observability.bicep     # Composes AVM logs and Application Insights modules
│   │   ├── container-registry.bicep # Composes the AVM ACR module and retention policy
│   │   ├── dns-certificate.bicep   # AVM where supported; direct resources by exception
│   │   └── cost-management.bicep   # AVM where supported; direct resources by exception
│   ├── bootstrap/
│   │   ├── README.md
│   │   └── bootstrap-azure.ps1
│   └── scripts/
│       ├── validate-environment.ps1
│       ├── configure-neon-secret.ps1
│       ├── smoke-test.ps1
│       └── rollback-revision.ps1
└── .github/workflows/
    ├── infrastructure-validate.yml
    ├── infrastructure-deploy.yml
    ├── backend-ci.yml
    ├── backend-deploy.yml
    └── database-migrate.yml
```

PowerShell scripts must be non-interactive by default, use explicit parameters, fail on errors, and avoid printing secret values.

## 4. IaC versus human configuration

| Concern | Method | Notes |
| --- | --- | --- |
| Azure resource groups | Plain Bicep/subscription deployment | One per environment plus optional shared platform group. |
| Container Apps environments/apps/jobs | Pinned AVM resource modules composed by local Bicep | Image digest remains a deployment parameter. |
| Container Registry | Pinned AVM resource module | Disable admin credentials; pull through managed identity. |
| Managed identities and Azure RBAC | Pinned AVM modules where their contracts fit | Separate runtime, migration, and GitHub deployment identities. |
| Key Vault and secret references | Pinned AVM resource module plus local composition | IaC creates vault, RBAC, and references, but never secret values. |
| Monitoring, alerts, retention | Pinned AVM modules plus local composition | Keep log volume and retention intentionally small at first. |
| Azure budgets/action groups | AVM where supported; direct Bicep by documented exception | Alerts at forecast/actual thresholds; budgets do not stop resources. |
| API DNS zone/records | AVM where supported or direct Bicep if Azure DNS owns the zone | Registrar delegation remains a human step. |
| Custom-domain validation | Bicep/AVM plus human DNS check | Managed certificate issuance may require a staged deployment. |
| GitHub OIDC app/federated credentials | Bootstrap script, then IaC | Initial actor must have permission to create Entra objects and role assignments. |
| GitHub environments and approvers | Human GitHub configuration | Protect production applies, migrations, and traffic changes. |
| Neon organization, billing, DPA | Human | Requires legal/account ownership. |
| Neon project/region/plan | Human using a checklist | Capture immutable identifiers as non-secret CI variables. |
| Neon runtime and migration credentials | Human-approved script | Write only to Key Vault; rotate after bootstrap and cutovers. |
| Firebase project/auth settings | Human | Add allowed domains and extension configuration deliberately. |
| Production data migration | Human-approved workflow | Scripts are automated; start and cutover require named approval. |

## 5. Security and secret model

1. Give the API a user-assigned managed identity so Key Vault and ACR permissions can be provisioned before a Container App revision exists.
2. Grant the runtime identity:
   - `AcrPull` on the registry.
   - `Key Vault Secrets User` only on its environment vault.
   - No subscription/resource-group contributor rights.
3. Give the migration job a different identity and a different database connection secret.
4. Store these as separate Key Vault secrets:
   - `postgres-runtime-connection` using the Neon pooled endpoint and restricted runtime role.
   - `postgres-migration-connection` using the direct endpoint and migration role.
   - Firebase Admin credential only if a server-side Storage operation requires it. Firebase JWT signature validation alone should use public issuer metadata and not require a service-account key.
5. Reference Key Vault secrets from Container Apps with managed identity. Do not copy secret values into Bicep parameter files or ordinary Container App secrets.
6. Use passwordless GitHub-to-Azure OIDC federation and scope apply identities to their environment resource group. Use a separate read-only identity for pull-request plans.
7. Protect production Key Vault from deletion with soft delete, purge protection, RBAC, and a resource lock after initial rollout.
8. Log secret names and versions only, never values or connection strings.
9. Rotate database credentials after migration, staff changes, suspected exposure, and at a defined periodic interval.

## 6. Runtime and container configuration

### API image

Build one immutable multi-stage image:

1. Restore and publish with the official .NET 10 SDK image.
2. Run with the official Debian-based ASP.NET Core 10 runtime image.
3. Pin image tags to a reviewed patch version and image digest; update them through dependency automation.
4. Run as the non-root user provided by the official .NET image.
5. Listen on HTTP port `8080`; TLS terminates at Container Apps ingress.
6. Set a read-only root filesystem where supported and use `/tmp` only for bounded ephemeral files.
7. Include no SDK, source, test assets, credentials, EF tools, or migration connection string in the runtime image.
8. Emit logs to stdout/stderr as structured JSON.
9. Handle `SIGTERM` and use ASP.NET Core graceful shutdown. Requests must not depend on in-memory session state.

Use Debian-based images initially rather than Alpine so globalization, Dutch formatting, native dependencies, and diagnostics behave predictably. Optimize image size after measuring cold-start behavior.

### Local and CI containers

- Pin PostgreSQL 17 for local development and CI until the managed production major is selected; keep all environments on the same major.
- `docker-compose.yml` runs PostgreSQL with a health check and a persistent named volume for local use.
- Integration tests use a fresh disposable PostgreSQL container per test run, not the developer volume and not EF's in-memory provider.
- Local secrets use .NET Secret Manager or an ignored `.env.local`; provide a checked-in `.env.example` containing names only.

### Container Apps settings

Initial production and acceptance values:

```text
CPU:                 0.5 vCPU
Memory:              1 GiB
Ingress:             external HTTPS only
Target port:         8080
Minimum replicas:    0
Maximum replicas:    3
Scaling:             HTTP concurrency, start near 20 requests/replica
Revision mode:       multiple during rollout, single after stabilization if desired
Liveness path:       /health/live
Readiness path:      /health/ready
Startup path:        /health/startup
```

Liveness must not query PostgreSQL. Readiness may query PostgreSQL with a tight timeout. Do not run schema migrations during API startup. External uptime monitors will wake a scaled-to-zero API, so use them only if that cost/availability trade-off is intentional.

### PostgreSQL connections

- API runtime uses the Neon PgBouncer transaction-pooled connection string.
- EF migration bundle/job, `pg_dump`, and restore tooling use the direct connection string.
- Begin with an Npgsql maximum pool size of 10 per API replica and a short connection timeout; measure before increasing.
- Enable TCP keepalive and transient connection retries with bounded attempts and jitter. Do not blindly retry non-idempotent application transactions.
- Ensure transaction-local tenant context and Row-Level Security tests work through PgBouncer transaction mode before production.

## 7. Infrastructure setup phases

The executable, phase-specific plans and their handoff contracts are indexed in [`infrastructure-setup-and-rollout-phases/README.md`](infrastructure-setup-and-rollout-phases/README.md).

### Infrastructure Phase 0 — Account and compliance bootstrap

1. Confirm Azure subscription, Entra tenant, resource owners, billing contacts, and EU region policy.
2. Create/confirm Neon organization ownership, billing, DPA, EU region, support contacts, and incident contact path.
3. Confirm Firebase project ownership and production/non-production separation.
4. Confirm GitHub organization/repository ownership and enable protected environments.
5. Assign named owners for infrastructure, database, security, deployment approval, and billing.

Exit criteria:

- Vendor accounts have at least two owners and MFA.
- EU residency and processor terms have been reviewed.
- Production approvals and incident contacts are named.

### Infrastructure Phase 1 — Bootstrap deployment identities

1. Create the Azure state-free Bicep bootstrap script.
2. Create plan/apply managed identities or app registrations for acceptance and production.
3. Configure GitHub OIDC federated credentials restricted by repository and GitHub environment.
4. Assign least-privilege roles:
   - Pull-request plan: resource-group Reader plus deployment validation permissions.
   - Acceptance apply: Contributor only on acceptance scope plus required role-assignment permissions through a narrowly scoped bootstrap actor.
   - Production apply: Contributor only on production scope and protected by GitHub approval.
5. Remove temporary bootstrap permissions after verification.

Exit criteria:

- GitHub Actions can validate and deploy without a stored Azure client secret.
- Production apply cannot run without environment approval.

### Infrastructure Phase 2 — Provision shared and environment Azure resources

1. Build and validate solution Bicep modules using pinned AVM resource modules by default.
2. Provision ACR, disabling admin credentials and enabling retention appropriate to rollback requirements.
3. For each environment, provision:
   - Resource group.
   - Container Apps environment.
   - Runtime and migration user-assigned identities.
   - Key Vault and RBAC.
   - Log Analytics/Application Insights.
   - API Container App placeholder revision.
   - Manual-trigger Container Apps migration job.
   - Alert action group and budget alerts.
4. In pull requests, run `bicep restore`, lint, build, and Azure `what-if`. Retain the compiled ARM JSON and `what-if` output as artifacts.
5. Deploy the exact compiled ARM JSON artifact that passed acceptance to production; do not rebuild or re-resolve AVM versions during promotion.
6. Add policy/checks rejecting floating AVM versions, non-EU locations, public secret values, registry admin credentials, or production `minReplicas`/`maxReplicas` outside approved bounds.
7. Enable the `use-recent-module-versions` analyzer at warning level. Treat it as update information, not an automatic upgrade instruction.

Exit criteria:

- A clean subscription scope can be reproduced from Bicep plus the documented bootstrap.
- Deleting and recreating acceptance does not require portal-only knowledge.
- Every AVM dependency is pinned, and every direct Azure resource declaration has a documented justification.

### Infrastructure Phase 3 — Provision Neon and database access

Human-configured steps:

1. Create separate acceptance and production Neon projects in the approved EU region.
2. Select PostgreSQL 17 if supported and keep acceptance/production on the same major.
3. Configure Launch plan autoscaling:
   - Minimum 0.25 CU.
   - Maximum initially 1 or 2 CU.
   - Scale-to-zero after five idle minutes.
   - Seven-day restore window.
4. Create migration-owner and restricted runtime database roles.
5. Run `configure-neon-secret.ps1` from an approved workstation/workflow to write pooled and direct connection strings into the matching Key Vault.
6. Record project ID, region, PostgreSQL major, endpoint hostname, autoscaling bounds, and restore window in the environment inventory; do not record passwords.
7. Test pooled runtime and direct migration connections from acceptance Container Apps.

Exit criteria:

- The API identity can resolve only the runtime connection secret.
- The migration identity can resolve only the migration secret.
- Runtime credentials cannot create schema objects or bypass RLS.

### Infrastructure Phase 4 — Establish CI, images, and supply-chain controls

1. Backend CI runs restore, formatting, build, unit tests, PostgreSQL integration tests, OpenAPI compatibility checks, container build, vulnerability scan, and software bill of materials generation.
2. Build the API image once per commit and tag it with the Git SHA; deploy by immutable digest.
3. Sign images and retain provenance where supported by the selected GitHub/Azure tooling.
4. Create a separate migration artifact/image containing an EF Core migration bundle. It must not be part of the API startup path.
5. Grant GitHub push access to ACR through OIDC and least privilege.
6. Configure dependency automation for .NET SDK/runtime image patches, NuGet packages, AVM versions, direct Bicep API versions, and GitHub Actions pinned to commit SHAs. AVM updates must use dedicated pull requests with changelog review and `what-if` validation.

Exit criteria:

- The deployed image digest is traceable to source commit, CI run, tests, and SBOM.
- A vulnerable or failed image cannot reach acceptance or production.

### Infrastructure Phase 5 — Configure DNS, TLS, and clients

1. Choose `api.<domain>` and manage its record through Bicep if Azure DNS hosts the zone; otherwise document the human registrar change.
2. Bind the custom domain to Container Apps and use a managed certificate or Key Vault-managed certificate.
3. Update Firebase authorized domains and browser-extension configuration where necessary.
4. Configure explicit CORS allowlists for production frontend and extension origins.
5. Set frontend environment-specific API base URLs. No database endpoint belongs in frontend configuration.
6. Test certificate renewal ownership and document the fallback procedure.

Exit criteria:

- HTTPS is valid end to end and HTTP cannot serve API traffic.
- CORS denies unknown origins.
- The frontend and extension know only the API URL.

### Infrastructure Phase 6 — Acceptance rollout and operational validation

1. Deploy the API image to acceptance with `minReplicas: 0`.
2. Run the migration job using the direct database endpoint.
3. Execute smoke, authentication, tenant-isolation, and browser-extension contract tests.
4. Measure cold starts when both Container Apps and Neon are suspended.
5. Exercise:
   - Revision rollback.
   - Failed migration handling.
   - Key Vault secret rotation.
   - Neon point-in-time restore into an isolated target.
   - API behavior during database suspension/recovery.
6. Tune logging sampling, retention, Npgsql pool size, HTTP concurrency, and Neon maximum CU from measurements.

Exit criteria:

- Restore and rollback have been demonstrated.
- Measured cold-start latency is accepted or a warm-resource decision is recorded.
- Alerts reach the named responders without excessive noise.

### Infrastructure Phase 7 — Production foundation rollout

1. Apply production Bicep through the protected GitHub environment.
2. Provision and validate production Neon using the Phase 3 checklist.
3. Add production DNS and TLS.
4. Deploy an API revision without moving frontend traffic to it.
5. Run initial migrations on the empty database through the migration job.
6. Run synthetic smoke tests and verify logs, metrics, alerting, and cost dashboards.
7. Add resource locks after configuration stabilizes.

Exit criteria:

- Production infrastructure is ready before application data cutover.
- No manual portal delta exists outside the human-configuration register.

### Infrastructure Phase 8 — Application/data cutover and stabilization

Coordinate this phase with Phase 9 of the application migration plan.

1. Enable the maintenance/read-only state.
2. Run the approved Firestore export/import/validation workflow.
3. Run the migration job and search rebuild as required.
4. Deploy the compatible API revision and run protected smoke tests.
5. Switch frontend API configuration/traffic.
6. Observe authentication failures, `4xx/5xx`, latency, database connections, Neon CU usage, and cross-tenant security signals.
7. Keep the prior Container App revision and Firestore read-only rollback path for the agreed observation period.
8. After stabilization, deactivate old revisions, revoke one-time migration credentials, apply final locks, and update the infrastructure inventory.

Exit criteria:

- Production traffic uses the API and PostgreSQL exclusively for application data.
- Rollback artifacts remain available for the agreed window.
- One-time credentials are revoked and the final runbook is archived.

## 8. Deployment and rollback sequence

Use expand-and-contract database changes:

1. CI builds/tests/signs an immutable image and migration artifact.
2. Production approval is granted.
3. Run backward-compatible database migration.
4. Deploy a new Container App revision at zero traffic where practical.
5. Run revision smoke tests.
6. Shift traffic gradually or atomically based on change risk.
7. Monitor for a defined interval.
8. Retain the previous revision until the rollback window closes.
9. Remove old columns/behavior in a later release, never in the same release that stops using them.

Application rollback normally means moving traffic to the previous image revision. Do not automatically run EF down-migrations. If a migration is not backward-compatible, it is not eligible for ordinary zero-downtime deployment.

## 9. Cost controls

1. Keep API `minReplicas: 0` until measured user experience requires one warm replica.
2. Cap API maximum replicas and Neon maximum CU; alert before raising either.
3. Use Neon scale-to-zero for acceptance and initial production.
4. Set Azure budget alerts at 50%, 80%, and 100% of the monthly target plus a forecast alert.
5. Limit Application Insights sampling and retention; exclude health checks and known low-value telemetry.
6. Apply ACR retention to untagged images while preserving explicitly promoted rollback digests.
7. Delete temporary Neon branches and acceptance data on schedule.
8. Review Azure and Neon costs monthly for the first six months, then quarterly.

Budgets are alerts, not hard spending caps. Operational owners must respond to them.

## 10. Human-configuration register

Maintain `infrastructure/HUMAN_CONFIGURATION.md` when implementation begins. Each entry must contain:

- System and environment.
- Exact setting and reason it cannot be IaC-managed.
- Date, operator, and reviewer.
- Verification command or screenshot location.
- Rotation/review date.
- Rollback procedure.

The initial register includes Neon billing/DPA/region/project settings, Neon credential bootstrap, GitHub production approvers, Firebase authorized domains, external DNS delegation, and vendor support contacts. Portal changes not represented in Bicep or this register are configuration drift and must be removed or documented.

## 11. Operational readiness checklist

- [ ] Bicep `what-if` is clean and reviewed for every environment.
- [ ] Every AVM reference is pinned to an exact reviewed version.
- [ ] `bicep restore`, lint, build, and the recent-module-version analyzer run in CI.
- [ ] Production deploys the same compiled ARM JSON artifact validated in acceptance.
- [ ] Direct resource declarations have documented AVM-gap exceptions.
- [ ] GitHub deployments use OIDC and protected environments.
- [ ] ACR admin credentials are disabled.
- [ ] Key Vault contains no broadly readable secrets.
- [ ] Runtime and migration database roles are distinct.
- [ ] API image runs non-root and contains no SDK or secrets.
- [ ] API runtime uses pooled PostgreSQL; migrations use direct PostgreSQL.
- [ ] Liveness does not depend on PostgreSQL; readiness has a bounded timeout.
- [ ] Cold start with both compute layers asleep has been measured.
- [ ] Point-in-time restore has been tested.
- [ ] Revision rollback and secret rotation have been tested.
- [ ] Alerts, budgets, retention, and responders are configured.
- [ ] EU regions are confirmed for data, logs, backups, and vendors.
- [ ] Human-only settings are in the configuration register.

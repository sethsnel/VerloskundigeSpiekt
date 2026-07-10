# Phase 5 — Configure DNS, TLS, and clients

## Goal

Expose the API through a stable HTTPS custom domain, restrict browser access to approved origins, and ensure frontend and extension clients know only the environment-specific API URL.

## Starting contract from Phase 4

- A verified API image can be deployed by immutable digest to Container Apps.
- Acceptance ingress is available and health endpoints are defined.
- Production deployment remains protected even if production DNS preparation occurs.
- Firebase, DNS, frontend, and extension owners are known from Phase 0.
- API base-URL and origin changes are coordinated with application Phases 6–7 in the [managed PostgreSQL API migration plan](../managed-postgres-api-migration-plan.md); unfinished clients may use documented temporary acceptance configuration until those phases land.

## Actions

### 1. Select and inventory domain names

- Choose the canonical production `api.<domain>` name and an explicit acceptance hostname that cannot be confused with production.
- Record zone owner, registrar/DNS provider, renewal owner, and environment mapping.
- If Azure DNS owns the zone, manage records with AVM or a justified direct Bicep declaration. Otherwise record the exact human change, operator, reviewer, verification, and rollback in `infrastructure/HUMAN_CONFIGURATION.md`.

### 2. Bind domains and certificates

- Create required ownership-validation and routing records.
- Bind the hostname to the matching Container App.
- Use a Container Apps managed certificate or a Key Vault-managed certificate according to the approved ownership model.
- Stage deployments when validation requires DNS to exist before certificate issuance.
- Ensure the public endpoint redirects or rejects HTTP so API traffic is served only through HTTPS.

### 3. Configure API origin policy

- Define explicit environment-specific CORS allowlists for the production frontend, acceptance frontend, and browser-extension origins.
- Allow only required methods and headers; do not combine credentialed requests with wildcard origins.
- Treat non-browser clients through authentication/authorization rather than assuming CORS is an access-control boundary.
- Verify unknown, malformed, and cross-environment origins are denied.

### 4. Update Firebase and clients

- Add only required custom domains to Firebase authorized domains and record the human configuration.
- Configure frontend environment-specific API base URLs and the browser extension's host permissions/configuration.
- Confirm no Neon hostname, database connection, Key Vault URI intended for servers, or Azure credential appears in frontend/extension build output.
- Keep acceptance clients pointed exclusively at acceptance and production clients exclusively at production.

### 5. Prove certificate operations

- Validate hostname ownership, certificate chain, supported protocol behavior, and expiry monitoring.
- Document automated renewal ownership and alerts.
- Exercise or tabletop the fallback procedure for failed issuance/renewal, including DNS rollback and restoration of the provider hostname when appropriate.

## Validation and evidence

- HTTPS succeeds end to end for each configured environment and certificate hostname validation passes.
- Plain HTTP cannot serve application API traffic.
- Approved origins receive the expected CORS headers; unknown and cross-environment origins do not.
- Frontend and extension builds contain only the API URL, not database endpoints or credentials.
- DNS and certificate ownership, renewal monitoring, human steps, and rollback are recorded.

## End-state and handoff to Phase 6

Phase 5 is complete when acceptance has a stable valid HTTPS API endpoint, client configuration is environment-isolated, unknown origins are denied, and certificate renewal has an owner and fallback. Phase 6 receives:

- the acceptance URL used by smoke, authentication, and extension tests;
- a deployable client configuration that exposes no database details;
- working TLS/CORS/Firebase domain configuration; and
- documented DNS and certificate rollback procedures.

Production DNS may be reserved or staged, but Phase 6 validation must not direct production users to an unvalidated service.

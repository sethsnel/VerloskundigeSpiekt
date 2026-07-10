# Phase 7 — Adapt the browser extension to the stable API

## Goal

Expose only the minimum authorized published-template contract to the extension while ensuring patient-identifiable substitution values remain entirely local.

## Inputs from Phases 5 and 6

- Stable published-template list/detail contracts and definition-only DTOs.
- Firebase bearer-token and Problem Details handling patterns.
- Tested membership revocation and practice authorization behavior.

## Implementation actions

1. Implement extension Firebase authentication and token refresh against the same API validation rules. Define safe reauthentication and failure UX.
2. Expose/use narrowly scoped operations for listing authorized published templates and retrieving one published version. Do not expose drafts or broad content endpoints to the extension workflow.
3. Restrict CORS to exact supported extension origins and add extension-specific conservative rate limits. Document how extension IDs/origins are managed per environment.
4. Perform all substitutions inside the extension. Keep external-system values out of API requests, analytics, telemetry, crash reports, persistent storage, console/browser logs, and search.
5. Review browser permissions and retain only required host and clipboard permissions. Document why each permission is needed and when clipboard data is cleared/not persisted.
6. Add automated tests using obviously synthetic external-system data for authentication, token expiry, template listing/detail, substitution, clipboard handling, revoked membership, removed templates, offline/network failure, and rate limiting.
7. Inspect browser network traffic, storage, logs, telemetry, and crash-report payloads during tests. Add regression assertions where tooling permits.
8. Document supported extension/API version compatibility and safe behavior when a contract is unavailable.

## Deliverables

- Authenticated, API-backed extension template client.
- Local-only substitution pipeline and least-privilege manifest.
- CORS/rate-limit configuration and privacy-focused automated tests.
- Network/storage/telemetry inspection evidence.

## Verification and evidence

- Use synthetic sentinel values and prove they never leave the extension process or persist unexpectedly.
- Verify only published templates for currently authorized practices can be retrieved.
- Remove membership/revoke authentication and confirm access fails safely on the next request.
- Review effective permissions and exact CORS origins in production-shaped builds.

## End state and exit criteria

- No patient-identifiable values reach VerloskundigeSpiekt infrastructure.
- The extension consumes only published, authorized practice templates.
- Authentication expiry and membership revocation fail safely.
- Browser permissions and observable data flows are documented and tested.

## Handoff to Phase 8

Phase 8 receives both production-shaped consumers (web and extension), complete critical workflows, privacy sentinel tests, and representative authentication/rate-limit behavior for security, load, dependency-failure, and operational rehearsal.


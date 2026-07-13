# Browser extension API boundary

The extension receives only published template definitions. External-system/client values are passed to `substituteLocally` and never to `template-client.ts`, analytics, logs, persistent extension storage, or clipboard telemetry. The manifest grants only `clipboardWrite` and the production API origin; update the exact extension origin allowlist in the API configuration when an extension ID is approved.

Authentication uses the same Firebase bearer token accepted by the API. A `401`, `403`, expired token, removed membership, or unpublished template is a safe re-authentication/refresh state, not a fallback to direct Firestore access.

The Manifest V3 service worker authenticates through Firebase's REST endpoints,
keeps access and refresh tokens in `chrome.storage.session` only, refreshes before
expiry, and clears the session after refresh failure or logout. Configure the
non-secret Firebase API key and environment API origin through the popup/service
worker `configure` message when packaging an environment-specific build.

Template substitution walks parsed `text` and `placeholder` segments. External
values never enter API calls, extension storage, logs, or telemetry; the popup
holds them only long enough to write the structurally serialized result to the
clipboard. Quotes, slashes, control characters, and Unicode are escaped by
`JSON.stringify` after substitution.

Compatibility: extension `0.1.x` requires API v1 template definitions with
`version: 1` and the published list/detail routes. Effective permissions are
limited to session/config storage, clipboard write, the exact production API
origin, and Firebase Identity Toolkit/Secure Token hosts. Acceptance packaging
must replace the API origin with the exact environment origin and configure the
matching `chrome-extension://<id>` API CORS origin.

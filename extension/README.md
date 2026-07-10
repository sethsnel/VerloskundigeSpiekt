# Browser extension API boundary

The extension receives only published template definitions. External-system/client values are passed to `substituteLocally` and never to `template-client.ts`, analytics, logs, persistent extension storage, or clipboard telemetry. The manifest grants only `clipboardWrite` and the production API origin; update the exact extension origin allowlist in the API configuration when an extension ID is approved.

Authentication uses the same Firebase bearer token accepted by the API. A `401`, `403`, expired token, removed membership, or unpublished template is a safe re-authentication/refresh state, not a fallback to direct Firestore access.

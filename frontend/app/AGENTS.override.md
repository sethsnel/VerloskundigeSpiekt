# App Router overrides

- Keep route segments isolated in `app/` and prefer server components by default.
- Add `use client` only for components using hooks, state, or browser APIs.
- For API routes under `app/api/**/route.ts`, validate inputs and keep handlers thin; delegate logic to `frontend/lib/**`.
- When adding layout data, fetch it via shared helpers (e.g., `lib/shared/*`) to avoid duplicating queries.

# Lib overrides

- Place server-side logic, data access, and shared helpers here.
- Keep functions small and composable; prefer named exports for clarity.
- Avoid importing client-only modules (e.g., browser APIs) in server utilities.
- When adding a new helper for a route, co-locate it by domain (e.g., `lib/search`, `lib/firestore`).

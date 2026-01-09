# Components overrides

- Favor composition over inheritance; keep components focused on a single responsibility.
- UI primitives belong in `components/ui/`; domain components live in `components/`.
- Keep styling consistent with Tailwind tokens and CSS variables; use SCSS modules only when necessary.
- Avoid adding data fetching or side effects inside reusable components unless explicitly required.

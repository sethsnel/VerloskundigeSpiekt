# AGENTS.md

## Architecture analysis (current frontend)

The frontend lives in `frontend/` and is a **Next.js App Router** application. The top-level layout in `frontend/app/layout.tsx` wires global providers, shared layout, and Vercel analytics, and loads global styles (SCSS + Tailwind). The app is currently configured for **static rendering** (`dynamic = 'force-static'`) and pulls navigation data via a shared server-side helper (`frontend/lib/shared/fetchLayoutProps.ts`).

Content is a mix of **MDX** and data-driven pages. MDX support is enabled in `frontend/next.config.js` with `@next/mdx`, and the home page dynamically imports a channel-specific MDX file based on `NEXT_PUBLIC_CHANNEL`. This enables the same UI shell to serve multiple channels (e.g. “VerloskundigeSpiekt” vs “Recepten”) with different content and labels.

The component system splits into **layout primitives**, **domain components**, and **UI primitives**:
- `frontend/components/layout/` contains layout scaffolding (`DefaultLayout`, menu, content, sidebar trigger).
- `frontend/components/ui/` hosts design-system primitives (Shadcn-style components driven by Tailwind + CSS variables).
- `frontend/components/` contains domain components (buttons, banners, tags, profile, admin).

Styling uses **Tailwind CSS** (via `frontend/app/globals.css`) and **SCSS modules** under `frontend/styles/` for feature-level styling. Global design tokens are defined as CSS variables in `globals.css` and are consumed by Tailwind’s theme layer.

API endpoints live under `frontend/app/api/**/route.ts`, using `NextRequest`/`NextResponse` and delegating to `frontend/lib/**` (e.g., search, Firestore, or service helpers). This keeps route handlers thin and focused on input validation and response shape.

---

## Best practices for AI agents working on this frontend

### 1) Prefer App Router conventions
- Add new pages under `frontend/app/` using `page.tsx`, `layout.tsx`, and route groups when needed.
- Keep `app/layout.tsx` as the single source of global providers, analytics, and styles.

**Example (global layout and shared layout props):**
```tsx
// frontend/app/layout.tsx
export default async function VerloskundigeSpiektApp({ children }: { children: React.ReactNode }) {
  const layoutProps = await fetchLayoutProps()
  return (
    <html lang="nl">
      <body>
        <Providers>
          <DefaultLayout {...layoutProps}>{children}</DefaultLayout>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### 2) Keep data fetching in shared server helpers
- Create focused helpers in `frontend/lib/**` and call them from server components or API routes.
- In layouts/pages, call `async` helpers and keep the component markup clean.

**Example (shared layout props):**
```ts
// frontend/lib/shared/fetchLayoutProps.ts
export default async function fetchLayoutProps(): Promise<DefaultLayoutProps> {
  const menuItems = await getMenuItems()
  return { menuItems }
}
```

### 3) Use `use client` only where needed
- Only add `'use client'` for interactive components or components using hooks/state.
- Keep UI primitives small and composable.

**Example (client-only button wrapper):**
```tsx
// frontend/components/button/button.tsx
'use client'
const VsButton = ({ children, variant, icon, ...rest }: ButtonProps) => {
  return (
    <Button type="button" variant={variant} {...rest}>
      <IconContext.Provider value={{ className: 'iconColor' }}>
        {iconType}
      </IconContext.Provider>
      {children}
    </Button>
  )
}
```

### 4) Follow the channel-based content model
- Respect `NEXT_PUBLIC_CHANNEL` for content and labeling.
- Keep channel labels centralized in `frontend/content/labels.ts`.

**Example (labels and channel guard):**
```ts
// frontend/content/labels.ts
function getChannel(): Channel {
  if (process.env.NEXT_PUBLIC_CHANNEL !== 'Recepten' && process.env.NEXT_PUBLIC_CHANNEL !== 'VerloskundigeSpiekt') {
    throw new Error(`Invalid channel: ${process.env.NEXT_PUBLIC_CHANNEL}`)
  }
  return process.env.NEXT_PUBLIC_CHANNEL
}
```

### 5) Keep API routes thin and validate input
- Validate request bodies at the route boundary.
- Delegate logic to `frontend/lib/**` functions and return consistent JSON responses.

**Example (API route with validation + lib call):**
```ts
// frontend/app/api/search/search/route.ts
export async function POST(request: NextRequest) {
  const { query, skip, pageSize } = await request.json()
  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }
  const searchResults = await searchNotes(query, { skip: skip ?? 0, top: pageSize ?? 10, includeFacets: true })
  return NextResponse.json(searchResults)
}
```

### 6) Use Tailwind tokens + SCSS modules appropriately
- Prefer Tailwind utility classes for layout and spacing.
- Use SCSS modules under `frontend/styles/` for feature-specific styling or legacy styles.
- Respect design tokens defined in `frontend/app/globals.css`.

**Example (CSS variables feeding Tailwind theme):**
```css
/* frontend/app/globals.css */
:root {
  --background-color: #f7f2ec;
  --link-color: #2d3f4e;
}
@theme inline {
  --color-link: var(--link-color);
}
```

### 7) MDX content should stay isolated
- MDX lives in `frontend/content/`.
- The home page resolves the proper MDX via dynamic import and environment channel.

**Example (dynamic MDX selection):**
```tsx
// frontend/app/page.tsx
const mdxMap: Record<string, any> = {
  VerloskundigeSpiekt: dynamic(() => import('../content/verloskundigespiekt.mdx')),
  Recepten: dynamic(() => import('../content/recepten.mdx')),
}
```

---

## Implementation checklist for new work

- [ ] Identify whether the work belongs in `app/`, `components/`, or `lib/`.
- [ ] Keep server-only logic in `lib/` and call it from server components or API routes.
- [ ] Add `'use client'` only when necessary (hooks, state, or DOM APIs).
- [ ] Follow Tailwind + CSS variable tokens for styling.
- [ ] If adding new routes, validate inputs at the route level and return JSON.
- [ ] Keep MDX content in `frontend/content/` and update labels in `frontend/content/labels.ts` if needed.

## When unsure

Search for existing patterns in these files first:
- `frontend/app/layout.tsx`
- `frontend/app/page.tsx`
- `frontend/components/layout/default/default-layout.tsx`
- `frontend/components/ui/*`
- `frontend/lib/shared/fetchLayoutProps.ts`
- `frontend/app/api/*/route.ts`


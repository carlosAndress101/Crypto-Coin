# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (`pnpm-lock.yaml` + `pnpm-workspace.yaml`, which pins `allowBuilds` for `@swc/core`/`esbuild`).

```bash
pnpm install
pnpm dev            # Vite dev server
pnpm build          # production build to dist/
pnpm preview        # serve the built output

pnpm typecheck      # tsc --noEmit
pnpm lint           # oxlint
pnpm lint:fix       # oxlint --fix
pnpm format         # oxfmt .
pnpm format:check   # oxfmt --check .
pnpm contrast       # WCAG check over the design tokens
pnpm smoke          # 45 end-to-end checks in Chromium (alias: pnpm test:e2e)
pnpm icons          # regenerate brand PNGs from public/favicon.svg

pnpm check          # typecheck + lint + format:check + contrast
pnpm validate       # check + build + smoke
pnpm verify         # validate + pnpm audit --prod
```

`pnpm validate` passes clean on `HEAD`. If it fails, your change caused it.

**There is no unit test runner.** No Vitest, no RTL, no MSW. `pnpm smoke` is a single
Playwright script (`scripts/smoke.mjs`) that drives the production build with every
CoinGecko call intercepted. To run one check, comment out the other blocks — they are
plain `{ }` blocks in one file, numbered in comments.

## Architecture

Vite 8 (Rolldown) + React 19 + TypeScript 7 strict + TanStack Router + TanStack Query +
Tailwind 4 (CSS-first) + Recharts 3. All data comes from the public CoinGecko v3 API — no
backend, no API key, no auth. **`ARCHITECTURE.md` is the detailed and current reference;
read it before any structural change.** The essentials:

### The one table that matters

| State                                                   | Owner                                |
| ------------------------------------------------------- | ------------------------------------ |
| Server data                                             | TanStack Query                       |
| Filters (`currency`, `sort`, `page`, `perPage`, `coin`) | URL search params                    |
| Which coin dialog is open                               | URL path param `/{coinId}`           |
| Watchlist                                               | `WatchlistProvider` + `localStorage` |
| Form drafts, search text, chart metric/range            | local `useState`                     |

Do not add a Context for anything that fits one of the first three rows.

### Routing

`src/app/routes.tsx` holds the whole tree, code-based (no file-based routing, no
`routeTree.gen.ts`, no router plugin). Six URLs: `/`, `/trending`, `/saved`, and
`/{coinId}` under each of the three.

The load-bearing detail is the **pathless layout route `_markets`** (declared with `id`,
not `path`). It renders `MarketsPage` once and is mounted for both `/` and `/{coinId}`, so
opening the detail dialog does **not** unmount the list or refetch the market. There is a
smoke check that counts requests to prove it; if you restructure the tree, keep it green.

Adding a new list page means: a route with its own `<Outlet/>`, plus a `$coinId` child that
renders `<CoinDetailsDialog coinId={…} closeTo="/your-page" />`. `closeTo` is a prop because
the same dialog hangs off three parents.

`NotFound` only fires for URLs of two or more segments — `/asdf` matches `/$coinId` and
surfaces as the dialog's "coin not found". That is deliberate, not a bug to fix.

### Search params

Schemas live in `src/app/search.ts` (currency, on the root route) and
`src/features/markets/useMarketsFilters.ts` (the rest, on `_markets`).

Two rules when touching them:

1. **Every field needs `.catch()`.** These values are arbitrary user input on first paint.
   A throwing `validateSearch` renders the router's error boundary instead of the app.
2. The root route's middlewares are ordered `retainSearchParams` **then**
   `stripSearchParams`. Reversed, defaults get stripped before the retained value merges in.

`useMarketsFilters()` is the only sanctioned way to read or write these. It concentrates the
clamps and the "changing any filter resets to page 1" invariant; do not scatter
`navigate({ search })` calls into components.

### Data fetching

`src/lib/coingecko.ts` is the only place a `fetch` exists. It owns the base URL, a 15 s
timeout combined with Query's signal via `AbortSignal.any`, `ApiError` normalisation
(`isRateLimit` / `isTimeout` / `isOffline` plus a `userMessage` getter), and Zod parsing.

Fetching stays in components via `useQuery` — **not** in route loaders. A loader cannot
distinguish a 429 from an empty list, and that distinction (`components/QueryState.tsx`) is
what fixed the app's original infinite spinner. `queryClient.ts` never retries a 429 or any
4xx.

### Conventions worth matching

- Components branch through `<QueryState>`, which takes `isPending`, `error`, `isEmpty` and
  `onRetry`. Do not hand-roll `data ? … : <Spinner/>`.
- The detail dialog is a native `<dialog>` + `showModal()`, portalled into the `#model` div
  in `index.html`. Focus trap, Escape and `aria-modal` come free; do not reimplement them.
  The backdrop-click handler is attached in a `useEffect`, not as a JSX `onClick`, because
  oxlint correctly flags a mouse handler on a non-interactive element.
- Form drafts are extracted into subcomponents mounted with `key={committedValue}`
  (`CurrencyField`, `PerPageField`). That is what keeps them in sync when the browser Back
  button changes the URL.
- Colours come from semantic tokens in `src/styles/theme.css` (`bg-surface-raised`, never
  `bg-neutral-800`). `pnpm contrast` reads that file directly, so it cannot drift.
- Only `sm`, `lg` and a custom `xs` (30rem) breakpoint are in use.
- Brand assets: `src/components/BrandMark.tsx` is the SVG mark using theme tokens;
  `public/favicon.svg` is the same drawing with raw hex. Change both together, then run
  `pnpm icons`.

## Deployment

Target is Cloudflare Pages. **Not yet configured** — there is no `_headers`, no
`_redirects` and no CI workflow. `.env.production` carries a **placeholder**
`VITE_SITE_URL` that must be changed to the real domain before the first deploy.

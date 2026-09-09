# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (`pnpm-lock.yaml` + `pnpm-workspace.yaml`, which pins `allowBuilds` for `@swc/core`/`esbuild`).

```bash
pnpm install
pnpm dev       # Vite dev server
pnpm build     # production build to dist/
pnpm preview   # serve the built output
pnpm lint      # eslint src --ext js,jsx --max-warnings 0
```

There is no test setup (no runner, no test files) and no TypeScript — everything is plain `.jsx`.

`pnpm lint` currently **fails** on pre-existing issues: 2 `react/prop-types` errors in `src/components/Chart.jsx` (`CustomTooltip`'s destructured `payload`, not covered by the disable comment on the enclosing function line) plus 6 warnings that `--max-warnings 0` promotes to failures (`react-refresh/only-export-components` in the three context files, `react-hooks/exhaustive-deps` in `StorageContext.jsx` and `CryptoDetails.jsx`). Don't assume a lint failure was caused by your change — diff against the baseline above.

## Architecture

Vite + React 18 SPA, React Router v6, Tailwind, Recharts. All data comes from the public CoinGecko v3 API — no backend, no API key, no auth, no client-side cache.

### Routing and the detail modal

`src/main.jsx` defines the whole route tree. `Home` is the layout route (providers + logo + nav + `<Outlet/>`); its three children are the pages `Crypto` (`/`), `Trending` (`/trending`), `Saved` (`/saved`). Each of those **repeats the same `:coinId` child route rendering `CryptoDetails`** — that is how the coin detail popup appears over whichever list you're on. Adding a new list page means duplicating that child route, and the page must render its own `<Outlet/>`.

`CryptoDetails` is not rendered inline: it `ReactDOM.createPortal`s into the `#model` div declared in `index.html` (alongside `#root`). Clicking the backdrop calls `navigate("..")` to close.

### Context layering (order matters)

`src/pages/Home.jsx` nests `CryptoProvider > TrendingProvider > StorageProvider`. `StorageContext` consumes `CryptoContext` for `currency`/`sortBy`, so it must stay inside `CryptoProvider`.

- **`CryptoContext`** — the market table's state and the only place the `/coins/markets` list is fetched. A `useLayoutEffect` refetches whenever any of `[coinSearch, currency, sortBy, page, perPage]` changes, so any new filter control just sets state here rather than calling fetch itself. It also owns `getCoinData(coinId)` (the detail-modal payload) and `getSearchResult(query)`. `totalPage` is hardcoded to `13220`; the `/coins/list` call that derived it is commented out.
- **`TrendingContext`** — one fetch of `/search/trending` on mount, plus `resetTrendingResult` to refetch.
- **`StorageContext`** — the saved/favourites list. Source of truth is `localStorage` under the key `"coins"`, holding an array of coin ids; `allCoins` mirrors it and a `useEffect` on `allCoins` refetches `savedData` from `/coins/markets`.

### Conventions worth matching

- **Loading state is "the data is `undefined`"**. Setters are deliberately called with no argument (`setCryptoData()`, `setCoinData()`) before a fetch, and components branch on `data ? <table/> : <spinner/>`. A CoinGecko rate-limit (429) therefore surfaces as a permanent spinner or empty list, not an error — check the network tab before chasing a state bug.
- **Fetches are inline `fetch` + `try/catch` + `console.error`**, colocated with whoever needs them. `Chart.jsx` fetches its own `/market_chart` data and hardcodes `vs_currency=usd`, ignoring the `currency` context.
- Search debounces through `lodash.debounce` at 2000ms; picking a suggestion sets `coinSearch`, which becomes the `ids=` param on the markets request.
- **`prop-types` is not installed.** Components opt out with `/* eslint-disable react/prop-types */` at the top of the file or a `// eslint-disable-next-line` above the component. Follow that pattern rather than adding the dependency.
- `SaveBtn` (the star toggle) is duplicated verbatim in `TableComponent.jsx` and `Saved.jsx`; changing one means changing both.
- Filenames keep their original spellings — `Fillters.jsx`, `Navegation.jsx` — keep imports matching.

### Tailwind

`tailwind.config.js` defines `colors` and `fontSize` **at the theme root, not under `extend`**, which replaces Tailwind's defaults entirely. The only colors available are `gray-100/200/300`, `white`, `cyan` (`#14ffec`, the accent), `red`, `green`; the only sizes are `sm/base/md/lg/xl`. Anything else (`bg-blue-500`, `text-2xl`) silently produces no class — add it to the config first. `screens` is not overridden, so breakpoints are the defaults; note `xs:` appears in `Crypto.jsx` but is not a defined breakpoint. `tailwind-scrollbar` supplies the `scrollbar-*` utilities.

import {
  createRootRoute,
  createRoute,
  createRouter,
  retainSearchParams,
  stripSearchParams,
} from "@tanstack/react-router";
import RootLayout from "@/app/RootLayout";
import MarketsPage from "@/features/markets/MarketsPage";
import TrendingPage from "@/features/trending/TrendingPage";
import SavedPage from "@/features/saved/SavedPage";
import CoinDetailsDialog from "@/features/coin-details/CoinDetailsDialog";
import { NotFound } from "@/components/NotFound";
import { ROOT_SEARCH_DEFAULTS, rootSearchSchema } from "@/app/search";
import { MARKETS_SEARCH_DEFAULTS, marketsSearchSchema } from "@/features/markets/useMarketsFilters";

/**
 * Árbol de rutas.
 *
 * Se define en código y no con file-based routing a propósito. Con seis URLs, el árbol
 * cabe en una pantalla y se lee de un vistazo; file-based obligaría a `routeTree.gen.ts`,
 * que hay que excluir de oxlint, de oxfmt y de lint-staged, y a `@tanstack/router-plugin`,
 * cuyo `autoCodeSplitting` reintroduce Babel justo donde este proyecto eligió SWC.
 *
 * No se declara `context` en el router: no hay loaders, así que nadie necesitaría el
 * QueryClient ahí. Los datos siguen pidiéndose con `useQuery` dentro de los componentes,
 * porque un loader no sabe distinguir "429" de "lista vacía" y ese estado explícito
 * (ver components/QueryState.tsx) es justo lo que arregló el spinner eterno.
 */

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
  validateSearch: rootSearchSchema,
  /*
   * El orden importa. `retainSearchParams` va primero porque TanStack Router DESCARTA los
   * search params al cambiar de ruta (al revés que react-router): sin él, cada enlace del
   * menú resetearía la divisa en silencio. `stripSearchParams` va después para que el
   * valor por defecto no ensucie la URL — así `/` sigue siendo `/` y los enlaces que ya
   * existían por ahí siguen funcionando igual. Invertidos, se quitaría el default antes
   * de haber fusionado el valor retenido.
   */
  search: {
    middlewares: [retainSearchParams(["currency"]), stripSearchParams(ROOT_SEARCH_DEFAULTS)],
  },
});

/**
 * Ruta layout SIN path (se declara con `id`, no con `path`).
 *
 * Es la pieza que sostiene el patrón "modal encima de la lista". Antes `MarketsPage`
 * aparecía dos veces en el árbol —una para `/` y otra para `/:coinId`— y esa duplicación
 * costó un fallo real: el hijo `:coinId` bajo un padre `:coinId` produce `/:coinId/:coinId`
 * y nunca emparejaba. Con el layout sin path, `MarketsPage` se declara una sola vez y
 * queda montada tanto en `/` como en `/{coinId}`, así que abrir el detalle no desmonta
 * la lista ni vuelve a pedirla.
 */
const marketsLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_markets",
  component: MarketsPage,
  validateSearch: marketsSearchSchema,
  search: { middlewares: [stripSearchParams(MARKETS_SEARCH_DEFAULTS)] },
});

const marketsIndexRoute = createRoute({
  getParentRoute: () => marketsLayoutRoute,
  path: "/",
});

const marketsDetailRoute = createRoute({
  getParentRoute: () => marketsLayoutRoute,
  path: "$coinId",
  component: function MarketsCoinDetails() {
    const { coinId } = marketsDetailRoute.useParams();
    return <CoinDetailsDialog coinId={coinId} closeTo="/" />;
  },
});

const trendingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "trending",
  component: TrendingPage,
});

const trendingIndexRoute = createRoute({
  getParentRoute: () => trendingRoute,
  path: "/",
});

const trendingDetailRoute = createRoute({
  getParentRoute: () => trendingRoute,
  path: "$coinId",
  component: function TrendingCoinDetails() {
    const { coinId } = trendingDetailRoute.useParams();
    return <CoinDetailsDialog coinId={coinId} closeTo="/trending" />;
  },
});

const savedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "saved",
  component: SavedPage,
});

const savedIndexRoute = createRoute({
  getParentRoute: () => savedRoute,
  path: "/",
});

const savedDetailRoute = createRoute({
  getParentRoute: () => savedRoute,
  path: "$coinId",
  component: function SavedCoinDetails() {
    const { coinId } = savedDetailRoute.useParams();
    return <CoinDetailsDialog coinId={coinId} closeTo="/saved" />;
  },
});

const routeTree = rootRoute.addChildren([
  marketsLayoutRoute.addChildren([marketsIndexRoute, marketsDetailRoute]),
  trendingRoute.addChildren([trendingIndexRoute, trendingDetailRoute]),
  savedRoute.addChildren([savedIndexRoute, savedDetailRoute]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

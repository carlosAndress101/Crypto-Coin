import { createLazyRoute, useParams } from "@tanstack/react-router";
import CoinDetailsDialog from "@/features/coin-details/CoinDetailsDialog";

/**
 * Las tres rutas de detalle, en un módulo aparte para que se carguen bajo demanda.
 *
 * Están juntas a propósito: son tres envoltorios de una línea sobre el mismo diálogo, así
 * que el empaquetador emite un único chunk que se descarga la primera vez que se abre una
 * moneda, venga de la lista que venga. Separarlas en tres archivos produciría tres chunks
 * con el mismo contenido.
 *
 * Cada una lee su propio `coinId` con el id de SU ruta, así que el parámetro llega tipado
 * como `string` en vez de `string | undefined`.
 */

export const MarketsDetailRoute = createLazyRoute("/_markets/$coinId")({
  component: function MarketsCoinDetails() {
    const { coinId } = useParams({ from: "/_markets/$coinId" });
    return <CoinDetailsDialog coinId={coinId} closeTo="/" />;
  },
});

export const TrendingDetailRoute = createLazyRoute("/trending/$coinId")({
  component: function TrendingCoinDetails() {
    const { coinId } = useParams({ from: "/trending/$coinId" });
    return <CoinDetailsDialog coinId={coinId} closeTo="/trending" />;
  },
});

export const SavedDetailRoute = createLazyRoute("/saved/$coinId")({
  component: function SavedCoinDetails() {
    const { coinId } = useParams({ from: "/saved/$coinId" });
    return <CoinDetailsDialog coinId={coinId} closeTo="/saved" />;
  },
});

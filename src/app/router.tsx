import { createBrowserRouter } from "react-router";
import RootLayout from "@/app/RootLayout";
import MarketsPage from "@/features/markets/MarketsPage";
import TrendingPage from "@/features/trending/TrendingPage";
import SavedPage from "@/features/saved/SavedPage";
import CoinDetailsDialog from "@/features/coin-details/CoinDetailsDialog";

/**
 * La ruta hija `:coinId` se repite bajo las tres vistas de lista a propósito: es lo
 * que permite abrir el modal de detalle encima de cualquiera de ellas conservando la
 * lista de fondo. Declararla una sola vez en la raíz desmontaría la lista al abrirlo.
 */
const detailRoute = { path: ":coinId", Component: CoinDetailsDialog } as const;

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: MarketsPage },
      { path: "trending", Component: TrendingPage, children: [detailRoute] },
      { path: "saved", Component: SavedPage, children: [detailRoute] },
      /*
       * El detalle desde la vista de mercado cuelga de la raíz para que la URL sea
       * /bitcoin y no /markets/bitcoin, igual que antes.
       *
       * Aquí el hijo es un `index`, no otro `:coinId`: el padre ya consumió el
       * segmento, así que repetirlo produciría la ruta /:coinId/:coinId y el modal
       * no llegaría a montarse nunca. `useParams` recoge igualmente el coinId del
       * padre, porque mezcla los parámetros de todas las rutas emparejadas.
       */
      {
        path: ":coinId",
        Component: MarketsPage,
        children: [{ index: true, Component: CoinDetailsDialog }],
      },
    ],
  },
]);

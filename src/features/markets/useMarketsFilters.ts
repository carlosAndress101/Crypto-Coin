import { z } from "zod";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCurrency } from "@/app/search";
import { normalizeCurrency } from "@/lib/format";
import { SORT_OPTIONS } from "@/types/coingecko";
import type { SortOption } from "@/types/coingecko";

const SORT_VALUES = SORT_OPTIONS.map((option) => option.value) as [SortOption, ...SortOption[]];

export const MARKETS_SEARCH_DEFAULTS = {
  sort: "market_cap_desc",
  page: 1,
  perPage: 10,
} as const;

/**
 * Search params de la vista de mercado.
 *
 * Los clamps que antes vivían en los setters del provider están ahora en el esquema, así
 * que se aplican también a lo que venga escrito en la URL, no solo a lo que se teclee en
 * el formulario: `?perPage=99999` se limita a 250 igual que el input.
 *
 * `coin` es el filtro del buscador, el que acaba como `ids=` en la petición. Se llama así
 * y no `coinId` porque `coinId` ya es el parámetro de ruta que abre el diálogo: antes eran
 * dos cosas distintas con el mismo nombre y sin sincronizar, y mantenerlo produciría
 * URLs como `/{coinId}?coinId=…`.
 */
export const marketsSearchSchema = z.object({
  sort: z
    .enum(SORT_VALUES)
    .default(MARKETS_SEARCH_DEFAULTS.sort)
    .catch(MARKETS_SEARCH_DEFAULTS.sort),
  page: z.coerce
    .number()
    .default(MARKETS_SEARCH_DEFAULTS.page)
    .catch(MARKETS_SEARCH_DEFAULTS.page)
    .transform((value) => Math.max(1, Math.trunc(value))),
  perPage: z.coerce
    .number()
    .default(MARKETS_SEARCH_DEFAULTS.perPage)
    .catch(MARKETS_SEARCH_DEFAULTS.perPage)
    .transform((value) => Math.min(250, Math.max(1, Math.trunc(value)))),
  coin: z.string().optional().catch(undefined),
});

export interface MarketsFilters {
  currency: string;
  sortBy: SortOption;
  page: number;
  perPage: number;
  coinId: string | undefined;
  setCurrency: (value: string) => void;
  setSortBy: (value: SortOption) => void;
  setPage: (value: number) => void;
  setPerPage: (value: number) => void;
  selectCoin: (id: string | undefined) => void;
  reset: () => void;
}

/**
 * Reemplaza al antiguo `MarketsProvider`, con la misma forma exacta, respaldado por la URL.
 *
 * Se conserva como un módulo único en vez de repartir `navigate({ search })` por los cinco
 * componentes que lo consumen, porque aquí viven dos reglas que se disolverían al
 * repartirlas: los clamps y, sobre todo, la invariante "cambiar cualquier filtro vuelve a
 * la página 1" —quedarse en la página 40 de una lista reordenada muestra resultados sin
 * relación con lo que se pidió—.
 *
 * Política de historial: `replace` para divisa, orden, tamaño de página y filtro del
 * buscador; `push` solo para la página. Sin esto, cada "Apply" y cada "Next" dejaría una
 * entrada y salir de la aplicación con el botón Atrás costaría una docena de pulsaciones.
 * Con esto, Atrás deshace exactamente lo que el usuario entiende por "ir atrás".
 */
export function useMarketsFilters(): MarketsFilters {
  const currency = useCurrency();
  const { sort, page, perPage, coin } = useSearch({ from: "/_markets" });
  const navigate = useNavigate();

  return {
    currency,
    sortBy: sort,
    page,
    perPage,
    coinId: coin,

    setCurrency: (value) => {
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, currency: normalizeCurrency(value), page: 1 }),
        replace: true,
      });
    },

    setSortBy: (value) => {
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, sort: value, page: 1 }),
        replace: true,
      });
    },

    setPerPage: (value) => {
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, perPage: value, page: 1 }),
        replace: true,
      });
    },

    setPage: (value) => {
      void navigate({ to: ".", search: (prev) => ({ ...prev, page: value }) });
    },

    selectCoin: (id) => {
      void navigate({ to: ".", search: (prev) => ({ ...prev, coin: id, page: 1 }), replace: true });
    },

    reset: () => {
      void navigate({ to: "/", search: { ...ROOT_AND_MARKETS_DEFAULTS }, replace: true });
    },
  };
}

const ROOT_AND_MARKETS_DEFAULTS = {
  currency: "usd",
  ...MARKETS_SEARCH_DEFAULTS,
} as const;

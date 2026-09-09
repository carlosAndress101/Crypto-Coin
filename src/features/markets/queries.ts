import { useQuery } from "@tanstack/react-query";
import { coingecko } from "@/lib/coingecko";
import type { MarketsParams } from "@/lib/coingecko";

/**
 * Claves de query. Centralizarlas evita el error clásico de escribir la clave a mano
 * en dos sitios con una diferencia mínima y acabar con dos entradas de caché para
 * los mismos datos.
 */
export const marketKeys = {
  all: ["markets"] as const,
  list: (params: MarketsParams) => [...marketKeys.all, "list", params] as const,
  search: (query: string) => [...marketKeys.all, "search", query] as const,
};

export function useMarkets(params: MarketsParams) {
  return useQuery({
    queryKey: marketKeys.list(params),
    queryFn: ({ signal }) => coingecko.markets(params, signal),
    /* Mantiene visible la página anterior mientras carga la siguiente, en vez de
       parpadear a un spinner con cada clic de paginación. */
    placeholderData: (previous) => previous,
  });
}

export function useCoinSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: marketKeys.search(trimmed),
    queryFn: ({ signal }) => coingecko.search(trimmed, signal),
    // Sin texto no hay petición: evita quemar cuota con el input vacío.
    enabled: trimmed.length > 0,
    staleTime: 5 * 60_000,
  });
}

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DEFAULT_CURRENCY, normalizeCurrency } from "@/lib/format";
import type { SortOption } from "@/types/coingecko";

interface MarketsFilters {
  currency: string;
  sortBy: SortOption;
  page: number;
  perPage: number;
  coinId: string | undefined;
}

interface MarketsValue extends MarketsFilters {
  setCurrency: (value: string) => void;
  setSortBy: (value: SortOption) => void;
  setPage: (value: number) => void;
  setPerPage: (value: number) => void;
  selectCoin: (id: string | undefined) => void;
  reset: () => void;
}

const DEFAULTS: MarketsFilters = {
  currency: DEFAULT_CURRENCY,
  sortBy: "market_cap_desc",
  page: 1,
  perPage: 10,
  coinId: undefined,
};

const MarketsContext = createContext<MarketsValue | null>(null);

/**
 * Estado de **interfaz** de la vista de mercado: divisa, orden, página, tamaño de página
 * y moneda seleccionada por el buscador.
 *
 * A diferencia del CryptoContext original, aquí no se hace ningún `fetch`. Esto es
 * estado de UI; el estado de servidor es de TanStack Query. Separarlos es lo que
 * permite que la caché y los reintentos funcionen: antes el efecto que redisparaba
 * la petición vivía dentro del propio contexto y no había forma de cachear nada.
 */
export function MarketsProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<MarketsFilters>(DEFAULTS);

  /* Cambiar cualquier filtro vuelve a la página 1: quedarse en la página 40 tras
     cambiar el orden mostraba resultados sin relación con lo que el usuario pidió. */
  const setCurrency = useCallback((value: string) => {
    setFilters((f) => ({ ...f, currency: normalizeCurrency(value), page: 1 }));
  }, []);

  const setSortBy = useCallback((value: SortOption) => {
    setFilters((f) => ({ ...f, sortBy: value, page: 1 }));
  }, []);

  const setPerPage = useCallback((value: number) => {
    const clamped = Math.min(250, Math.max(1, Math.trunc(value)));
    setFilters((f) => ({ ...f, perPage: clamped, page: 1 }));
  }, []);

  const setPage = useCallback((value: number) => {
    setFilters((f) => ({ ...f, page: Math.max(1, Math.trunc(value)) }));
  }, []);

  const selectCoin = useCallback((id: string | undefined) => {
    setFilters((f) => ({ ...f, coinId: id, page: 1 }));
  }, []);

  const reset = useCallback(() => {
    setFilters(DEFAULTS);
  }, []);

  const value = useMemo<MarketsValue>(
    () => ({
      ...filters,
      setCurrency,
      setSortBy,
      setPage,
      setPerPage,
      selectCoin,
      reset,
    }),
    [filters, setCurrency, setSortBy, setPage, setPerPage, selectCoin, reset],
  );

  return <MarketsContext value={value}>{children}</MarketsContext>;
}

export function useMarketsFilters(): MarketsValue {
  const context = useContext(MarketsContext);
  if (!context) {
    throw new Error("useMarketsFilters must be used inside a MarketsProvider");
  }
  return context;
}

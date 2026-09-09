import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { readWatchlist, writeWatchlist } from "@/lib/watchlist";

interface WatchlistValue {
  ids: readonly string[];
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
}

const WatchlistContext = createContext<WatchlistValue | null>(null);

/**
 * Estado de la lista de guardados, compartido entre la tabla de mercado y la vista
 * de guardados. Vive por encima de las features porque las dos lo necesitan y una
 * feature no debe importar de otra (ver ARCHITECTURE.md → propiedad de carpetas).
 *
 * `localStorage` es la fuente de verdad y el estado de React su proyección; se
 * inicializa de forma perezosa para leer el almacenamiento una sola vez, no en cada render.
 */
export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<readonly string[]>(readWatchlist);

  const toggle = useCallback((id: string) => {
    setIds((current) => {
      // Un único camino de decisión. El original llamaba a saveCoin() y volvía a
      // llamarlo dentro del else, así que guardaba dos veces al añadir.
      const next = current.includes(id)
        ? current.filter((saved) => saved !== id)
        : [...current, id];
      writeWatchlist(next);
      return next;
    });
  }, []);

  const value = useMemo<WatchlistValue>(
    () => ({
      ids,
      isSaved: (id: string) => ids.includes(id),
      toggle,
    }),
    // Memoizado: sin esto el objeto se reconstruye en cada render y obliga a
    // re-renderizar a todos los consumidores (hallazgo ARCH-01 de la auditoría).
    [ids, toggle],
  );

  return <WatchlistContext value={value}>{children}</WatchlistContext>;
}

export function useWatchlist(): WatchlistValue {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used inside a WatchlistProvider");
  }
  return context;
}

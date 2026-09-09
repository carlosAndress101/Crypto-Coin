import { useId, useState } from "react";
import { useMarketsFilters } from "@/features/markets/MarketsProvider";

interface PaginationProps {
  /** Filas devueltas por la página actual: así se sabe si hay una siguiente. */
  resultCount: number;
  isFetching: boolean;
}

/**
 * Paginación por cursor.
 *
 * La versión anterior calculaba el total de páginas a partir de `setTotalPage(13220)`,
 * un número escrito a mano (la llamada a `/coins/list` que lo derivaba estaba
 * comentada). De ahí salían un "saltar a la última página" que apuntaba a una página
 * inventada y un `multiStepPrev` que hacía `setPage(TotalNumber + 1)`, es decir,
 * retroceder te mandaba más allá del final.
 *
 * CoinGecko no devuelve un total en `/coins/markets`, así que en vez de inventarlo se
 * deduce lo único que se puede saber de verdad: si la página vino llena, hay siguiente.
 */
export function Pagination({ resultCount, isFetching }: PaginationProps) {
  const { page, perPage, setPage, setPerPage } = useMarketsFilters();
  const [draft, setDraft] = useState(String(perPage));
  const perPageId = useId();

  const hasNext = resultCount === perPage;
  const hasPrevious = page > 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = Number(draft);
          if (Number.isFinite(parsed) && parsed >= 1) setPerPage(parsed);
        }}
      >
        <label htmlFor={perPageId} className="font-bold">
          Per page:
        </label>
        <input
          id={perPageId}
          type="number"
          min={1}
          max={250}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="w-20 rounded border border-transparent bg-surface-control px-2 py-1 text-fg outline-0 focus:border-accent"
        />
        <button
          type="submit"
          className="rounded bg-surface-control px-3 py-1 font-semibold transition-colors hover:text-accent"
        >
          Apply
        </button>
      </form>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPage(page - 1)}
          disabled={!hasPrevious || isFetching}
          className="rounded bg-surface-control px-3 py-1 transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {/* aria-live: al paginar con teclado, el número de página cambia sin mover el
            foco, así que hay que anunciarlo explícitamente. */}
        <span aria-live="polite" className="min-w-24 text-center">
          Page {page}
        </span>

        <button
          type="button"
          onClick={() => setPage(page + 1)}
          disabled={!hasNext || isFetching}
          className="rounded bg-surface-control px-3 py-1 transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

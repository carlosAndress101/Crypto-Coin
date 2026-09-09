import { Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CoinTable } from "@/components/CoinTable";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryState } from "@/components/QueryState";
import { RefreshButton } from "@/components/RefreshButton";
import { useWatchlist } from "@/app/WatchlistProvider";
import { useMarketsFilters } from "@/features/markets/MarketsProvider";
import { coingecko } from "@/lib/coingecko";

export default function SavedPage() {
  const { ids } = useWatchlist();
  const { currency } = useMarketsFilters();

  const query = useQuery({
    queryKey: ["saved", ids, currency],
    queryFn: ({ signal }) => coingecko.marketsByIds(ids, currency, signal),
    // Sin monedas guardadas no hay nada que pedir: la lista vacía no es un error.
    enabled: ids.length > 0,
  });

  const coins = query.data ?? [];
  const hasNothingSaved = ids.length === 0;

  return (
    <section className="relative mt-8 mb-24 flex h-full w-[90%] flex-col gap-4 xs:w-[80%] lg:mt-16">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Your watchlist</h1>
        {!hasNothingSaved && (
          <RefreshButton
            onRefresh={() => void query.refetch()}
            label="Refresh watchlist"
            busy={query.isFetching}
          />
        )}
      </div>

      {hasNothingSaved ? (
        /* Estado vacío propio, distinto de "cargando" y de "error": la versión
           anterior mostraba el mismo mensaje para lista vacía y para fallo de red. */
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 rounded border border-line-strong px-4 text-center">
          <p className="text-md font-semibold text-accent">Your watchlist is empty.</p>
          <p className="text-fg-muted">
            Tap the star next to any coin to keep an eye on it. It stays in this browser.
          </p>
        </div>
      ) : (
        <ErrorBoundary area="watchlist">
          <QueryState
            isPending={query.isPending}
            error={query.error}
            isEmpty={coins.length === 0}
            onRetry={() => void query.refetch()}
            loadingLabel="Loading your watchlist…"
            emptyMessage="We could not load data for your saved coins."
          >
            <CoinTable
              coins={coins}
              currency={currency}
              caption="Your saved coins"
              detailTo="/saved/$coinId"
            />
          </QueryState>
        </ErrorBoundary>
      )}

      <Outlet />
    </section>
  );
}

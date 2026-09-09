import { Outlet } from "@tanstack/react-router";
import { CoinTable, coinTableHeight } from "@/components/CoinTable";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryState } from "@/components/QueryState";
import { Filters } from "@/features/markets/Filters";
import { Pagination } from "@/features/markets/Pagination";
import { useMarketsFilters } from "@/features/markets/useMarketsFilters";
import { useMarkets } from "@/features/markets/queries";

export default function MarketsPage() {
  const { currency, sortBy, page, perPage, coinId } = useMarketsFilters();
  const query = useMarkets({ currency, sortBy, page, perPage, coinId });
  const coins = query.data ?? [];

  return (
    <section className="relative mt-8 mb-24 flex h-full w-[90%] flex-col gap-6 xs:w-[80%] lg:mt-16">
      <Filters onRefresh={() => void query.refetch()} isFetching={query.isFetching} />

      {/* El hueco se reserva SOLO mientras carga: si se dejara puesto, una última página
          con menos filas de las pedidas arrastraría un relleno vacío debajo. */}
      <div style={query.isPending ? { minHeight: coinTableHeight(perPage) } : undefined}>
        <ErrorBoundary area="market table">
          <QueryState
            isPending={query.isPending}
            error={query.error}
            isEmpty={coins.length === 0}
            onRetry={() => void query.refetch()}
            loadingLabel="Loading market data…"
            emptyMessage="No coins matched these filters."
          >
            <CoinTable
              coins={coins}
              currency={currency}
              caption="Cryptocurrency market data"
              detailTo="/$coinId"
            />
          </QueryState>
        </ErrorBoundary>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-fg-secondary">
          Data provided by{" "}
          <a
            className="text-accent underline"
            href="https://www.coingecko.com/"
            rel="noreferrer"
            target="_blank"
          >
            CoinGecko
          </a>
        </span>
        <Pagination resultCount={coins.length} isFetching={query.isFetching} />
      </div>

      <Outlet />
    </section>
  );
}

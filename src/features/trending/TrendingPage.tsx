import { Outlet, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryState } from "@/components/QueryState";
import { RefreshButton } from "@/components/RefreshButton";
import { coingecko } from "@/lib/coingecko";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Trending } from "@/types/coingecko";

type TrendingItem = Trending["coins"][number]["item"];

function TrendingCard({ coin }: { coin: TrendingItem }) {
  const navigate = useNavigate();

  return (
    /*
      Antes esto era un <div onClick>: sin foco, sin teclado, invisible para un lector
      de pantalla. Un <button> lo resuelve de raíz sin añadir handlers de teclado
      a mano, porque Enter y Espacio ya funcionan de forma nativa.
    */
    <button
      type="button"
      onClick={() => void navigate(`/trending/${coin.id}`)}
      className="relative w-[80%] cursor-pointer rounded-lg bg-surface-raised p-4 text-start transition-colors hover:bg-surface-hover sm:w-[60%] lg:w-[40%]"
    >
      <h3 className="flex items-center gap-1.5 py-0.5">
        <span className="text-fg-muted capitalize">Name:</span>
        <span className="text-accent">{coin.name}</span>
        {coin.small && (
          <img src={coin.small} alt="" width={24} height={24} className="h-6 w-6 rounded-full" />
        )}
      </h3>
      <p className="py-0.5">
        <span className="text-fg-muted capitalize">Market cap rank: </span>
        <span className="text-accent">{formatNumber(coin.market_cap_rank)}</span>
      </p>
      <p className="py-0.5">
        <span className="text-fg-muted capitalize">Price (in BTC): </span>
        <span className="text-accent">
          {formatCurrency(coin.price_btc, "btc", { maximumFractionDigits: 8 })}
        </span>
      </p>
      <p className="py-0.5">
        <span className="text-fg-muted capitalize">Score: </span>
        <span className="text-accent">{formatNumber(coin.score)}</span>
      </p>
    </button>
  );
}

export default function TrendingPage() {
  const query = useQuery({
    queryKey: ["trending"],
    queryFn: ({ signal }) => coingecko.trending(signal),
    staleTime: 5 * 60_000,
  });

  const coins = query.data?.coins ?? [];

  return (
    <section className="relative mt-8 mb-24 flex h-full w-[90%] flex-col gap-4 xs:w-[80%] lg:mt-16">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Trending coins</h1>
        <RefreshButton
          onRefresh={() => void query.refetch()}
          label="Refresh trending coins"
          busy={query.isFetching}
        />
      </div>

      <ErrorBoundary area="trending list">
        <QueryState
          isPending={query.isPending}
          error={query.error}
          isEmpty={coins.length === 0}
          onRetry={() => void query.refetch()}
          loadingLabel="Loading trending coins…"
          emptyMessage="Nothing is trending right now."
        >
          <div className="flex min-h-[60vh] w-full flex-wrap items-center justify-evenly gap-8 rounded border border-line-strong py-8">
            {coins.map(({ item }) => (
              <TrendingCard key={item.id} coin={item} />
            ))}
          </div>
        </QueryState>
      </ErrorBoundary>

      <Outlet />
    </section>
  );
}

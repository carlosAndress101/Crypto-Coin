import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryState } from "@/components/QueryState";
import { PriceChart } from "@/features/coin-details/PriceChart";
import { useCurrency } from "@/app/search";
import { coingecko } from "@/lib/coingecko";
import { changeTone, formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type { CoinDetail } from "@/types/coingecko";
import type { ListPath } from "@/app/paths";

function Stat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <dt className="text-sm text-fg-muted capitalize">{label}</dt>
      <dd className="text-base font-bold">{value}</dd>
    </div>
  );
}

/**
 * Barra de posición del precio dentro del rango de 24 h.
 *
 * La barra es puramente decorativa (`aria-hidden`) y la información va en un texto
 * solo para lectores de pantalla. Un `role="meter"` sobre dos `<span>` anunciaría un
 * número sin contexto; una frase dice lo que la barra comunica de un vistazo.
 */
function RangeBar({ current, low, high }: { current: number; low: number; high: number }) {
  const span = high - low;
  const position = span > 0 ? Math.min(100, Math.max(0, ((current - low) / span) * 100)) : 50;

  return (
    <div className="flex flex-col gap-1">
      <div aria-hidden="true" className="flex h-1.5 w-full overflow-hidden rounded-lg">
        <span className="bg-negative" style={{ width: `${position}%` }} />
        <span className="flex-1 bg-positive" />
      </div>
      <p className="sr-only">
        Price sits {position.toFixed(0)}% of the way between the 24 hour low and high.
      </p>
    </div>
  );
}

function DetailBody({ coin, currency }: { coin: CoinDetail; currency: string }) {
  const market = coin.market_data;
  const price = market?.current_price?.[currency] ?? null;
  const low = market?.low_24h?.[currency] ?? null;
  const high = market?.high_24h?.[currency] ?? null;
  const change = market?.price_change_percentage_24h;
  const tone = changeTone(change);

  /* `links.homepage` puede venir ausente. El original escribía
     `data?.links?.homepage[0]`, que rompe el encadenamiento opcional: si homepage
     es undefined, `undefined[0]` lanza TypeError. */
  const links = [
    coin.links?.homepage?.[0],
    coin.links?.blockchain_site?.[0],
    coin.links?.official_forum_url?.[0],
    coin.links?.repos_url?.github?.[0],
  ].filter((url): url is string => Boolean(url));

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:w-[45%]">
        <div className="flex items-center gap-2">
          {coin.image?.large && (
            <img src={coin.image.large} alt="" width={48} height={48} className="h-12 w-12" />
          )}
          <h2 className="text-xl font-medium capitalize">{coin.name}</h2>
          <span className="rounded bg-accent/25 px-2 py-0.5 text-sm text-accent uppercase">
            {coin.symbol}
          </span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-sm text-fg-muted capitalize">Price</span>
            <span
              className={`rounded px-1 text-sm font-medium ${
                tone === "positive"
                  ? "bg-positive/25 text-positive"
                  : tone === "negative"
                    ? "bg-negative/25 text-negative"
                    : "bg-surface-control text-fg-muted"
              }`}
            >
              {formatPercent(change)}
            </span>
          </div>
          <p className="text-lg font-bold">
            {formatCurrency(price, currency, { maximumFractionDigits: 5 })}
          </p>
        </div>

        {price !== null && low !== null && high !== null && (
          <RangeBar current={price} low={low} high={high} />
        )}

        <dl className="grid grid-cols-2 gap-4">
          <Stat
            label="Market cap"
            value={formatCurrency(market?.market_cap?.[currency], currency, {
              maximumFractionDigits: 0,
            })}
          />
          <Stat
            label="Fully diluted"
            value={formatCurrency(market?.fully_diluted_valuation?.[currency], currency, {
              notation: "compact",
            })}
          />
          <Stat
            label="Total volume"
            value={formatCurrency(market?.total_volume?.[currency], currency, {
              maximumFractionDigits: 0,
            })}
          />
          <Stat label="Market cap rank" value={formatNumber(coin.market_cap_rank)} />
          <Stat
            label="Low 24h"
            value={formatCurrency(low, currency, { maximumFractionDigits: 5 })}
          />
          <Stat
            label="High 24h"
            value={formatCurrency(high, currency, { maximumFractionDigits: 5 })}
          />
          <Stat label="Max supply" value={formatNumber(market?.max_supply)} />
          <Stat label="Circulating supply" value={formatNumber(market?.circulating_supply)} />
        </dl>

        {links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="rounded bg-surface-control px-2 py-1 text-sm text-fg-secondary hover:text-accent"
              >
                {new URL(url).hostname}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="flex w-full flex-col lg:w-[55%]">
        <ErrorBoundary area="price chart">
          <PriceChart coinId={coin.id} currency={currency} />
        </ErrorBoundary>
      </div>
    </div>
  );
}

/**
 * Modal de detalle de moneda.
 *
 * Usa `<dialog>` nativo con `showModal()`, que aporta de serie lo que la versión
 * anterior no tenía: trampa de foco, cierre con Escape, `aria-modal`, inertización
 * del fondo y devolución del foco al cerrar. Hacer todo eso a mano sobre un `<div>`
 * habría sido bastante más código y bastante peor.
 */
interface CoinDetailsDialogProps {
  /** Viene tipado del `useParams()` de la ruta que monta el diálogo, así que es `string`. */
  coinId: string;
  /**
   * Vista de lista a la que se vuelve al cerrar. Es una prop porque el mismo diálogo
   * cuelga de tres padres distintos y TanStack Router no tiene equivalente de
   * `navigate("..", { relative: "path" })`; `history.back()` sería incorrecto, porque en
   * un enlace directo se saldría de la aplicación.
   */
  closeTo: ListPath;
}

export default function CoinDetailsDialog({ coinId, closeTo }: CoinDetailsDialogProps) {
  const navigate = useNavigate();
  const currency = useCurrency();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  /* `coinId` llega tipado como string desde la ruta, así que desaparecen el `?? ""` y
     el `enabled: Boolean(coinId)` que hacían falta cuando `useParams` devolvía
     `string | undefined`. */
  const query = useQuery({
    queryKey: ["coin", coinId],
    queryFn: ({ signal }) => coingecko.coin(coinId, signal),
  });

  const close = () => {
    void navigate({ to: closeTo });
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();

    /*
     * El cierre al pulsar el fondo se engancha aquí y no como `onClick` en el JSX
     * a propósito: sobre un `<dialog>` un onClick es un manejador de ratón en un
     * elemento no interactivo, es decir, una función sin equivalente de teclado.
     * Como listener nativo queda claro que es un atajo de ratón y que la vía
     * accesible —Escape, que `<dialog>` implementa de serie— ya está cubierta.
     */
    const onBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) close();
    };
    dialog.addEventListener("click", onBackdropClick);
    return () => dialog.removeEventListener("click", onBackdropClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `close` solo navega y es estable en la práctica
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={close}
      className="m-auto h-[85svh] w-[92vw] max-w-5xl rounded-lg bg-surface-raised p-4 text-fg backdrop:bg-black/60 backdrop:backdrop-blur-sm lg:h-[75vh]"
    >
      <h1 id={titleId} className="sr-only">
        {query.data?.name ?? "Coin"} details
      </h1>

      <button
        type="button"
        onClick={close}
        aria-label="Close details"
        className="absolute top-3 right-3 rounded px-2 py-1 text-lg text-fg-muted hover:text-accent"
      >
        ×
      </button>

      <QueryState
        isPending={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingLabel="Loading coin details…"
      >
        {query.data && <DetailBody coin={query.data} currency={currency} />}
      </QueryState>
    </dialog>,
    document.getElementById("model") ?? document.body,
  );
}

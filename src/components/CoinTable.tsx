import { Link } from "@tanstack/react-router";
import { SaveButton } from "@/components/SaveButton";
import { changeTone, formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type { MarketCoin } from "@/types/coingecko";
import type { CoinDetailPath } from "@/app/paths";

interface CoinTableProps {
  coins: readonly MarketCoin[];
  currency: string;
  caption: string;
  /**
   * Ruta de detalle a la que enlaza cada fila.
   *
   * Es una prop y no un valor fijo porque la tabla la comparten la vista de mercado y la
   * de guardados: antes enlazaba siempre a `/{coinId}`, así que abrir una moneda desde
   * Guardados desmontaba la watchlist y dejaba la lista de mercado detrás del modal.
   * `CoinTable` vive en `components/` y no puede importar de una feature, de ahí la prop.
   */
  detailTo: CoinDetailPath;
}

/**
 * Alto que ocupará la tabla, para reservarlo mientras carga.
 *
 * Los números están medidos en el navegador, no estimados: 41 px de cabecera y 65 px por
 * fila, idénticos a 375 px y a 1280 px porque el relleno de las celdas es fijo. Reservar
 * este hueco es lo que impide que la paginación y el pie peguen un salto cuando llegan los
 * datos (desplazamiento acumulado de diseño).
 */
export function coinTableHeight(rows: number): number {
  return 41 + rows * 65;
}

const TONE_CLASS = {
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-fg-muted",
} as const;

function ChangeCell({
  value,
  className = "",
}: {
  value: number | null | undefined;
  className?: string;
}) {
  return (
    <td className={`py-4 ${TONE_CLASS[changeTone(value)]} ${className}`}>{formatPercent(value)}</td>
  );
}

/**
 * Tabla de monedas, compartida por la vista de mercado y la de guardados.
 *
 * Antes eran dos tablas casi idénticas en archivos distintos. La de mercado ocultaba
 * cinco columnas por debajo de `lg`; la de guardados no ocultaba ninguna, así que se
 * desbordaba en móvil. Al unificarlas, ese comportamiento responsive pasa a ser uno solo.
 *
 * `overflow-x-auto` en el contenedor es la red de seguridad: incluso con columnas
 * ocultas, un símbolo largo no debe hacer scrollar la página entera en horizontal.
 */
export function CoinTable({ coins, currency, caption, detailTo }: CoinTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded border border-line-strong">
      <table className="w-full table-auto">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line-strong text-base font-medium text-fg-muted capitalize">
          <tr>
            <th scope="col" className="py-2 ps-2 text-start">
              Asset
            </th>
            <th scope="col" className="py-2 text-start">
              Name
            </th>
            <th scope="col" className="py-2 text-end pe-2 lg:text-center">
              Price
            </th>
            <th scope="col" className="hidden py-2 lg:table-cell">
              Total volume
            </th>
            <th scope="col" className="hidden py-2 lg:table-cell">
              Market cap change
            </th>
            <th scope="col" className="hidden py-2 sm:table-cell">
              1h
            </th>
            <th scope="col" className="hidden py-2 sm:table-cell">
              24h
            </th>
            <th scope="col" className="hidden py-2 lg:table-cell">
              7d
            </th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => (
            <tr
              key={coin.id}
              className="border-b border-line-strong text-center text-base last:border-b-0 hover:bg-surface-hover"
            >
              <td className="py-4 ps-2">
                <div className="flex items-center gap-1.5">
                  <SaveButton coinId={coin.id} coinName={coin.name} />
                  {coin.image && (
                    <img src={coin.image} alt="" className="h-5 w-5" width={20} height={20} />
                  )}
                  <Link
                    to={detailTo}
                    params={{ coinId: coin.id }}
                    className="uppercase hover:text-accent"
                  >
                    {coin.symbol}
                  </Link>
                </div>
              </td>
              <td className="py-4 text-start">
                <Link to={detailTo} params={{ coinId: coin.id }} className="hover:text-accent">
                  {coin.name}
                </Link>
              </td>
              <td className="py-4 text-end pe-2 lg:text-center">
                {formatCurrency(coin.current_price, currency)}
              </td>
              <td className="hidden py-4 lg:table-cell">{formatNumber(coin.total_volume)}</td>
              <ChangeCell
                value={coin.market_cap_change_percentage_24h}
                className="hidden lg:table-cell"
              />
              <ChangeCell
                value={coin.price_change_percentage_1h_in_currency}
                className="hidden sm:table-cell"
              />
              <ChangeCell
                value={coin.price_change_percentage_24h_in_currency}
                className="hidden sm:table-cell"
              />
              <ChangeCell
                value={coin.price_change_percentage_7d_in_currency}
                className="hidden lg:table-cell"
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useEffect, useId, useState } from "react";
import { useMarketsFilters } from "@/features/markets/useMarketsFilters";
import { useCoinSearch } from "@/features/markets/queries";
import { Spinner } from "@/components/Spinner";

/**
 * Buscador de monedas.
 *
 * El debounce ya no viene de `lodash.debounce`: son cinco líneas de `useEffect` +
 * `setTimeout`, y la versión con la librería tenía un fallo sutil —la función
 * debounced se recreaba en cada render, así que el temporizador no siempre se
 * cancelaba—. Además el retardo baja de 2000 ms a 400 ms: con caché de por medio,
 * 2 segundos eran una espera que ya no hace falta pagar.
 */
export function Search() {
  const { selectCoin } = useMarketsFilters();
  const [text, setText] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputId = useId();
  const listId = useId();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(text), 400);
    return () => clearTimeout(timer);
  }, [text]);

  const { data, isFetching } = useCoinSearch(debounced);
  const results = data?.coins ?? [];
  const isOpen = text.trim().length > 0;

  return (
    <div className="relative w-full lg:w-[25vw]">
      <label htmlFor={inputId} className="sr-only">
        Search coins
      </label>
      <input
        id={inputId}
        type="search"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        autoComplete="off"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Search here…"
        className="w-full rounded border border-transparent bg-surface-control px-2 py-1.5 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-0"
      />

      {isOpen && (
        <ul
          id={listId}
          className="absolute top-11 right-0 z-10 max-h-96 w-full min-w-72 overflow-y-auto rounded bg-surface-control/95 py-2 backdrop-blur-md scrollbar-thin scrollbar-thumb-fg-muted scrollbar-track-surface-control"
        >
          {isFetching && results.length === 0 && (
            <li>
              <Spinner label="Searching…" />
            </li>
          )}

          {!isFetching && results.length === 0 && (
            <li className="px-4 py-2 text-fg-muted">No coins match “{text}”.</li>
          )}

          {results.map((coin) => (
            <li key={coin.id}>
              <button
                type="button"
                onClick={() => {
                  selectCoin(coin.id);
                  setText("");
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-start hover:bg-surface-hover"
              >
                {coin.thumb && <img src={coin.thumb} alt="" width={16} height={16} />}
                <span>{coin.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

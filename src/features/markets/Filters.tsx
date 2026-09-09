import { useId, useState } from "react";
import { Search } from "@/features/markets/Search";
import { RefreshButton } from "@/components/RefreshButton";
import { useMarketsFilters } from "@/features/markets/MarketsProvider";
import { isValidCurrency } from "@/lib/format";
import { SORT_OPTIONS } from "@/types/coingecko";
import type { SortOption } from "@/types/coingecko";

interface FiltersProps {
  onRefresh: () => void;
  isFetching: boolean;
}

export function Filters({ onRefresh, isFetching }: FiltersProps) {
  const { currency, sortBy, setCurrency, setSortBy, reset } = useMarketsFilters();
  const [draft, setDraft] = useState(currency);
  const [error, setError] = useState<string | null>(null);
  const currencyId = useId();
  const sortId = useId();
  const errorId = useId();

  /**
   * La divisa se valida ANTES de llegar al estado. `Intl.NumberFormat` lanza
   * RangeError con un código mal formado y, sin frontera de error, eso tumbaba el
   * árbol de React entero: escribir "eur1" dejaba la aplicación en blanco.
   */
  const submitCurrency = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidCurrency(draft)) {
      setError("Use a three-letter code, like usd, eur or btc.");
      return;
    }
    setError(null);
    setCurrency(draft);
  };

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg lg:h-12 lg:flex-row lg:items-center lg:justify-between lg:border-2 lg:border-solid lg:border-line-strong lg:px-3">
      <Search />

      <form className="flex items-center gap-2" onSubmit={submitCurrency}>
        <label htmlFor={currencyId} className="font-bold">
          Currency:
        </label>
        <input
          id={currencyId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={3}
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
          className="w-20 rounded border border-transparent bg-surface-control px-2 py-1 text-fg uppercase placeholder:text-fg-muted focus:border-accent focus:outline-0"
        />
        <button
          type="submit"
          className="rounded bg-surface-control px-3 py-1 font-semibold transition-colors hover:text-accent"
        >
          Set
        </button>
        {error && (
          <p id={errorId} role="alert" className="text-sm text-negative">
            {error}
          </p>
        )}
      </form>

      <div className="flex items-center gap-2">
        <label htmlFor={sortId} className="font-bold">
          Sort by:
        </label>
        {/*
          `onChange`, no `onClick`: con onClick el desplegable no responde al teclado.
          Y sin `text-transparent`, que dejaba invisible el valor seleccionado.
        */}
        <select
          id={sortId}
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortOption)}
          className="rounded bg-surface-control px-2 py-1.5 text-fg focus:outline-0"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            setDraft("usd");
            setError(null);
            reset();
          }}
          className="rounded bg-surface-control px-3 py-1 font-semibold transition-colors hover:text-accent"
        >
          Reset
        </button>

        <RefreshButton onRefresh={onRefresh} label="Refresh market data" busy={isFetching} />
      </div>
    </div>
  );
}

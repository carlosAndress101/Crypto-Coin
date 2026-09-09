import { useId, useState } from "react";
import { Search } from "@/features/markets/Search";
import { RefreshButton } from "@/components/RefreshButton";
import { useMarketsFilters } from "@/features/markets/useMarketsFilters";
import { isValidCurrency } from "@/lib/format";
import { SORT_OPTIONS } from "@/types/coingecko";
import type { SortOption } from "@/types/coingecko";

interface FiltersProps {
  onRefresh: () => void;
  isFetching: boolean;
}

/**
 * Campo de divisa con su borrador local.
 *
 * Está extraído en un componente propio para poder montarlo con `key={committed}`. Suena a
 * detalle, pero es lo que impide un fallo nuevo: al vivir la divisa en la URL, el botón
 * Atrás del navegador puede cambiarla, y un `useState(committed)` que solo se inicializa
 * una vez seguiría mostrando el valor viejo. Con la key, el borrador se rehace cada vez
 * que cambia el valor confirmado —y el mensaje de error se limpia con él—.
 *
 * La validación se hace ANTES de navegar y se conserva a propósito. El esquema de la URL
 * ya evita el RangeError de `Intl.NumberFormat`, pero silenciosamente: caería a USD sin
 * decir nada. Aquí el usuario recibe una explicación de por qué "eur1" no vale.
 */
function CurrencyField({
  committed,
  onCommit,
}: {
  committed: string;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState(committed);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isValidCurrency(draft)) {
          setError("Use a three-letter code, like usd, eur or btc.");
          return;
        }
        setError(null);
        onCommit(draft);
      }}
    >
      <label htmlFor={inputId} className="font-bold">
        Currency:
      </label>
      <input
        id={inputId}
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
  );
}

export function Filters({ onRefresh, isFetching }: FiltersProps) {
  const { currency, sortBy, setCurrency, setSortBy, reset } = useMarketsFilters();
  const sortId = useId();

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg lg:h-12 lg:flex-row lg:items-center lg:justify-between lg:border-2 lg:border-solid lg:border-line-strong lg:px-3">
      <Search />

      <CurrencyField key={currency} committed={currency} onCommit={setCurrency} />

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
          onClick={reset}
          className="rounded bg-surface-control px-3 py-1 font-semibold transition-colors hover:text-accent"
        >
          Reset
        </button>

        <RefreshButton onRefresh={onRefresh} label="Refresh market data" busy={isFetching} />
      </div>
    </div>
  );
}

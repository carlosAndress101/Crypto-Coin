import type { ReactNode } from "react";
import { ApiError } from "@/lib/coingecko";
import { Spinner } from "@/components/Spinner";

interface QueryStateProps {
  isPending: boolean;
  error: unknown;
  isEmpty?: boolean;
  onRetry?: () => void;
  loadingLabel?: string;
  emptyMessage?: string;
  children: ReactNode;
}

/**
 * Los cuatro estados que toda vista con datos remotos tiene que distinguir.
 *
 * Este componente existe porque el fallo original de la aplicación era exactamente
 * no distinguirlos: `setCryptoData()` sin argumento hacía que "cargando" y "error"
 * fueran el mismo `undefined`, así que un 429 de CoinGecko se renderizaba como un
 * spinner eterno sin explicación ni salida (ver PRODUCT.md → criterio de fallo).
 */
export function QueryState({
  isPending,
  error,
  isEmpty = false,
  onRetry,
  loadingLabel,
  emptyMessage = "Nothing to show yet.",
  children,
}: QueryStateProps) {
  if (isPending) {
    /* La misma altura mínima que los estados de error y vacío. No es simetría estética:
       sin ella el indicador de carga mide una fracción de lo que medirá la tabla, así que
       al llegar los datos todo lo de abajo —la paginación, el pie— pega un salto. Medido
       con Lighthouse: 0.096 de CLS, y este era el único elemento culpable. */
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner {...(loadingLabel === undefined ? {} : { label: loadingLabel })} />
      </div>
    );
  }

  if (error) {
    const message =
      error instanceof ApiError ? error.userMessage : "Something went wrong loading data.";

    return (
      <div
        role="alert"
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center"
      >
        <p className="text-md font-semibold text-negative">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded bg-accent px-4 py-2 font-semibold text-fg-inverse transition-colors hover:bg-accent-hover"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <p className="flex min-h-[40vh] items-center justify-center px-4 text-center text-md text-fg-muted">
        {emptyMessage}
      </p>
    );
  }

  return children;
}

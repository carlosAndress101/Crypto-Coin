import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/coingecko";

/**
 * Configuración pensada alrededor del límite de CoinGecko (~10–30 req/min sin API key).
 *
 * Los valores no son los de por defecto de TanStack Query porque los de por defecto
 * asumen una API propia sin cuota. Aquí cada petición de más acerca un 429.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /* 60 s: los precios se mueven, pero volver a una pestaña no debe costar
           una petición. Es el ajuste que más reduce el consumo de cuota. */
        staleTime: 60_000,
        gcTime: 5 * 60_000,

        /* Refetch al enfocar la ventana está DESACTIVADO a propósito: alt-tabbing
           dispararía peticiones sin que el usuario pida nada. El refresco es
           explícito, con el botón de recargar. */
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,

        retry(failureCount, error) {
          if (error instanceof ApiError) {
            // Reintentar un 429 solo empeora el rate limit.
            if (error.isRateLimit) return false;
            // Un 404 no mejora por insistir.
            if (error.status !== undefined && error.status >= 400 && error.status < 500) {
              return false;
            }
          }
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      },
    },
  });
}

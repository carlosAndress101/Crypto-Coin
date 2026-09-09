import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WatchlistProvider } from "@/app/WatchlistProvider";
import { MarketsProvider } from "@/features/markets/MarketsProvider";
import { createQueryClient } from "@/lib/queryClient";
import { router } from "@/app/router";
import "@/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing #root element in index.html");

const queryClient = createQueryClient();

createRoot(rootElement).render(
  <StrictMode>
    {/* Frontera exterior: si algo revienta por encima del router, el usuario ve un
        mensaje con reintento en vez de una página en blanco. */}
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* MarketsProvider envuelve a WatchlistProvider porque la vista de guardados
            necesita la divisa elegida en la de mercado. Es la misma dependencia que
            existía antes entre StorageContext y CryptoContext, ahora explícita. */}
        <MarketsProvider>
          <WatchlistProvider>
            <RouterProvider router={router} />
          </WatchlistProvider>
        </MarketsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WatchlistProvider } from "@/app/WatchlistProvider";
import { createQueryClient } from "@/lib/queryClient";
import { router } from "@/app/routes";
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
        {/* Ya no hay un provider de filtros de mercado: divisa, orden, página y tamaño de
            página viven en la URL, y el router es su dueño. Solo queda la watchlist, que
            es estado de cliente de verdad —persistido en localStorage, no derivable de
            la URL ni del servidor—. */}
        <WatchlistProvider>
          <RouterProvider router={router} />
        </WatchlistProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);

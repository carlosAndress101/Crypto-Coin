import {
  CoinDetailSchema,
  MarketChartSchema,
  MarketlistSchema,
  SearchResultSchema,
  TrendingSchema,
} from "@/types/coingecko";
import type { ChartRange, SortOption } from "@/types/coingecko";
import type { ZodType } from "zod";

/**
 * Cliente único de CoinGecko.
 *
 * Antes existían siete `fetch` sueltos repartidos por cinco archivos, cada uno con su
 * propia (in)decisión sobre timeout, cancelación y errores. Aquí esas decisiones se
 * toman una sola vez.
 *
 * No usa API key a propósito: sin backend, cualquier credencial embebida sería pública
 * (ver PRODUCT.md → R2). El precio es un límite de ~10–30 req/min, que es la razón de
 * que `ApiError.isRateLimit` exista como caso de primera clase y no como un fallo genérico.
 */

const BASE_URL = "https://api.coingecko.com/api/v3";
const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  readonly status: number | undefined;
  readonly isRateLimit: boolean;
  readonly isTimeout: boolean;
  readonly isOffline: boolean;

  constructor(
    message: string,
    options: {
      status?: number | undefined;
      isTimeout?: boolean;
      isOffline?: boolean;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.status = options.status;
    this.isRateLimit = options.status === 429;
    this.isTimeout = options.isTimeout ?? false;
    this.isOffline = options.isOffline ?? false;
  }

  /** Mensaje pensado para mostrarse tal cual al usuario. */
  get userMessage(): string {
    if (this.isRateLimit) {
      return "CoinGecko is rate limiting us. Wait a moment and try again.";
    }
    if (this.isTimeout) return "The request took too long. Try again.";
    if (this.isOffline) return "You appear to be offline. Check your connection.";
    if (this.status === 404) return "That coin could not be found.";
    if (this.status !== undefined && this.status >= 500) {
      return "CoinGecko is having trouble right now. Try again shortly.";
    }
    return "Something went wrong loading market data.";
  }
}

/**
 * Une el `signal` de TanStack Query con el del timeout propio.
 * Sin esto, cancelar una query no abortaría de verdad la petición en vuelo, que es
 * justo lo que provoca hoy que una respuesta lenta pise a una más reciente.
 */
function withTimeout(signal: AbortSignal | undefined): {
  signal: AbortSignal;
  done: () => void;
} {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(new Error("timeout")), TIMEOUT_MS);
  const signals = signal ? [signal, timeout.signal] : [timeout.signal];
  return { signal: AbortSignal.any(signals), done: () => clearTimeout(timer) };
}

async function request<T>(path: string, schema: ZodType<T>, signal?: AbortSignal): Promise<T> {
  const { signal: combined, done } = withTimeout(signal);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      signal: combined,
      headers: { accept: "application/json" },
    });
  } catch (cause) {
    // Una cancelación pedida por el consumidor se propaga tal cual: no es un fallo.
    if (signal?.aborted) throw cause;
    if (combined.aborted) {
      throw new ApiError("Request timed out", { isTimeout: true, cause });
    }
    throw new ApiError("Network request failed", {
      isOffline: !navigator.onLine,
      cause,
    });
  } finally {
    done();
  }

  if (!response.ok) {
    throw new ApiError(`CoinGecko responded ${response.status}`, {
      status: response.status,
    });
  }

  const payload: unknown = await response.json();
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    // El esquema es tolerante (ver types/coingecko.ts). Si aun así falla, la forma de
    // la respuesta cambió de verdad y conviene enterarse, no seguir con datos rotos.
    throw new ApiError("CoinGecko returned data in an unexpected shape", {
      cause: parsed.error,
    });
  }

  return parsed.data;
}

export interface MarketsParams {
  currency: string;
  sortBy: SortOption;
  page: number;
  perPage: number;
  /** Si se indica, restringe la respuesta a esa moneda (lo usa el buscador). */
  coinId?: string | undefined;
}

export const coingecko = {
  markets({ currency, sortBy, page, perPage, coinId }: MarketsParams, signal?: AbortSignal) {
    const params = new URLSearchParams({
      vs_currency: currency,
      order: sortBy,
      per_page: String(perPage),
      page: String(page),
      sparkline: "false",
      price_change_percentage: "1h,24h,7d",
      locale: "en",
    });
    if (coinId) params.set("ids", coinId);
    return request(`/coins/markets?${params}`, MarketlistSchema, signal);
  },

  /** Monedas concretas por id: la lista de guardados. */
  marketsByIds(ids: readonly string[], currency: string, signal?: AbortSignal) {
    const params = new URLSearchParams({
      vs_currency: currency,
      ids: ids.join(","),
      sparkline: "false",
      price_change_percentage: "1h,24h,7d",
    });
    return request(`/coins/markets?${params}`, MarketlistSchema, signal);
  },

  coin(id: string, signal?: AbortSignal) {
    const params = new URLSearchParams({
      localization: "false",
      tickers: "false",
      market_data: "true",
      community_data: "false",
      developer_data: "true",
      sparkline: "false",
    });
    return request(`/coins/${encodeURIComponent(id)}?${params}`, CoinDetailSchema, signal);
  },

  search(query: string, signal?: AbortSignal) {
    const params = new URLSearchParams({ query });
    return request(`/search?${params}`, SearchResultSchema, signal);
  },

  trending(signal?: AbortSignal) {
    return request("/search/trending", TrendingSchema, signal);
  },

  marketChart(id: string, currency: string, days: ChartRange, signal?: AbortSignal) {
    const params = new URLSearchParams({
      vs_currency: currency,
      days: String(days),
      interval: "daily",
    });
    return request(
      `/coins/${encodeURIComponent(id)}/market_chart?${params}`,
      MarketChartSchema,
      signal,
    );
  },
};

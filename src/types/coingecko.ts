import { z } from "zod";

/**
 * Contratos de la API de CoinGecko.
 *
 * Criterio de diseño: **tolerantes a propósito.** CoinGecko es una API de terceros que
 * puede añadir campos, devolver `null` en numéricos de monedas exóticas u omitir enlaces
 * opcionales. Un esquema estricto que rechace una respuesta real sería peor que no tener
 * esquema: rompería la página por un campo que ni se muestra.
 *
 * Por eso:
 *  - Los objetos son `looseObject`: campos nuevos de CoinGecko pasan sin romper nada.
 *  - Todo lo que la API puede omitir o anular se declara `.nullish()`.
 *  - Solo los campos sin los cuales la fila **no se puede renderizar** (`id`, `name`)
 *    son obligatorios.
 */

/** Números que CoinGecko devuelve como `null` en monedas sin datos suficientes. */
const nullableNumber = z.number().nullish();

/** Una fila de `/coins/markets`: lo que pinta la tabla principal y la de guardados. */
export const MarketCoinSchema = z.looseObject({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string().nullish(),
  current_price: nullableNumber,
  market_cap: nullableNumber,
  market_cap_rank: nullableNumber,
  total_volume: nullableNumber,
  market_cap_change_percentage_24h: nullableNumber,
  price_change_percentage_1h_in_currency: nullableNumber,
  price_change_percentage_24h_in_currency: nullableNumber,
  price_change_percentage_7d_in_currency: nullableNumber,
});

export const MarketlistSchema = z.array(MarketCoinSchema);

/** Mapa divisa → importe. `/coins/{id}` devuelve cada métrica en todas las divisas. */
const currencyMap = z.record(z.string(), z.number().nullish());

/** Detalle de `/coins/{id}`: alimenta el modal. */
export const CoinDetailSchema = z.looseObject({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  market_cap_rank: nullableNumber,
  coingecko_rank: nullableNumber,
  coingecko_score: nullableNumber,
  sentiment_votes_up_percentage: nullableNumber,
  sentiment_votes_down_percentage: nullableNumber,
  image: z
    .looseObject({
      thumb: z.string().nullish(),
      small: z.string().nullish(),
      large: z.string().nullish(),
    })
    .nullish(),
  market_data: z
    .looseObject({
      current_price: currencyMap.nullish(),
      market_cap: currencyMap.nullish(),
      fully_diluted_valuation: currencyMap.nullish(),
      total_volume: currencyMap.nullish(),
      high_24h: currencyMap.nullish(),
      low_24h: currencyMap.nullish(),
      max_supply: nullableNumber,
      circulating_supply: nullableNumber,
      price_change_percentage_24h: nullableNumber,
    })
    .nullish(),
  links: z
    .looseObject({
      homepage: z.array(z.string()).nullish(),
      blockchain_site: z.array(z.string()).nullish(),
      official_forum_url: z.array(z.string()).nullish(),
      twitter_screen_name: z.string().nullish(),
      subreddit_url: z.string().nullish(),
      facebook_username: z.string().nullish(),
      repos_url: z
        .looseObject({ github: z.array(z.string()).nullish() })
        .nullish(),
    })
    .nullish(),
});

/** Resultado de `/search?query=`: el desplegable del buscador. */
export const SearchResultSchema = z.looseObject({
  coins: z
    .array(
      z.looseObject({
        id: z.string(),
        name: z.string(),
        thumb: z.string().nullish(),
      }),
    )
    .nullish()
    .transform((coins) => coins ?? []),
});

/** `/search/trending`: cada entrada envuelve la moneda en `.item`. */
export const TrendingSchema = z.looseObject({
  coins: z
    .array(
      z.looseObject({
        item: z.looseObject({
          id: z.string(),
          coin_id: z.number().nullish(),
          name: z.string(),
          small: z.string().nullish(),
          large: z.string().nullish(),
          market_cap_rank: nullableNumber,
          price_btc: nullableNumber,
          score: nullableNumber,
        }),
      }),
    )
    .nullish()
    .transform((coins) => coins ?? []),
});

/** `/coins/{id}/market_chart`: series como pares [epoch_ms, valor]. */
const series = z.array(z.tuple([z.number(), z.number()]));

export const MarketChartSchema = z.looseObject({
  prices: series.nullish().transform((s) => s ?? []),
  market_caps: series.nullish().transform((s) => s ?? []),
  total_volumes: series.nullish().transform((s) => s ?? []),
});

/** Las tres series que el gráfico sabe dibujar. */
export const CHART_METRICS = ["prices", "market_caps", "total_volumes"] as const;
export type ChartMetric = (typeof CHART_METRICS)[number];

/** Rangos de días que ofrece la interfaz del gráfico. */
export const CHART_RANGES = [7, 14, 30] as const;
export type ChartRange = (typeof CHART_RANGES)[number];

/** Modos de orden aceptados por `/coins/markets`. */
export const SORT_OPTIONS = [
  { value: "market_cap_desc", label: "Market cap: high to low" },
  { value: "market_cap_asc", label: "Market cap: low to high" },
  { value: "volume_desc", label: "Volume: high to low" },
  { value: "volume_asc", label: "Volume: low to high" },
  { value: "id_desc", label: "Name: Z to A" },
  { value: "id_asc", label: "Name: A to Z" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export type MarketCoin = z.infer<typeof MarketCoinSchema>;
export type CoinDetail = z.infer<typeof CoinDetailSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type Trending = z.infer<typeof TrendingSchema>;
export type MarketChart = z.infer<typeof MarketChartSchema>;

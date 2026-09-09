# API.md — integración con CoinGecko

> Todo el acceso a la red pasa por `src/lib/coingecko.ts`. Es el **único** archivo del
> proyecto con una llamada a `fetch`.

## Contexto: por qué no hay API key

La aplicación no tiene backend. Cualquier credencial embebida en el cliente sería pública
—basta abrir las herramientas de desarrollo—, así que se usa el plan gratuito sin clave
(ver `PRODUCT.md` → R2).

El precio de esa decisión es un **límite de ~10–30 peticiones por minuto**, y ese límite es
la restricción que ordena el resto de la arquitectura: la caché no es una optimización, es
un requisito; los reintentos agresivos empeoran el problema en vez de arreglarlo; y un 429
tiene que ser un estado visible del producto, no un fallo genérico.

Base: `https://api.coingecko.com/api/v3`

## Endpoints en uso

| Método         | Endpoint                       | Para qué                  | Se pide desde                                 |
| -------------- | ------------------------------ | ------------------------- | --------------------------------------------- |
| `markets`      | `GET /coins/markets`           | tabla de mercado paginada | `features/markets/queries.ts`                 |
| `marketsByIds` | `GET /coins/markets?ids=`      | filas de la watchlist     | `features/saved/SavedPage.tsx`                |
| `coin`         | `GET /coins/{id}`              | detalle de moneda         | `features/coin-details/CoinDetailsDialog.tsx` |
| `search`       | `GET /search`                  | sugerencias del buscador  | `features/markets/queries.ts`                 |
| `trending`     | `GET /search/trending`         | vista de tendencias       | `features/trending/TrendingPage.tsx`          |
| `marketChart`  | `GET /coins/{id}/market_chart` | series del gráfico        | `features/coin-details/PriceChart.tsx`        |

`markets` recibe `vs_currency`, `order`, `per_page`, `page`, `sparkline=false`,
`price_change_percentage=1h,24h,7d` y `locale=en`; con el filtro del buscador activo añade
`ids`. Los cuatro primeros salen directamente de los search params de la URL, ya validados y
acotados por Zod, así que `?perPage=99999` llega a la API como `per_page=250`.

## Ciclo de vida de una petición

```
useQuery(clave, queryFn)
  └─ coingecko.<método>(params, signal)
       └─ request(path, esquema, signal)
            ├─ AbortSignal.any([signal de Query, timeout de 15 s])
            ├─ fetch
            ├─ !response.ok  → ApiError(status)
            └─ esquema.safeParse → ApiError("forma inesperada")
```

Unir las dos señales con `AbortSignal.any` es lo que hace que cancelar una query aborte de
verdad la petición en vuelo. Sin eso, una respuesta lenta puede pisar a otra más reciente,
que era el origen de la condición de carrera original.

## Errores

`ApiError` normaliza todo lo que puede salir mal y expone banderas en vez de obligar a
inspeccionar códigos por ahí:

| Bandera          | Cuándo                                    | Mensaje al usuario                                            |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------- |
| `isRateLimit`    | HTTP 429                                  | "CoinGecko is rate limiting us. Wait a moment and try again." |
| `isTimeout`      | 15 s sin respuesta                        | "The request took too long. Try again."                       |
| `isOffline`      | fallo de red con `navigator.onLine` falso | "You appear to be offline. Check your connection."            |
| `status === 404` |                                           | "That coin could not be found."                               |
| `status >= 500`  |                                           | "CoinGecko is having trouble right now. Try again shortly."   |

Una cancelación pedida por el consumidor **se propaga tal cual**: no es un fallo y no debe
pintarse como tal.

Los estados que el producto distingue son cinco —cargando, éxito, vacío, error y limitado—
y los modela `components/QueryState.tsx`. La versión original de la aplicación colapsaba los
cinco en "los datos son `undefined`", que es por lo que un 429 se veía como un spinner
eterno.

## Caché y reintentos

Configurado en `src/lib/queryClient.ts`:

| Opción                 | Valor                                              | Motivo                                      |
| ---------------------- | -------------------------------------------------- | ------------------------------------------- |
| `staleTime`            | 60 s                                               | los precios se mueven, pero no cada segundo |
| `gcTime`               | 5 min                                              | volver a una pestaña no vuelve a pedir      |
| `refetchOnWindowFocus` | `false`                                            | cambiar de pestaña no debe gastar cuota     |
| `refetchOnReconnect`   | `true`                                             | al volver la red, sí                        |
| `retry`                | **nunca** en 429 ni en 4xx; 2 intentos en el resto | reintentar un 429 lo empeora                |
| `retryDelay`           | backoff exponencial, tope 10 s                     |                                             |

Sobrescrituras por query: `staleTime` de 5 min en búsqueda, tendencias y gráfico —datos que
cambian despacio—, y `placeholderData` en la tabla de mercado, para que paginar no parpadee
a un spinner.

## Validación de respuestas

`src/types/coingecko.ts` define los esquemas Zod. Son **tolerantes a propósito**
(`z.looseObject`, campos `.nullish()`): CoinGecko añade campos y devuelve `null` en monedas
poco líquidas, y un esquema estricto rompería la aplicación por un dato que ni se pinta.

Si aun así el parseo falla, la forma de la respuesta cambió de verdad y sale un `ApiError`
explícito, en lugar de seguir adelante con datos rotos.

## Pruebas

Las pruebas **nunca** llaman a la API real: `scripts/smoke.mjs` intercepta
`**/api.coingecko.com/**` en Playwright. No es solo por velocidad —con el límite de tasa, una
suite que llamara de verdad sería no determinista y gastaría la cuota del desarrollador—,
sino porque interceptar es lo único que permite **provocar un 429 a voluntad**, que es
justamente el escenario que la aplicación gestionaba mal.

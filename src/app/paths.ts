/**
 * Destinos de ruta que se pasan como prop.
 *
 * Vive en su propio módulo, sin imports, para que `CoinTable` pueda tiparse contra las
 * rutas de detalle sin cerrar el ciclo `routes.tsx → MarketsPage → CoinTable → routes.tsx`,
 * que `import/no-cycle` rechazaría.
 */

/** Las tres rutas que abren el diálogo de detalle, una por vista de lista. */
export type CoinDetailPath = "/$coinId" | "/trending/$coinId" | "/saved/$coinId";

/** La vista de lista que queda detrás del diálogo, y a la que vuelve al cerrarse. */
export type ListPath = "/" | "/trending" | "/saved";

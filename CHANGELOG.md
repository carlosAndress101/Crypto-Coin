# CHANGELOG

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/);
versionado según [SemVer](https://semver.org/lang/es/).

> **Ninguna de estas versiones está etiquetada ni publicada todavía.** La aplicación no
> tiene despliegue: no hay `_headers`, `_redirects` ni workflow de CI. Las etiquetas de git
> y el despliegue a Cloudflare Pages son trabajo pendiente.

---

## [Sin publicar] — Endurecimiento previo a la primera release

Cierra los huecos de producción que quedaban abiertos tras la modernización. No cambia
comportamiento visible de la aplicación.

### Corregido

- **Token CSS inexistente.** `src/index.css` fijaba el color del body en
  `var(--color-text-primary)`, que nunca existió en `@theme`. CSS no avisa de eso y el
  fallo era invisible porque cada componente fija su propio color de texto.
- **`pnpm lint` reportaba 10 avisos**, todos `no-await-in-loop` en `scripts/`. Ahora está
  en 0 errores y 0 avisos, con la regla desactivada **solo** para esa carpeta y el motivo
  escrito caso por caso. `src/` mantiene todas las reglas.

### Añadido

- **`public/_headers`**: CSP, HSTS, `Referrer-Policy`, `X-Content-Type-Options`,
  `X-Frame-Options`, `Permissions-Policy` y políticas de origen cruzado, más cacheado
  inmutable para los assets con hash y revalidación para el HTML. Cada decisión está
  justificada en `SECURITY.md`.
- **`public/_redirects`** con el fallback de aplicación de una sola página. Sin él, un
  enlace directo a `/saved/bitcoin` devolvía **404** en producción. No estaba en el informe
  de auditoría, pero rompería los mismos enlaces profundos que la suite de humo verifica.
- **`SECURITY.md`** y **`DEPLOYMENT.md`**, que no existían.
- `pnpm contrast` comprueba además que todo `var(--color-*)` y `var(--font-*)` usado esté
  declarado en `@theme`. Verificado reintroduciendo el fallo a mano.
- Tres comprobaciones de humo (49 en total) que leen la CSP de `dist/_headers`, la inyectan
  en el navegador y verifican cero violaciones en las tres vistas y en el modal, que la
  tipografía propia se aplica y que el gráfico se dibuja.

### Cambiado

- **`robots.txt` y `sitemap.xml` se generan en el build a partir de `VITE_SITE_URL`.**
  Antes eran archivos estáticos con el dominio escrito a mano, o sea tres copias del mismo
  dato que podían desincronizarse. Se eliminan de `public/`. Si la variable falta, el build
  se detiene.
- **Dominio de producción fijado**: `https://crypto-coin-5yz.pages.dev`. Ya no hay
  marcadores de posición.
- **`z` se importa de `@/lib/zod`, no de `"zod"`.** Ese módulo activa `jitless: true`. Zod 4
  compila validadores con `Function("")` y lo detecta probándolo dentro de un `try/catch`:
  bajo la CSP la prueba falla, Zod cae al camino interpretado y todo funciona, pero el
  intento disparaba una violación de CSP en cada carga. Vive en su propio módulo porque Zod
  lee la bandera al **construir** el esquema, no al validar.
- `CLAUDE.md` documenta ya el stack OXC, el despliegue real y el flujo de release.

## [0.2.0] — 2026-09-09 — TanStack Router, identidad de marca

### Cambiado

- **Router: react-router 8.3.1 → @tanstack/react-router 1.170.33.** Las URLs son idénticas
  (`/`, `/trending`, `/saved` y `/{coinId}` bajo cada una) y las direcciones existentes
  siguen funcionando. Motivo: permite que los filtros sean estado tipado en la URL.
- **Los filtros viven en la URL.** `currency`, `sort`, `page`, `perPage` y el filtro del
  buscador pasan de un Context a search params validados con Zod. Ahora una vista filtrada
  se puede compartir y marcar, recargar la conserva, y atrás/adelante deshacen los cambios.
- **`MarketsProvider` eliminado**, sustituido por `useMarketsFilters()`, con la misma
  interfaz pero respaldada por el router.
- Los límites de los filtros (`perPage` entre 1 y 250, `page` ≥ 1, divisa de tres letras)
  se aplican también a lo que venga escrito en la URL, no solo al formulario.
- **Identidad de marca nueva.** Símbolo propio en SVG y logotipo en texto, en lugar de un
  PNG de 500×500. El cian `#14ffec` se conserva.
- La tarjeta de Open Graph pasa a ser una imagen real con URL absoluta.

### Añadido

- Carga diferida por ruta y del gráfico, con `Suspense`.
- `NotFound` para rutas inexistentes de dos o más segmentos.
- `apple-touch-icon`, `site.webmanifest`, `icon-192`, `icon-512` y `og.jpg`, que no existían.
- `pnpm icons` genera los mapas de bits desde el SVG con el Chromium de Playwright.
- `pnpm test:e2e` como alias de `pnpm smoke`.
- 27 comprobaciones nuevas en la prueba de humo (45 en total), incluidas axe-core sobre las
  tres vistas y el modal, y una aserción sobre el tamaño del bundle.
- `DESIGN_SYSTEM.md`, `API.md`, `CONTRIBUTING.md` y este archivo.

### Corregido

- **Abrir una moneda desde Guardados cambiaba la lista de fondo** a la de mercado, porque la
  tabla enlazaba siempre a `/{coinId}`. `/saved/{coinId}` solo era alcanzable escribiendo la
  URL a mano.
- **La pestaña "Crypto" aparecía siempre activa**, así que en `/trending` se marcaban dos.
- **`og:image` era una ruta relativa**, que ningún rastreador resuelve: la tarjeta anterior
  no llegó a mostrarse en ninguna parte.
- El hook de pre-commit filtraba por `*.{js,jsx,ts,tsx}`, así que los tres scripts `.mjs` del
  repositorio se saltaban oxlint y oxfmt por completo.

### Eliminado

- `src/assets/logo.png` y `public/favicon.png` (76.9 kB cada uno, byte-idénticos).
- `public/vite.svg`, el logo de Vite, que no referenciaba nadie y aun así se copiaba a `dist/`.

### Rendimiento

|         | JS inicial                | gzip      |
| ------- | ------------------------- | --------- |
| antes   | 788.18 kB (un solo chunk) | 236.05 kB |
| después | 416.48 kB en 4 chunks     | 132.42 kB |

Recharts (352 kB) solo se descarga al abrir el diálogo de detalle. Iconos: de 76.9 kB a
264 B en la ruta que el navegador carga de verdad.

### Cambios visibles a tener en cuenta

- Ir de `/` a `/trending` y volver **ya no conserva la página ni el orden**: esos parámetros
  pertenecen a la vista de mercado. La divisa sí se conserva. Antes sobrevivían porque el
  provider estaba por encima del router.
- `.env.production` lleva un `VITE_SITE_URL` de marcador de posición que hay que cambiar por
  el dominio real en el primer despliegue.

---

## [0.1.0] — 2026-09-09 — Modernización de plataforma

### Cambiado

- React 18.2 → 19.2, Vite 4.3 → 8.2 (Rolldown), Tailwind 3.3 → 4.3 (CSS-first),
  Recharts 2.6 → 3.10, react-router-dom 6.12 → react-router 8.3.
- ESLint y sus tres plugins sustituidos por **oxlint + oxfmt** (versión exacta fijada).
  Prettier no se eliminó: nunca estuvo instalado.
- Todo el código migrado de `.jsx` a TypeScript 7 en modo strict.
- Arquitectura feature-first; los tres Context de fetching sustituidos por TanStack Query.
- **Paleta rediseñada.** La anterior fallaba cuatro pares de contraste, entre ellos el color
  de todas las cabeceras de tabla (4.08:1) y el de todas las bajadas de precio (3.75:1).

### Añadido

- `PRODUCT.md`, `ARCHITECTURE.md`, `CLAUDE.md`.
- `pnpm contrast`: verificación WCAG que lee los tokens del propio CSS.
- `pnpm smoke`: 18 comprobaciones end-to-end en Chromium.
- Husky, lint-staged, commitlint y `.editorconfig`.

### Corregido

Los 12 defectos del inventario de deuda técnica, entre ellos:

- Un 429 dejaba un **spinner infinito**, porque "cargando" y "error" eran el mismo estado
  (`undefined`).
- `import { data } from "autoprefixer"` en la vista de tendencias: todas las claves de lista
  eran `undefined`, y además arrastraba autoprefixer y postcss enteros al bundle de cliente.
- El desplegable de orden usaba `onClick` en vez de `onChange` —no respondía al teclado— y
  `text-transparent` dejaba invisible el valor seleccionado.
- El gráfico fijaba `vs_currency=usd` e ignoraba la divisa elegida.
- `data?.links?.homepage[0]` rompía el encadenamiento opcional y lanzaba TypeError.
- El modal no tenía semántica de diálogo, ni trampa de foco, ni cierre con Escape.

### Cambio que rompe compatibilidad

- **Se elimina "saltar a la última página".** Se basaba en `setTotalPage(13220)`, un número
  escrito a mano (la llamada que lo derivaba estaba comentada), así que apuntaba a una
  página inventada. CoinGecko no devuelve un total en `/coins/markets`; la paginación pasa a
  ser por cursor: "siguiente" existe si la página vino llena.

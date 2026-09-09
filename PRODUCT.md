# PRODUCT.md — Cryptosh1f

> Fuente de verdad del producto. Todo lo que aquí se afirma es **verificable en el código**
> salvo lo marcado como `[SUPUESTO]`, que requiere confirmación del propietario.

---

## Visión

Un consultor de mercado de criptomonedas que responde tres preguntas en un solo vistazo,
sin registro y sin fricción:

1. **¿Qué está pasando en el mercado ahora mismo?** — precios en vivo, ordenables y paginados.
2. **¿Qué está llamando la atención?** — las monedas en tendencia del momento.
3. **¿Qué me importa a mí?** — una lista personal que persiste entre visitas.

El producto no intermedia operaciones ni custodia fondos: **es una capa de consulta sobre datos
públicos de mercado.** Esa restricción es deliberada y define todo lo demás.

`[SUPUESTO]` El proyecto nace como pieza de portafolio técnico además de herramienta de uso
propio. Esto importa porque justifica invertir en calidad de código visible (tipos, tests,
accesibilidad) por encima de features nuevas.

---

## Usuarios

### Primario — el observador de mercado
Sigue un puñado de monedas de forma recurrente. No opera todos los días; quiere comprobar
estado rápido. **Necesita:** carga rápida, su lista guardada intacta, cifras legibles.
**Evidencia en el código:** la feature de guardado persiste en `localStorage` bajo la clave
`coins` y sobrevive a recargas y a cierres del navegador.

### Secundario — el explorador
Llega sin una moneda en mente. Navega el ranking por capitalización, busca por nombre y abre
detalles. **Necesita:** buscador tolerante, orden configurable, paginación.
**Evidencia:** buscador con debounce contra `/search`, 6 modos de orden, `per page` configurable
de 1 a 250.

### Anti-usuario — el trader activo
**Este producto no es para él y no debe optimizarse para él.** Los datos no son de tiempo real
(no hay websockets ni polling), no hay libro de órdenes, ni alertas, ni velas intradía. El
gráfico solo ofrece 7/14/30 días con intervalo diario.

---

## Features (implementadas y verificadas)

| # | Feature | Dónde vive |
|---|---|---|
| F1 | Tabla de mercado paginada, con precio, volumen, cap. de mercado y variación a 1h/24h/7d | `TableComponent.jsx` |
| F2 | Búsqueda de monedas con debounce y selección desde un desplegable | `Search.jsx` |
| F3 | Orden por cap. de mercado, volumen o id (asc/desc) | `Fillters.jsx` |
| F4 | Divisa de visualización configurable | `Fillters.jsx` |
| F5 | Paginación con salto múltiple y tamaño de página ajustable | `Pagination.jsx` |
| F6 | Modal de detalle con métricas, sentimiento y enlaces oficiales | `CryptoDetails.jsx` |
| F7 | Gráfico de precio / cap. de mercado / volumen a 7, 14 o 30 días | `Chart.jsx` |
| F8 | Monedas en tendencia | `Trending.jsx` |
| F9 | Lista de guardados persistente en el navegador | `StorageContext.jsx` |
| F10 | Reinicio de filtros y refresco manual | `Fillters.jsx`, `Trending.jsx`, `Saved.jsx` |

El modal (F6) es accesible desde **las tres** vistas de lista mediante la misma ruta hija
`:coinId` repetida en cada una.

---

## No-features (decisiones explícitas de NO construir)

- **Sin cuentas ni autenticación.** El estado del usuario vive solo en su navegador. Consecuencia
  aceptada: la lista de guardados no se sincroniza entre dispositivos.
- **Sin backend propio.** Todo va directo del navegador a CoinGecko. Consecuencia aceptada: la
  API key no puede protegerse, así que el producto opera en el plan gratuito.
- **Sin datos en tiempo real.** Los datos se piden al montar y al cambiar un filtro.
- **Sin operativa, cartera ni P&L.** Nada de saldos, ni conexión a exchanges o wallets.
- **Sin alertas ni notificaciones.**

---

## Reglas de negocio

1. **CoinGecko es la única fuente de datos.** Ninguna cifra se calcula ni deriva localmente,
   salvo el porcentaje de la barra alto/bajo de 24h (`HighLowIndicator`) y el formateo de moneda.
2. **La atribución a CoinGecko es obligatoria** y debe permanecer visible (`TableComponent.jsx`).
   Es requisito de su plan gratuito, no un detalle estético.
3. **La lista de guardados es propiedad del usuario.** Se almacena como un array de ids de moneda
   y nunca se envía a ningún servidor.
4. **La divisa elegida aplica a todas las cifras monetarias de forma consistente.**
   *(Hoy se incumple: `Chart.jsx` fuerza USD — corregido en Fase 6.)*
5. **Una moneda sin datos nunca debe romper la vista.** Los campos opcionales de CoinGecko
   (foro, subreddit, GitHub, Facebook) se ocultan si vienen vacíos.

---

## Restricciones

### R1 — Límite de tasa de CoinGecko (restricción de primer orden)
Sin API key el plan gratuito permite del orden de **10–30 peticiones por minuto**. Es el factor
que más condiciona la arquitectura:

- Obliga a cachear en cliente; sin caché, navegar entre pestañas agota la cuota.
- Obliga a que el estado de error sea **distinto** del de carga, porque un 429 es un resultado
  esperable en uso normal, no una anomalía.
- Obliga a que los tests usen mocks (MSW) y jamás la API real.

### R2 — Sin secretos en cliente
Al no haber backend, cualquier credencial embebida sería pública. El producto debe funcionar
correctamente **sin** API key.

### R3 — Compatibilidad de navegador
Navegadores modernos con soporte de `localStorage`, `Intl.NumberFormat` y `AbortController`.
Sin soporte para IE ni navegadores heredados.

### R4 — Accesibilidad WCAG 2.2 AA
Objetivo de calidad adoptado formalmente. Condiciona la paleta: los tokens de color deben
alcanzar 4.5:1 para texto normal, lo que obligó a rediseñar el sistema de color.

---

## Métricas de éxito

| Métrica | Objetivo | Cómo se mide |
|---|---|---|
| Lighthouse Performance | ≥ 95 | Lighthouse CI sobre el build de producción |
| Lighthouse Accessibility | 100 | Lighthouse + axe + verificación de contraste por token |
| Peticiones por sesión típica | Reducción medible frente a la línea base sin caché | Contador en devtools durante el guion de humo |
| Errores visibles sin salida | **0** | Ningún estado de fallo puede quedar sin acción de reintento |
| Tiempo hasta la primera fila de datos | < 2 s en 4G simulada | Lighthouse, trazas de red |

**Criterio de fallo explícito:** si un 429 de CoinGecko deja al usuario ante un spinner sin
explicación ni reintento, el producto se considera roto aunque no haya excepción en consola.

---

## Alcance de esta release

**Incluido:** modernización completa de la plataforma (React 19, Vite 8, Tailwind 4, router 7,
Recharts 3), TypeScript strict, tooling OXC, rediseño de la paleta con contraste verificado,
capa de datos con caché y errores reales, corrección de 12 defectos, tests, CI y despliegue a
Cloudflare Pages.

**Explícitamente fuera:** cualquier feature de producto nueva. Esta release **no añade nada que
el usuario pueda hacer y antes no pudiera** — cambia cómo de bien funciona lo que ya existe.

## Alcance futuro (no comprometido)

Comparar monedas lado a lado · rangos de gráfico configurables (90d, 1a, máx) · tema claro ·
i18n (la UI está en inglés y el código en español) · exportar la lista de guardados ·
PWA con lectura sin conexión.

# DESIGN_SYSTEM.md — Cryptosh1f

> Los tokens viven en `src/styles/theme.css`, dentro de un bloque `@theme` de Tailwind 4.
> `pnpm contrast` **lee ese archivo directamente**, así que las cifras de esta página no
> pueden desviarse de lo que usa la aplicación sin que el comando se ponga en rojo.

---

## Marca

### El símbolo — "the shift mark"

Un trazo cian continuo que sube en **dos escalones de altura desigual** (4 y 6 unidades de
una rejilla de 32, proporción 2:3) y termina en un **chaflán de 45°**.

```
M6 23 H11.5 V19 H17 V13 H22 L26.5 8.5
```

Tres decisiones, tres motivos:

- **Escalones desiguales.** Dos escalones iguales producen el icono de barras que usa media
  categoría. La proporción 2:3 hace que el recorrido lea como una trayectoria concreta.
- **Chaflán en vez de punta de flecha.** Convierte la escalera en flecha sin añadir un
  elemento aparte, que es lo primero que se pierde a 16 px.
- **Un solo `path`.** A tamaño de pestaña quedan tres trazos cian sobre un cuadrado oscuro,
  que es exactamente lo que se puede distinguir ahí.

Grosor 3.2, `stroke-linecap` y `stroke-linejoin` redondeados. Sobre cuadrado de esquinas
redondeadas (`rx="8"` sobre 32).

### El logotipo

`Crypto` en `--color-fg` peso 400 + `sh1f` en `--color-accent` peso 700. Es **texto HTML**,
no trazados ni imagen: pesa cero bytes, hereda el tema, se selecciona y se busca en la
página. El `1` va en color de acento porque es lo único distintivo del nombre.

### Archivos

| Archivo                               | Uso                                              | Peso             |
| ------------------------------------- | ------------------------------------------------ | ---------------- |
| `src/components/BrandMark.tsx`        | símbolo en la interfaz, con tokens del tema      | ~600 B de fuente |
| `public/favicon.svg`                  | pestaña del navegador, mismo dibujo en hex crudo | 264 B            |
| `public/apple-touch-icon.png`         | iOS, 180×180                                     | 1.5 kB           |
| `public/icon-192.png`, `icon-512.png` | manifiesto web                                   | 1.7 / 4.3 kB     |
| `public/og.jpg`                       | tarjeta de enlace, 1200×630                      | 43.7 kB          |

Los mapas de bits se generan con `pnpm icons`, que rasteriza el SVG con el Chromium de
Playwright. Se commitean para que `pnpm build` no dependa de que haya un navegador
instalado. **Al cambiar el símbolo hay que tocar los dos archivos fuente** —el componente y
el SVG— y volver a ejecutar `pnpm icons`.

---

## Color

Los tokens son **semánticos**, nunca crudos: se escribe `bg-surface-raised`, jamás
`bg-neutral-800`. Eso permite mover un tono sin repasar los componentes uno a uno.

### Superficies

| Token             | Valor     | Dónde                      |
| ----------------- | --------- | -------------------------- |
| `surface-base`    | `#0b0d10` | fondo de página            |
| `surface-raised`  | `#14171c` | tarjetas, filas, modal     |
| `surface-control` | `#1e222a` | inputs, botones inactivos  |
| `surface-hover`   | `#272c35` | hover de fila y de control |

### Texto

| Token          | Valor     | Dónde                         |
| -------------- | --------- | ----------------------------- |
| `fg`           | `#eef1f5` | cifras, títulos               |
| `fg-secondary` | `#c3cad5` | cuerpo                        |
| `fg-muted`     | `#949daa` | cabeceras de tabla, etiquetas |
| `fg-inverse`   | `#0b0d10` | sobre fondos de acento        |

### Marca y estado

| Token          | Valor     | Dónde                         |
| -------------- | --------- | ----------------------------- |
| `accent`       | `#14ffec` | ancla de marca, enlaces, foco |
| `accent-hover` | `#7bfff2` | hover del acento              |
| `positive`     | `#3ee07f` | variación de precio al alza   |
| `negative`     | `#ff7a94` | variación de precio a la baja |
| `line`         | `#272c35` | separadores suaves            |
| `line-strong`  | `#666e7d` | bordes de componente          |
| `focus`        | `#14ffec` | anillo de foco                |

**No se añaden colores arbitrarios.** Un valor nuevo entra como token, con su par declarado
en `scripts/check-contrast.mjs`, o no entra.

### Contraste medido — WCAG 2.2 AA, 20/20

Umbral 4.5:1 para texto normal, 3:1 para bordes y foco.

| Par                               | Ratio   | Umbral |
| --------------------------------- | ------- | ------ |
| `fg` / `surface-base`             | 17.17:1 | 4.5    |
| `fg-secondary` / `surface-base`   | 11.79:1 | 4.5    |
| `fg-muted` / `surface-base`       | 7.10:1  | 4.5    |
| `accent` / `surface-base`         | 15.33:1 | 4.5    |
| `positive` / `surface-base`       | 11.28:1 | 4.5    |
| `negative` / `surface-base`       | 7.84:1  | 4.5    |
| `fg` / `surface-raised`           | 15.86:1 | 4.5    |
| `fg-secondary` / `surface-raised` | 10.89:1 | 4.5    |
| `fg-muted` / `surface-raised`     | 6.55:1  | 4.5    |
| `accent` / `surface-raised`       | 14.15:1 | 4.5    |
| `positive` / `surface-raised`     | 10.41:1 | 4.5    |
| `negative` / `surface-raised`     | 7.24:1  | 4.5    |
| `fg` / `surface-control`          | 14.07:1 | 4.5    |
| `fg-muted` / `surface-control`    | 5.82:1  | 4.5    |
| `accent` / `surface-control`      | 12.56:1 | 4.5    |
| `fg-inverse` / `accent`           | 15.33:1 | 4.5    |
| `line-strong` / `surface-base`    | 3.79:1  | 3.0    |
| `line-strong` / `surface-raised`  | 3.50:1  | 3.0    |
| `focus` / `surface-base`          | 15.33:1 | 3.0    |
| `focus` / `surface-raised`        | 14.15:1 | 3.0    |

Contexto de por qué existe esta tabla: la paleta anterior fallaba cuatro pares, entre ellos
el color de **todas** las cabeceras de tabla (4.08:1) y el de **todas** las bajadas de
precio (3.75:1).

---

## Tipografía

**Nunito**, servida desde Google Fonts con `preconnect` y `display=swap`. Reserva:
`ui-sans-serif, system-ui, sans-serif`.

| Token       | Valor    |
| ----------- | -------- |
| `text-sm`   | 0.875rem |
| `text-base` | 1rem     |
| `text-md`   | 1.125rem |
| `text-lg`   | 1.5rem   |
| `text-xl`   | 2rem     |

La escala está **redefinida**, no extendida: `text-2xl` y demás no existen. Un tamaño nuevo
se añade al `@theme` o no se usa.

---

## Espaciado y disposición

Se usa la escala por defecto de Tailwind (múltiplos de `0.25rem`). Breakpoints en uso:

| Nombre | Valor | Nota                                                       |
| ------ | ----- | ---------------------------------------------------------- |
| `xs`   | 30rem | definido a mano; el código lo usaba antes de que existiera |
| `sm`   | 40rem | por defecto                                                |
| `lg`   | 64rem | por defecto                                                |

Las vistas son `w-[90%] xs:w-[80%]` con `mt-8 lg:mt-16`. La tabla siempre va dentro de un
contenedor con `overflow-x-auto`: es la red de seguridad que impide que un símbolo largo
haga scrollar la página entera en horizontal, comprobado a 375 px en la prueba de humo.

---

## Iconografía

**No hay librería de iconos.** Los pocos que hay son SVG en línea dentro del componente que
los usa. Antes había 12 SVG sueltos en `assets/` y un `icons.jsx` cuyo único import estaba
comentado; añadir una dependencia de iconos para tres glifos no se sostenía.

Todo icono decorativo lleva `aria-hidden="true"`. Un icono que es la única etiqueta de un
botón exige `aria-label` en el botón.

---

## Componentes

| Componente           | Regla                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `QueryState`         | Toda vista con datos pasa por aquí: distingue carga, error, vacío y éxito, y ofrece reintentar. No escribas `data ? … : <Spinner/>` |
| `CoinTable`          | Tabla compartida por mercado y guardados. El destino de sus enlaces es una prop, no un valor fijo                                   |
| `SaveButton`         | Botón de estrella con `aria-pressed` y etiqueta accesible                                                                           |
| `Spinner`            | Renderiza un `<output>` con etiqueta; la prueba de humo cuenta `<output>` para detectar spinners colgados                           |
| `ErrorBoundary`      | En la raíz y por feature. Un fallo del gráfico no debe tumbar la tabla                                                              |
| `BrandMark` / `Logo` | Ver arriba                                                                                                                          |

## Movimiento

Solo transiciones de color (`transition-colors`) y el giro del indicador de recarga. No hay
librería de animación. Cualquier movimiento nuevo debe respetar `prefers-reduced-motion`.

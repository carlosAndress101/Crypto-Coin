# CONTRIBUTING.md

## Puesta en marcha

```bash
nvm use            # lee .nvmrc; el proyecto exige Node >= 22.22
pnpm install       # instala y activa los hooks de husky
pnpm dev
```

Para ejecutar la prueba de humo hace falta el navegador de Playwright una sola vez:

```bash
pnpm exec playwright install chromium
```

## El ciclo

```bash
pnpm check       # typecheck + lint + format:check + contrast   (rápido, en cada guardado)
pnpm validate    # check + build + smoke                        (antes de abrir un PR)
pnpm verify      # validate + pnpm audit --prod                 (antes de publicar)
```

`pnpm validate` pasa limpio en `HEAD`. Si falla, lo ha roto tu cambio.

## Antes de escribir código

Lee `ARCHITECTURE.md`. En concreto la tabla **"Quién es dueño de cada estado"**: la mayoría
de las decisiones dudosas que aparecen en este proyecto se resuelven ahí sin discusión.

Dos reglas que no se negocian porque cada una costó un fallo real:

1. **Los filtros van en la URL, no en un Context.** Si el estado nuevo debería poder
   compartirse por enlace, es un search param. Pasa por `useMarketsFilters()`, que concentra
   los clamps y la invariante "cambiar un filtro vuelve a la página 1".
2. **Los datos se piden con `useQuery`, no en route loaders.** Un loader no distingue un 429
   de una lista vacía. Toda vista con datos pasa por `<QueryState>`.

## Estilo

Lo decide la herramienta, no la discusión: **oxlint** para corrección y **oxfmt** para
formato. Ambos corren en el hook de pre-commit sobre los archivos que tocas. No hay ESLint
ni Prettier, y no se van a añadir.

Lo que la herramienta no puede comprobar:

- **Los comentarios explican por qué, no qué.** Un comentario que parafrasea la línea de
  abajo sobra. Un comentario que dice "esto se hace así porque lo contrario provocaba X"
  vale su peso en oro; en este repo hay varios y son deliberados.
- **Colores por token semántico**: `bg-surface-raised`, nunca `bg-neutral-800`. Un color
  nuevo entra como token en `src/styles/theme.css` con su par declarado en
  `scripts/check-contrast.mjs`, o no entra.
- **Una feature nunca importa de otra feature.** Si dos la necesitan, sube a `components/`
  o a `lib/`.

## Accesibilidad

No es una fase final, es un criterio de aceptación. `pnpm smoke` ejecuta axe-core sobre las
tres vistas y sobre el modal abierto, con las etiquetas `wcag2a`, `wcag2aa`, `wcag21a`,
`wcag21aa` y `wcag22aa`. **Cero infracciones** es el estado actual y el que hay que mantener.

Prefiere siempre lo nativo antes que reimplementarlo: el diálogo de detalle es un `<dialog>`
con `showModal()` porque así la trampa de foco, el cierre con Escape, `aria-modal` y la
devolución del foco vienen de serie y sin código.

## Pruebas

No hay runner de tests unitarios. Hay una suite end-to-end, `scripts/smoke.mjs`: 45
comprobaciones sobre el build de producción en Chromium, con todas las llamadas a CoinGecko
interceptadas.

Añade una comprobación cuando arregles un fallo o cambies comportamiento observable. El
archivo son bloques `{ }` numerados en comentarios; para ejecutar uno solo, comenta los
demás.

Hay dos comprobaciones que parecen raras y no lo son. **No las borres:**

- _"no dispara una segunda petición de mercado"_ — protege el límite de tasa de CoinGecko.
  Si alguien deshace la ruta layout sin path, la lista se remonta y vuelve a pedirlo todo.
- _"Recharts no está en el bundle inicial"_ — el 47% de reducción del JS inicial depende de
  que nadie importe el gráfico desde una ruta temprana.

## Commits

**Conventional Commits**, verificados por commitlint en el hook `commit-msg`. Los mensajes
de este repositorio van en español; los tipos, en inglés.

```
feat: nueva identidad de marca y favicon ligero
fix: cubrir los ficheros .mjs en el hook de pre-commit
perf: dividir el bundle por ruta y sacar recharts del chunk inicial
```

El cuerpo debe decir **por qué**, y traer números o evidencia cuando el cambio los tenga.
"Mejora el rendimiento" no vale; "788.18 kB → 416.48 kB, medido con `vite build`" sí.

**No uses `git commit --no-verify`.** Si el hook falla, arregla lo que señala.

## Antes de abrir un PR

- [ ] `pnpm validate` en verde
- [ ] Documentación actualizada si cambiaste arquitectura, tokens o la API
- [ ] `CHANGELOG.md` actualizado si el cambio se nota desde fuera
- [ ] Los cambios que rompen algo, declarados explícitamente en el PR

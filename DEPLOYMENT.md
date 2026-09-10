# DEPLOYMENT.md — Cryptosh1f

Destino: **Cloudflare Pages**. Salida estática, sin servidor, sin funciones.

Dominio de producción: **https://crypto-coin-5yz.pages.dev**

---

## Configuración del proyecto en Cloudflare Pages

Conecta el repositorio de GitHub desde el panel (_Workers & Pages → Create → Pages →
Connect to Git_). Esa integración despliega en cada push a `master` y crea una previsualización
por cada pull request, sin necesidad de ningún workflow en el repositorio.

| Ajuste                 | Valor        |
| ---------------------- | ------------ |
| Framework preset       | None         |
| Build command          | `pnpm build` |
| Build output directory | `dist`       |
| Root directory         | `/`          |
| Production branch      | `master`     |

Variables de entorno del build:

| Variable        | Valor                               | Ámbito               |
| --------------- | ----------------------------------- | -------------------- |
| `VITE_SITE_URL` | `https://crypto-coin-5yz.pages.dev` | Production y Preview |
| `NODE_VERSION`  | `22.22.0`                           | Production y Preview |

`NODE_VERSION` tiene que ir explícita: Cloudflare no lee `.nvmrc`, y `package.json` exige
`node >= 22.22.0`. Cloudflare detecta pnpm por el `pnpm-lock.yaml`; el `packageManager`
del `package.json` fija la versión exacta.

> **`VITE_SITE_URL` no es opcional.** Si falta, el build **falla a propósito**
> (`vite.config.ts`): un sitemap apuntando a localhost publicado en producción es peor que
> no tener sitemap. En las previsualizaciones puedes dejar el dominio de producción o
> poner el de la rama; solo afecta a las etiquetas Open Graph y al sitemap.

## Sin GitHub Actions

**No hay `.github/workflows/`.** La integración Git de Cloudflare cubre el despliegue, así
que un workflow solo aportaría ejecutar `pnpm validate` en los pull requests. Es deuda
conocida y está declarada como tal: hasta que exista, la validación es manual
(`pnpm validate` antes de abrir un PR, ver `CONTRIBUTING.md`).

Cloudflare **no** ejecuta typecheck, lint ni pruebas: solo `pnpm build`. Un despliegue
verde no significa que el código esté validado.

## Variables de entorno y el dominio

El dominio existe en **un solo sitio**, `.env.production`, y de ahí se derivan tres cosas:

| Artefacto                                       | Cómo se genera                                                                                                                                                                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Etiquetas `og:url`, `og:image`, `twitter:image` | El plugin de `vite.config.ts` sustituye `__SITE_URL__` en `index.html`. Lo hace el plugin y no el mecanismo `%VAR%` de Vite porque ese solo mira el modo actual y en `pnpm dev` dejaba el marcador sin resolver |
| `robots.txt`                                    | Lo emite un plugin de `vite.config.ts` durante el build                                                                                                                                                         |
| `sitemap.xml`                                   | Igual, con las tres rutas reales de la aplicación                                                                                                                                                               |

`robots.txt` y `sitemap.xml` **no están en `public/`**: si estuvieran, el dominio viviría
en tres archivos a la vez y podrían desincronizarse en silencio. Para cambiar de dominio,
toca `.env.production` (o define `VITE_SITE_URL` en el panel de Cloudflare, que tiene
prioridad) y reconstruye. No hay ninguna otra copia.

`robots.txt` incluye `Disallow: /*?` porque el detalle de una moneda es la misma página con
un modal encima: rastrear `/{coinId}` para miles de monedas no aporta contenido nuevo. El
sitemap declara solo `/`, `/trending` y `/saved`.

## Cabeceras y enrutado

Dos archivos de `public/` que Cloudflare copia a la raíz y consume:

- **`_headers`** — CSP, HSTS, `Referrer-Policy`, `Permissions-Policy`, políticas de origen
  cruzado y cacheado. Los motivos de cada decisión están en `SECURITY.md`.
- **`_redirects`** — `/*  /index.html  200`, el fallback de aplicación de una sola página.
  **Sin esto, un enlace directo a `/saved/bitcoin` devuelve 404**: esa ruta no es un
  archivo, solo existe dentro del router del cliente. El `200` (y no un `301`) es lo que
  mantiene la URL intacta para que el router la lea.

Ninguno de los dos lo aplica `vite preview`, que es un servidor de archivos plano. Es por
eso que la comprobación de CSP de la suite de humo inyecta la cabecera leyéndola de
`dist/_headers` en vez de confiar en el servidor local.

## Cacheado

| Ruta                    | Política                      | Por qué                                                                                                       |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `/assets/*`, `/fonts/*` | `max-age=31536000, immutable` | Los nombres llevan hash de contenido: un cambio produce un nombre nuevo                                       |
| `/`, `/index.html`      | `max-age=0, must-revalidate`  | Es lo único sin hash, y es quien dice qué assets pedir. Si se cacheara, un despliegue nuevo no llegaría nunca |

## Comprobaciones antes de desplegar

```bash
pnpm install
pnpm validate        # typecheck, lint, formato, contraste, build y 49 comprobaciones de humo
pnpm audit --prod
```

Y sobre el build, que es lo que se sube:

```bash
grep -c crypto-coin-5yz dist/robots.txt dist/sitemap.xml dist/index.html   # el dominio real, en los tres
ls dist/_headers dist/_redirects                                            # llegaron a dist
```

## Después del primer despliegue

Lo que no se puede verificar en local y hay que mirar una vez esté publicado:

- [ ] `curl -sI https://crypto-coin-5yz.pages.dev | grep -i content-security-policy` devuelve la política. Si sale vacío, `_headers` no llegó a la raíz de `dist`.
- [ ] `https://crypto-coin-5yz.pages.dev/saved/bitcoin` carga la aplicación y no un 404 (comprueba `_redirects`).
- [ ] La consola del navegador no muestra violaciones de CSP con las imágenes **reales** de CoinGecko. En local se interceptan, así que el host `coin-images.coingecko.com` solo se ha verificado contra la API, no contra la página desplegada.
- [ ] El favicon y la tarjeta de enlace aparecen al compartir la URL en un chat.
- [ ] `robots.txt` y `sitemap.xml` responden y apuntan al dominio correcto.

## Rollback

Cloudflare Pages guarda cada despliegue. En el panel, _Deployments → el anterior →
Rollback_: es instantáneo y no requiere tocar el repositorio.

Para revertir también el código, cada cambio va en su propio commit:
`git revert <sha>` y push a `master` dispara un despliegue nuevo.

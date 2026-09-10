# SECURITY.md — Cryptosh1f

## Modelo de amenaza, en una frase

Es una aplicación de una sola página, sin backend, sin cuentas y sin datos de usuario más
allá de una lista de identificadores de moneda en `localStorage`. No hay nada que robar en
el servidor porque no hay servidor: solo archivos estáticos. Las superficies reales son
tres, y las tres se cierran con cabeceras y validación de entrada.

| Superficie                        | Riesgo                                        | Mitigación                                                 |
| --------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| Respuestas de una API de terceros | Datos con forma inesperada llegando al render | Validación con Zod en la frontera (`src/lib/coingecko.ts`) |
| Search params de la URL           | Entrada arbitraria en el primer pintado       | Esquemas Zod con `.catch()` en todos los campos            |
| El propio HTML servido            | Inyección, clickjacking, fuga de referrer     | `public/_headers`                                          |

## Sin secretos, a propósito

**No hay API key y no puede haberla.** Sin backend, cualquier credencial embebida en el
cliente sería pública: basta abrir las herramientas de desarrollo. El proyecto opera en el
plan gratuito de CoinGecko y asume el límite de ~10–30 peticiones por minuto como
restricción de diseño (ver `PRODUCT.md` → R2 y `API.md`).

La única variable de entorno es `VITE_SITE_URL`, que es el dominio público. No es un
secreto: por eso `.env.production` está commiteado. Todo lo que Vite expone al cliente
lleva el prefijo `VITE_`, así que nada más del entorno puede filtrarse por accidente.

## Content-Security-Policy

La política vive en `public/_headers`. Cada directiva está ahí por algo verificado en el
build, no por precaución:

| Directiva                   | Valor                                                         | Por qué                                                                                   |
| --------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `default-src`               | `'self'`                                                      | Base cerrada; todo lo demás abre lo mínimo                                                |
| `script-src`                | `'self'`                                                      | El HTML construido no tiene **ni un** script en línea. Verificado sobre `dist/index.html` |
| `style-src`                 | `'self' 'unsafe-inline'`                                      | **La única concesión.** Ver abajo                                                         |
| `img-src`                   | `'self' data: coin-images.coingecko.com assets.coingecko.com` | Los iconos de moneda vienen de ahí; el host se confirmó pidiéndole una moneda a la API    |
| `font-src`                  | `'self'`                                                      | La tipografía está autoalojada; no hay terceros                                           |
| `connect-src`               | `'self' https://api.coingecko.com`                            | El único destino de red de la aplicación                                                  |
| `manifest-src`              | `'self'`                                                      | `site.webmanifest`                                                                        |
| `form-action`               | `'self'`                                                      | Los formularios son filtros locales; nada se envía fuera                                  |
| `base-uri`                  | `'self'`                                                      | Impide que una inyección de `<base>` reescriba todas las rutas relativas                  |
| `frame-ancestors`           | `'none'`                                                      | Anticlickjacking. Es la versión moderna de `X-Frame-Options`                              |
| `object-src`                | `'none'`                                                      | No hay plugins ni `<embed>`                                                               |
| `upgrade-insecure-requests` | —                                                             | Red de seguridad si alguna URL http se cuela                                              |

### Por qué `style-src` lleva `'unsafe-inline'`

Es técnicamente necesario y se ha reducido al mínimo posible.

No hay **elementos** `<style>` en el HTML construido (verificado: cero coincidencias). Lo
que sí hay son **atributos** `style` en línea, en tres sitios: la barra de rango del
diálogo de detalle, el hueco que la tabla reserva mientras carga, y sobre todo Recharts,
que pinta el SVG entero con estilos en línea. CSP no distingue un atributo `style` de un
bloque `<style>` dentro de `style-src`.

Se evaluó y **descartó** `style-src 'self'; style-src-attr 'unsafe-inline'`, que sería más
estrecho: su soporte entre navegadores es desigual, y en uno que no entienda
`style-src-attr` la política cae a `style-src`, que bloquearía los atributos y rompería la
interfaz. Una CSP más estricta que deja la aplicación inservible en algunos navegadores no
es más segura, es peor.

El riesgo residual es bajo: `'unsafe-inline'` en `style-src` no permite ejecutar código.
Habilita ataques de exfiltración por CSS, que requieren que el atacante ya haya conseguido
inyectar marcado — y eso lo cierra `script-src 'self'`, que sigue siendo estricto.

### Zod y `unsafe-eval`

`script-src` **no** lleva `'unsafe-eval'`, y hubo que trabajar para que no hiciera falta.

Zod 4 compila validadores con `Function("")` para ir más rápido, y detecta si puede
hacerlo probándolo dentro de un `try/catch`. Bajo esta CSP la prueba falla, Zod cae al
camino interpretado y **la aplicación funciona igual** — pero el intento disparaba un
`securitypolicyviolation` en cada carga de página. Eso ensucia la consola y, en cuanto haya
un endpoint de informes de CSP, lo inundaría con un falso positivo indistinguible de un
ataque real.

`src/lib/zod.ts` activa `jitless: true`, que se salta la sonda. **Importa `z` de ese
módulo, nunca de `"zod"`:** Zod lee la bandera al _construir_ el esquema, no al validar, así
que configurarla desde `main.tsx` llega tarde. Exportando `z` desde ahí, el orden lo
garantiza el grafo de imports en vez de una convención que alguien olvidará.

## Otras cabeceras

| Cabecera                       | Valor                                          | Por qué                                                                                                                                      |
| ------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Strict-Transport-Security`    | `max-age=63072000; includeSubDomains; preload` | Dos años. Cloudflare Pages solo sirve por HTTPS, así que no hay riesgo de bloquearse fuera                                                   |
| `Referrer-Policy`              | `strict-origin-when-cross-origin`              | Los enlaces salientes al sitio de una moneda no deben filtrar qué moneda estabas mirando                                                     |
| `X-Content-Type-Options`       | `nosniff`                                      |                                                                                                                                              |
| `X-Frame-Options`              | `DENY`                                         | Redundante con `frame-ancestors`, pero cubre navegadores viejos                                                                              |
| `Permissions-Policy`           | todo a `()`                                    | La aplicación no usa cámara, micrófono, geolocalización ni pagos. Negarlo todo evita que un cambio futuro los active sin que nadie lo decida |
| `Cross-Origin-Opener-Policy`   | `same-origin`                                  | Aísla la ventana de cualquier abridor                                                                                                        |
| `Cross-Origin-Resource-Policy` | `same-origin`                                  | Nada de lo que servimos debe poder incrustarse desde fuera                                                                                   |

### Por qué NO hay `Cross-Origin-Embedder-Policy`

`require-corp` exigiría que **cada** recurso de origen cruzado llegara con su propia
cabecera `Cross-Origin-Resource-Policy`. Los iconos de moneda los sirve CoinGecko, que no
las manda y que no controlamos: activarlo dejaría la tabla sin imágenes. Solo tendría
sentido si hiciera falta `SharedArrayBuffer`, y no hace falta.

## Verificación

La CSP no se revisa a ojo. `pnpm smoke` lee la política de `dist/_headers` —el archivo que
Cloudflare va a servir de verdad, así que la prueba no puede desincronizarse de lo
desplegado—, la inyecta en el navegador y comprueba **cero violaciones** en las tres vistas
y en el diálogo de detalle abierto, más que la tipografía propia se aplica y que el gráfico
se dibuja.

```bash
pnpm validate        # typecheck + lint + formato + contraste + build + humo (49 comprobaciones)
pnpm audit --prod    # vulnerabilidades conocidas en dependencias de producción
```

## Cómo informar de un problema

Abre un issue en el repositorio. No hay datos de usuario en juego, así que no hace falta un
canal privado; si encuentras algo que sí lo requiera, dilo en el issue sin detalles y se
buscará otra vía.

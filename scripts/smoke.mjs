#!/usr/bin/env node
/**
 * Prueba de humo end-to-end contra el build de producción.
 *
 * Todas las llamadas a CoinGecko se interceptan: la API real tiene un límite de
 * ~10–30 req/min, así que un test que la usara sería lento, no determinista y además
 * gastaría la cuota del desarrollador. Interceptar permite también provocar un 429 a
 * voluntad, que es justo el escenario que la aplicación gestionaba mal.
 *
 *   pnpm build && node scripts/smoke.mjs
 */
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { spawn } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const BASE = "http://localhost:4173";

const marketCoin = (id, name, symbol) => ({
  id,
  symbol,
  name,
  image: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
  current_price: 42123.45,
  market_cap: 800000000000,
  market_cap_rank: 1,
  total_volume: 25000000000,
  market_cap_change_percentage_24h: 2.5,
  price_change_percentage_1h_in_currency: 0.4,
  price_change_percentage_24h_in_currency: -1.2,
  price_change_percentage_7d_in_currency: 5.6,
});

const MARKETS = [
  marketCoin("bitcoin", "Bitcoin", "btc"),
  marketCoin("ethereum", "Ethereum", "eth"),
];

const COIN_DETAIL = {
  id: "bitcoin",
  symbol: "btc",
  name: "Bitcoin",
  market_cap_rank: 1,
  coingecko_rank: 1,
  coingecko_score: 80,
  sentiment_votes_up_percentage: 70,
  sentiment_votes_down_percentage: 30,
  image: { large: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" },
  market_data: {
    current_price: { usd: 42123.45 },
    market_cap: { usd: 800000000000 },
    fully_diluted_valuation: { usd: 880000000000 },
    total_volume: { usd: 25000000000 },
    high_24h: { usd: 43000 },
    low_24h: { usd: 41000 },
    max_supply: 21000000,
    circulating_supply: 19600000,
    price_change_percentage_24h: -1.2,
  },
  links: { homepage: ["https://bitcoin.org"], blockchain_site: [], repos_url: { github: [] } },
};

const TRENDING = {
  coins: [
    {
      item: {
        id: "solana",
        coin_id: 4128,
        name: "Solana",
        small: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
        market_cap_rank: 5,
        price_btc: 0.0032,
        score: 0,
      },
    },
  ],
};

const CHART = {
  prices: [
    [1700000000000, 41000],
    [1700086400000, 42000],
  ],
  market_caps: [[1700000000000, 800000000000]],
  total_volumes: [[1700000000000, 25000000000]],
};

/**
 * Devuelve las respuestas simuladas; `mode` permite forzar el fallo.
 * Si se pasa `seen`, cada URL pedida se registra ahí: varias comprobaciones dependen no
 * solo de lo que se pinta, sino de cuántas peticiones se llegaron a hacer.
 */
function installRoutes(page, mode = "ok", seen) {
  return page.route("**/api.coingecko.com/**", async (route) => {
    const url = route.request().url();
    seen?.push(url);

    if (mode === "ratelimit") {
      return route.fulfill({ status: 429, body: "rate limited" });
    }

    const json = (body) => route.fulfill({ status: 200, json: body });

    if (url.includes("/search/trending")) return json(TRENDING);
    if (url.includes("/market_chart")) return json(CHART);
    if (url.includes("/search?")) return json({ coins: [{ id: "bitcoin", name: "Bitcoin" }] });
    if (url.includes("/coins/markets")) {
      // Respetar `ids` para que la vista de guardados devuelva solo lo guardado y la
      // aserción del test signifique algo.
      const ids = new URL(url).searchParams.get("ids");
      if (ids) {
        const wanted = new Set(ids.split(","));
        return json(MARKETS.filter((coin) => wanted.has(coin.id)));
      }
      return json(MARKETS);
    }
    if (url.includes("/coins/")) return json(COIN_DETAIL);
    return json({});
  });
}

/**
 * Comprobación de bundle, antes de arrancar nada.
 *
 * Es la única que defiende directamente el objetivo declarado de esta entrega, y no
 * necesita navegador: lee de `dist/index.html` los chunks que el navegador precarga de
 * verdad y suma sus tamaños. Si alguien vuelve a importar Recharts desde una ruta
 * temprana, esto se pone en rojo antes que ninguna otra cosa.
 */
const BUNDLE_LIMIT_KB = 480;

function checkBundle(check) {
  const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
  const html = readFileSync(join(dist, "index.html"), "utf8");
  const chunks = [...new Set([...html.matchAll(/assets\/[A-Za-z0-9_-]+\.js/g)].map((m) => m[0]))];

  let total = 0;
  let withRecharts = [];
  for (const chunk of chunks) {
    const file = join(dist, chunk);
    total += statSync(file).size;
    if (readFileSync(file, "utf8").includes("recharts")) withRecharts.push(chunk);
  }

  const kb = total / 1024;
  check(
    "Recharts no está en el bundle inicial",
    withRecharts.length === 0,
    withRecharts.join(", "),
  );
  check(
    `El JS inicial cabe en ${BUNDLE_LIMIT_KB} kB`,
    kb < BUNDLE_LIMIT_KB,
    `${kb.toFixed(2)} kB en ${chunks.length} chunks`,
  );
}

const results = [];
const check = (name, passed, detail = "") => {
  results.push({ name, passed, detail });
  console.log(`${passed ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
};

checkBundle(check);

/* `--strictPort` es deliberado: sin él, un preview huérfano de una ejecución anterior
   ocupa el puerto, Vite se mueve a otro en silencio y el test acaba midiendo un 404
   en vez de la aplicación. Mejor fallar ruidosamente. */
const server = spawn("pnpm", ["exec", "vite", "preview", "--port", "4173", "--strictPort"], {
  stdio: "ignore",
  detached: false,
});

try {
  let up = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(BASE);
      if (res.ok) {
        up = true;
        break;
      }
    } catch {
      /* aún arrancando */
    }
    await sleep(250);
  }
  if (!up) throw new Error(`El servidor de preview no respondió en ${BASE}`);

  const browser = await chromium.launch();

  // ---- 1. La vista de mercado renderiza filas reales ----
  {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await installRoutes(page);
    await page.goto(BASE, { waitUntil: "networkidle" });

    const rows = await page.locator("tbody tr").count();
    check("La tabla de mercado pinta filas", rows === 2, `${rows} filas`);
    check(
      "El precio usa formato de divisa",
      await page.getByText("$42,123.45").first().isVisible(),
    );
    check("Sin excepciones en consola", errors.length === 0, errors.join("; "));
    await page.close();
  }

  // ---- 2. El modal se abre, atrapa el foco y cierra con Escape ----
  {
    const page = await browser.newPage();
    await installRoutes(page);
    await page.goto(BASE, { waitUntil: "networkidle" });

    await page.getByRole("link", { name: "Bitcoin" }).first().click();
    const dialog = page.locator("dialog[open]");
    await dialog.waitFor({ timeout: 5000 });
    check("El detalle abre un <dialog> modal", await dialog.isVisible());

    const focusInside = await page.evaluate(() => {
      const d = document.querySelector("dialog[open]");
      return d ? d.contains(document.activeElement) : false;
    });
    check("El foco entra en el diálogo", focusInside);

    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    check("Escape cierra el diálogo", (await page.locator("dialog[open]").count()) === 0);
    check("La URL vuelve a la lista", new URL(page.url()).pathname === "/");
    await page.close();
  }

  // ---- 3. Un 429 muestra error con reintento, no un spinner eterno ----
  {
    const page = await browser.newPage();
    await installRoutes(page, "ratelimit");
    await page.goto(BASE, { waitUntil: "networkidle" });

    const alert = page.getByRole("alert");
    await alert.waitFor({ timeout: 10000 });
    const text = await alert.innerText();
    check("Un 429 muestra un mensaje de error", /rate limiting/i.test(text), text.trim());
    check(
      "El error ofrece reintentar",
      await page.getByRole("button", { name: /try again/i }).isVisible(),
    );
    check("No queda ningún spinner colgado", (await page.locator("output").count()) === 0);
    await page.close();
  }

  // ---- 4. Guardados: estado vacío propio y persistencia ----
  {
    const page = await browser.newPage();
    await installRoutes(page);
    await page.goto(`${BASE}/saved`, { waitUntil: "networkidle" });
    check(
      "Guardados vacío tiene su propio mensaje",
      await page.getByText(/watchlist is empty/i).isVisible(),
    );

    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /save bitcoin to watchlist/i }).click();
    await page.goto(`${BASE}/saved`, { waitUntil: "networkidle" });
    const savedRows = await page.locator("tbody tr").count();
    check(
      "Guardar persiste y muestra solo la moneda guardada",
      savedRows === 1,
      `${savedRows} fila(s)`,
    );
    await page.close();
  }

  // ---- 5. Móvil a 375px: nada desborda en horizontal ----
  {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await installRoutes(page);

    for (const path of ["/", "/trending", "/saved"]) {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      check(`Sin scroll horizontal en ${path} a 375px`, !overflow);
    }
    await page.close();
  }

  // ---- 6. Divisa inválida no rompe la aplicación ----
  {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await installRoutes(page);
    await page.goto(BASE, { waitUntil: "networkidle" });

    await page.getByLabel("Currency:").fill("12"); // 2 dígitos: inválido y alcanzable pese a maxLength=3
    await page.getByRole("button", { name: "Set", exact: true }).click();
    await page.waitForTimeout(300);

    check("Una divisa inválida muestra validación", await page.getByRole("alert").isVisible());
    check("Una divisa inválida no tumba la app", errors.length === 0, errors.join("; "));
    check("La tabla sigue en pie", (await page.locator("tbody tr").count()) === 2);
    await page.close();
  }

  // ---- 7. Los search params son la fuente de verdad de los filtros ----
  {
    const page = await browser.newPage();
    const seen = [];
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await installRoutes(page, "ok", seen);

    await page.goto(BASE, { waitUntil: "networkidle" });
    check("La URL por defecto no lleva query string", page.url() === `${BASE}/`, page.url());

    await page.getByLabel("Currency:").fill("eur");
    await page.getByRole("button", { name: "Set", exact: true }).click();
    await page.waitForTimeout(400);
    check(
      "Fijar una divisa la escribe en la URL",
      page.url() === `${BASE}/?currency=eur`,
      page.url(),
    );

    /* Lo único que demuestra que `retainSearchParams` está funcionando: TanStack Router
       descarta los search params al cambiar de ruta si nadie se lo impide. */
    await page.getByRole("link", { name: "Trending", exact: true }).click();
    await page.waitForTimeout(500);
    check(
      "La divisa sobrevive al ir a /trending",
      page.url() === `${BASE}/trending?currency=eur`,
      page.url(),
    );
    await page.getByRole("link", { name: "Saved", exact: true }).click();
    await page.waitForTimeout(400);
    check(
      "La divisa sobrevive al ir a /saved",
      page.url() === `${BASE}/saved?currency=eur`,
      page.url(),
    );

    // Y que `stripSearchParams` deja la URL limpia cuando todo vale su valor por defecto.
    await page.getByRole("link", { name: "Crypto", exact: true }).click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Reset" }).click();
    await page.waitForTimeout(400);
    check("Reset deja la URL sin query string", page.url() === `${BASE}/`, page.url());

    check("Nada de esto lanza excepciones", errors.length === 0, errors.join("; "));
    await page.close();
  }

  // ---- 8. Un enlace directo con filtros llega hasta la petición ----
  {
    const page = await browser.newPage();
    const seen = [];
    await installRoutes(page, "ok", seen);
    await page.goto(`${BASE}/?currency=eur&page=2&perPage=5`, { waitUntil: "networkidle" });

    const request = seen.find((url) => url.includes("/coins/markets"));
    const params = request ? new URL(request).searchParams : new URLSearchParams();
    check(
      "Un enlace con filtros se traduce a la petición",
      params.get("vs_currency") === "eur" &&
        params.get("page") === "2" &&
        params.get("per_page") === "5",
      request?.split("?")[1] ?? "sin petición",
    );
    check(
      "Y la paginación muestra la página del enlace",
      await page.getByText("Page 2").isVisible(),
    );
    await page.close();
  }

  // ---- 9. Search params hostiles no dejan la aplicación en blanco ----
  {
    const page = await browser.newPage();
    const seen = [];
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await installRoutes(page, "ok", seen);

    /* Al mudar los filtros a la URL dejan de venir de un formulario validado. Este es el
       modo de fallo nuevo que introduce ese cambio, así que va probado explícitamente. */
    await page.goto(`${BASE}/?currency=eur1&page=-4&perPage=99999&sort=lol`, {
      waitUntil: "networkidle",
    });

    const request = seen.find((url) => url.includes("/coins/markets"));
    const params = request ? new URL(request).searchParams : new URLSearchParams();
    check(
      "Los filtros inválidos caen a valores seguros",
      params.get("vs_currency") === "usd" &&
        params.get("page") === "1" &&
        params.get("per_page") === "250" &&
        params.get("order") === "market_cap_desc",
      request?.split("?")[1] ?? "sin petición",
    );
    check("La tabla se pinta igualmente", (await page.locator("tbody tr").count()) === 2);
    check("Sin excepciones con params hostiles", errors.length === 0, errors.join("; "));
    await page.close();
  }

  // ---- 10. El modal se abre encima de la lista, sin remontarla ----
  {
    const page = await browser.newPage();
    const seen = [];
    await installRoutes(page, "ok", seen);
    await page.goto(BASE, { waitUntil: "networkidle" });

    const before = await page.locator("tbody tr").count();
    seen.length = 0;
    await page.getByRole("link", { name: "Bitcoin" }).first().click();
    await page.locator("dialog[open]").waitFor({ timeout: 5000 });
    await page.waitForTimeout(600);

    check(
      "Abrir el detalle no altera la lista de fondo",
      (await page.locator("tbody tr").count()) === before,
    );
    /* La comprobación que protege el límite de tasa de CoinGecko: si la ruta layout
       estuviera mal montada, la lista se remontaría y volvería a pedir el mercado. */
    check(
      "Y no dispara una segunda petición de mercado",
      seen.filter((url) => url.includes("/coins/markets")).length === 0,
      `${seen.filter((url) => url.includes("/coins/markets")).length} peticiones`,
    );
    await page.close();
  }

  // ---- 11. El detalle funciona colgando de las tres listas ----
  {
    const page = await browser.newPage();
    await installRoutes(page);

    await page.goto(`${BASE}/trending/solana`, { waitUntil: "networkidle" });
    await page.locator("dialog[open]").waitFor({ timeout: 5000 });
    check(
      "/trending/{coin} deja la lista de tendencias detrás",
      await page.getByRole("heading", { name: "Trending coins" }).isVisible(),
    );

    // La watchlist se puebla primero: si no, /saved/{coin} mostraría el estado vacío.
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /save bitcoin to watchlist/i }).click();
    await page.goto(`${BASE}/saved/bitcoin`, { waitUntil: "networkidle" });
    await page.locator("dialog[open]").waitFor({ timeout: 5000 });
    check(
      "/saved/{coin} deja la watchlist detrás",
      await page.getByRole("heading", { name: "Your watchlist" }).isVisible(),
    );

    /* Antes esto fallaba: la tabla enlazaba siempre a `/{coinId}`, así que abrir una
       moneda desde Guardados cambiaba la lista de fondo a la de mercado. */
    await page.goto(`${BASE}/saved`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Bitcoin" }).first().click();
    await page.waitForTimeout(500);
    check(
      "Abrir desde Guardados se queda en /saved",
      new URL(page.url()).pathname === "/saved/bitcoin",
      page.url(),
    );

    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    check("Y al cerrar vuelve a /saved", new URL(page.url()).pathname === "/saved", page.url());
    await page.close();
  }

  // ---- 12. Una sola pestaña activa, y una ruta inexistente no rompe ----
  {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await installRoutes(page);

    const current = () => page.locator('nav[aria-label="Main"] [aria-current="page"]');
    await page.goto(`${BASE}/trending`, { waitUntil: "networkidle" });
    check(
      "En /trending solo hay una pestaña activa",
      (await current().count()) === 1 && (await current().innerText()) === "Trending",
      await current()
        .allInnerTexts()
        .then((t) => t.join(",")),
    );
    /* La pestaña de mercado debe seguir activa con el modal abierto: la lista de fondo
       sigue siendo la suya. */
    await page.goto(`${BASE}/bitcoin`, { waitUntil: "networkidle" });
    check(
      "Con el modal de mercado abierto sigue activa Crypto",
      (await current().count()) === 1 && (await current().innerText()) === "Crypto",
    );

    await page.goto(`${BASE}/a/b/c`, { waitUntil: "networkidle" });
    check(
      "Una ruta inexistente muestra su propia página",
      await page.getByRole("heading", { name: /does not exist/i }).isVisible(),
    );
    check("Sin excepciones en ninguna de las tres", errors.length === 0, errors.join("; "));
    await page.close();
  }

  // ---- 13. Accesibilidad automatizada (axe) ----
  {
    // axe exige una página creada desde un contexto explícito, no desde browser.newPage().
    const context = await browser.newContext();
    const page = await context.newPage();
    await installRoutes(page);

    const scan = async (label) => {
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      check(
        `axe sin infracciones en ${label}`,
        violations.length === 0,
        violations.map((v) => `${v.id} (${v.nodes.length})`).join(", "),
      );
    };

    for (const path of ["/", "/trending", "/saved"]) {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      await scan(path);
    }

    await page.goto(`${BASE}/bitcoin`, { waitUntil: "networkidle" });
    await page.locator("dialog[open]").waitFor({ timeout: 5000 });
    await scan("el modal de detalle");
    await context.close();
  }

  await browser.close();
} finally {
  server.kill("SIGTERM");
}

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones pasan.`);
if (failed.length > 0) {
  console.error(`\n${failed.length} fallo(s).`);
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Genera los iconos de mapa de bits a partir de `public/favicon.svg`.
 *
 * Usa el Chromium que Playwright ya instaló para la prueba de humo, así que no añade
 * ninguna dependencia: rasterizar un SVG es justo lo que un navegador sabe hacer bien.
 *
 * Los PNG resultantes se commitean a propósito. `pnpm build` no debe depender de que haya
 * un navegador instalado; este script es la fuente reproducible, no un paso del build.
 *
 *   node scripts/build-icons.mjs
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public/favicon.svg"), "utf8");

/** Los tokens se duplican aquí porque una página en blanco no tiene el CSS del tema. */
const SURFACE_BASE = "#0b0d10";
const ACCENT = "#14ffec";
const FG = "#eef1f5";

/**
 * `padding` deja zona de seguridad: iOS recorta las esquinas del apple-touch-icon y
 * Android puede aplicar máscaras de formas distintas sobre los iconos del manifiesto.
 */
const ICONS = [
  { file: "apple-touch-icon.png", size: 180, padding: 0.12 },
  { file: "icon-192.png", size: 192, padding: 0.1 },
  { file: "icon-512.png", size: 512, padding: 0.1 },
];

const iconPage = (size, padding) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0}
  body{width:${size}px;height:${size}px;background:${SURFACE_BASE};display:grid;place-items:center}
  svg{width:${Math.round(size * (1 - padding * 2))}px;height:auto;display:block}
  svg rect{fill:transparent}
</style></head><body>${svg}</body></html>`;

const ogPage = () => `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap">
<style>
  html,body{margin:0;padding:0}
  body{
    width:1200px;height:630px;background:${SURFACE_BASE};color:${FG};
    font-family:Nunito,ui-sans-serif,system-ui,sans-serif;
    display:flex;flex-direction:column;justify-content:center;gap:28px;padding:0 96px;box-sizing:border-box;
  }
  /* Un resplandor tenue en la esquina evita que el fondo lea como un rectángulo plano. */
  body::after{
    content:"";position:absolute;inset:auto -200px -260px auto;width:720px;height:720px;
    background:radial-gradient(circle, ${ACCENT}1f 0%, transparent 62%);
  }
  .row{display:flex;align-items:center;gap:24px}
  .row svg{width:104px;height:104px}
  .name{font-size:76px;letter-spacing:-.02em}
  .name .a{font-weight:400}
  .name .b{font-weight:700;color:${ACCENT}}
  .tag{font-size:34px;color:#c3cad5;max-width:820px;line-height:1.35}
  .rule{width:120px;height:6px;border-radius:3px;background:${ACCENT}}
</style></head>
<body>
  <div class="row">${svg}<span class="name"><span class="a">Crypto</span><span class="b">sh1f</span></span></div>
  <div class="rule"></div>
  <p class="tag">Live cryptocurrency prices, market caps and 7-day trends — plus a watchlist that stays on your device.</p>
</body></html>`;

const browser = await chromium.launch();
const written = [];

try {
  for (const { file, size, padding } of ICONS) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(iconPage(size, padding));
    writeFileSync(join(root, "public", file), await page.screenshot({ omitBackground: false }));
    written.push(file);
    await page.close();
  }

  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.setContent(ogPage(), { waitUntil: "networkidle" });
  // Sin esto, la captura puede salir con la tipografía de reserva en vez de Nunito.
  await og.evaluate(() => document.fonts.ready);
  /* JPEG y no PNG: la tarjeta es un degradado sobre un plano, que es justo lo que PNG
     comprime mal (99 kB) y JPEG bien. La imagen solo la descargan los rastreadores de
     enlaces, nunca la aplicación. */
  writeFileSync(join(root, "public/og.jpg"), await og.screenshot({ type: "jpeg", quality: 90 }));
  written.push("og.jpg");
  await og.close();
} finally {
  await browser.close();
}

for (const file of written) {
  const { size } = statSync(join(root, "public", file));
  console.log(`${file.padEnd(22)} ${(size / 1024).toFixed(1)} kB`);
}

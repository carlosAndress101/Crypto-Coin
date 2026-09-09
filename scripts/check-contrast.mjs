#!/usr/bin/env node
/**
 * Verificador de contraste WCAG 2.2 para los tokens de color del sistema de diseño.
 *
 * Lee los tokens directamente de src/styles/theme.css, así que no puede desincronizarse
 * de lo que realmente usa la aplicación. Falla con código 1 si algún par declarado
 * incumple su umbral.
 *
 *   node scripts/check-contrast.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "src/styles/theme.css"), "utf8");

/** Extrae `--color-nombre: #hex;` del bloque @theme. */
function readTokens(source) {
  const tokens = {};
  for (const [, name, hex] of source.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[name] = hex.toLowerCase();
  }
  return tokens;
}

const channel = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
};

const ratio = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].toSorted((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const tokens = readTokens(css);

/**
 * Pares que la aplicación usa de verdad. Cada entrada declara el umbral que le toca:
 *   4.5 → texto normal (AA)
 *   3   → texto grande (≥24px o ≥18.66px bold) y componentes de interfaz (AA)
 */
const PAIRS = [
  // Texto sobre el fondo de página
  ["fg", "surface-base", 4.5, "Texto principal sobre fondo de página"],
  ["fg-secondary", "surface-base", 4.5, "Texto secundario sobre fondo de página"],
  ["fg-muted", "surface-base", 4.5, "Cabeceras de tabla y etiquetas"],
  ["accent", "surface-base", 4.5, "Enlaces y acento sobre fondo"],
  ["positive", "surface-base", 4.5, "Variación de precio positiva"],
  ["negative", "surface-base", 4.5, "Variación de precio negativa"],

  // Texto sobre superficie elevada (filas, tarjetas, modal)
  ["fg", "surface-raised", 4.5, "Texto principal sobre tarjeta"],
  ["fg-secondary", "surface-raised", 4.5, "Texto secundario sobre tarjeta"],
  ["fg-muted", "surface-raised", 4.5, "Etiquetas sobre tarjeta"],
  ["accent", "surface-raised", 4.5, "Acento sobre tarjeta"],
  ["positive", "surface-raised", 4.5, "Positivo sobre tarjeta"],
  ["negative", "surface-raised", 4.5, "Negativo sobre tarjeta"],

  // Superficie de control (inputs, botones inactivos)
  ["fg", "surface-control", 4.5, "Texto de input"],
  ["fg-muted", "surface-control", 4.5, "Placeholder de input"],
  ["accent", "surface-control", 4.5, "Acento sobre control"],

  // Inversión: texto oscuro sobre acento (nav activo, botón primario)
  ["fg-inverse", "accent", 4.5, "Texto sobre fondo de acento"],

  // Componentes de interfaz: bordes y foco necesitan 3:1
  ["line-strong", "surface-base", 3, "Borde visible sobre fondo"],
  ["line-strong", "surface-raised", 3, "Borde visible sobre tarjeta"],
  ["focus", "surface-base", 3, "Anillo de foco sobre fondo"],
  ["focus", "surface-raised", 3, "Anillo de foco sobre tarjeta"],
];

let failed = 0;
const rows = [];

for (const [fg, bg, threshold, label] of PAIRS) {
  if (!tokens[fg] || !tokens[bg]) {
    console.error(`✗ token inexistente: ${!tokens[fg] ? fg : bg}`);
    failed++;
    continue;
  }
  const r = ratio(tokens[fg], tokens[bg]);
  const ok = r >= threshold;
  if (!ok) failed++;
  rows.push({
    ok,
    label,
    pair: `${fg} / ${bg}`,
    ratio: r.toFixed(2),
    threshold: threshold.toFixed(1),
  });
}

const width = Math.max(...rows.map((r) => r.label.length));
for (const r of rows) {
  console.log(
    `${r.ok ? "✓" : "✗"} ${r.label.padEnd(width)}  ${r.ratio.padStart(6)}:1  (min ${r.threshold})  ${r.pair}`,
  );
}

console.log(`\n${rows.length - failed}/${rows.length} pares cumplen WCAG 2.2 AA.`);

if (failed > 0) {
  console.error(`\n${failed} par(es) por debajo del umbral.`);
  process.exit(1);
}

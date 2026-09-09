/**
 * Formateo de cifras.
 *
 * Todo pasa por aquí por un motivo concreto: `Intl.NumberFormat` **lanza RangeError**
 * si el código de divisa no está bien formado, y el filtro de divisa de la aplicación
 * es un campo de texto libre. Antes, escribir "eur1" en ese campo tumbaba el árbol de
 * React entero. Ahora se valida en la frontera y nunca llega un valor inválido al Intl.
 */

export const DEFAULT_CURRENCY = "usd";

/** ISO 4217 y los códigos cripto de CoinGecko comparten forma: tres letras. */
const CURRENCY_PATTERN = /^[a-z]{3}$/i;

export function isValidCurrency(value: string): boolean {
  return CURRENCY_PATTERN.test(value.trim());
}

/** Normaliza a algo que Intl acepta, con USD como red de seguridad. */
export function normalizeCurrency(value: string | null | undefined): string {
  if (!value) return DEFAULT_CURRENCY;
  const trimmed = value.trim().toLowerCase();
  return isValidCurrency(trimmed) ? trimmed : DEFAULT_CURRENCY;
}

interface CurrencyOptions {
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  notation?: "standard" | "compact";
}

/**
 * Formatea un importe. Devuelve un guion largo para nulos: la tabla debe distinguir
 * "esta moneda no reporta este dato" de "vale cero".
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string,
  options: CurrencyOptions = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizeCurrency(currency),
      ...options,
    }).format(value);
  } catch {
    // Última red: un código con forma válida pero que Intl no reconozca.
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: DEFAULT_CURRENCY,
      ...options,
    }).format(value);
  }
}

/** Formatea un porcentaje ya expresado en unidades de porcentaje (12.34 → "12.34%"). */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)}%`;
}

/** Enteros grandes con separadores de millar: volúmenes y suministros. */
export function formatNumber(
  value: number | null | undefined,
  options: Intl.NumberFormatOptions = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", options).format(value);
}

/**
 * Clasifica una variación para elegir color. `null` no es "a la baja": una moneda sin
 * dato debe pintarse neutra, no en rojo.
 */
export function changeTone(value: number | null | undefined): "positive" | "negative" | "neutral" {
  if (value === null || value === undefined || Number.isNaN(value)) return "neutral";
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

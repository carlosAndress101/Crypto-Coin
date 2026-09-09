import { z } from "zod";
import { useSearch } from "@tanstack/react-router";
import { DEFAULT_CURRENCY, normalizeCurrency } from "@/lib/format";

/**
 * Search params de la raíz.
 *
 * Solo la divisa vive aquí, y es deliberado: la necesitan las tres vistas y el diálogo de
 * detalle, que cuelga de tres padres distintos. En la raíz puede leerla con una sola
 * llamada en vez de ramificar según quién lo montó. El orden, la página y el tamaño de
 * página NO suben aquí: si lo hicieran, `/trending?page=3&sort=volume_desc` sería una URL
 * válida, retenida y sin ningún significado.
 *
 * El parseo es **total y no lanza**. Al pasar los filtros a la URL dejan de venir de un
 * formulario ya validado y pasan a ser entrada arbitraria en el primer pintado: si
 * `validateSearch` lanzara con `?currency=eur1` saldría la frontera de error del router en
 * lugar de la aplicación, y si no validara, `eur1` llegaría a `Intl.NumberFormat` y volvería
 * el RangeError que dejaba la pantalla en blanco. `normalizeCurrency` ya implementa esa
 * caída a USD, así que se reutiliza en vez de duplicar la regla.
 */
export const ROOT_SEARCH_DEFAULTS = { currency: DEFAULT_CURRENCY } as const;

export const rootSearchSchema = z.object({
  currency: z
    .string()
    .default(DEFAULT_CURRENCY)
    .catch(DEFAULT_CURRENCY)
    .transform(normalizeCurrency),
});

/** Divisa activa, legible desde cualquier ruta. */
export function useCurrency(): string {
  return useSearch({ from: "__root__", select: (search) => search.currency });
}

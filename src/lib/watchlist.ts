/**
 * Lista de guardados en localStorage.
 *
 * `localStorage` puede lanzar (modo privado de Safari, cuota llena, cookies bloqueadas)
 * y puede contener basura de una versión anterior. Antes se hacía `JSON.parse` sin red
 * de seguridad, así que un valor corrupto rompía el arranque de la aplicación.
 * Aquí cualquier fallo degrada a "lista vacía" en vez de tumbar la página.
 */

const STORAGE_KEY = "coins";

export function readWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function writeWatchlist(ids: readonly string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Sin almacenamiento la aplicación sigue funcionando; solo no persiste entre visitas.
  }
}

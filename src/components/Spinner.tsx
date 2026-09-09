interface SpinnerProps {
  label?: string;
}

/**
 * Indicador de carga. Usa `<output>` en vez de `<div role="status">` porque `<output>`
 * ya tiene ese rol de forma nativa y viene con `aria-live="polite"` incorporado, así que
 * los lectores de pantalla anuncian el cambio sin configuración extra.
 */
export function Spinner({ label = "Loading…" }: SpinnerProps) {
  return (
    <output className="flex w-full items-center justify-center gap-2 py-8">
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-b-surface-control"
      />
      <span className="text-fg-secondary">{label}</span>
    </output>
  );
}

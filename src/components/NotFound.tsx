import { Link } from "@tanstack/react-router";

/**
 * Nota honesta sobre el alcance: una URL de un solo segmento como `/asdf` NO llega aquí,
 * porque empareja con `/$coinId` y acaba mostrando "That coin could not be found" del
 * diálogo. Esto solo cubre rutas de dos o más segmentos. Es el comportamiento que ya
 * tenía la aplicación y se conserva a propósito para no cambiar el espacio de URLs.
 */
export function NotFound() {
  return (
    <section className="mt-16 flex w-[90%] flex-col items-center gap-3 text-center xs:w-[80%]">
      <h1 className="text-xl font-bold">This page does not exist.</h1>
      <p className="text-fg-muted">The address you followed does not match anything here.</p>
      <Link to="/" className="rounded bg-surface-control px-3 py-1 font-semibold hover:text-accent">
        Back to the market
      </Link>
    </section>
  );
}

import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";

/**
 * Marca completa: símbolo + logotipo.
 *
 * El logotipo es texto HTML, no un trazado ni una imagen. Pesa cero bytes, hereda los
 * tokens del tema, se puede seleccionar y buscar en la página, y escala con la tipografía
 * del sistema. Antes era un PNG de 500×500 y 77 kB que se pintaba a 48 px.
 *
 * El `1` de "sh1f" se destaca en color de acento a propósito: es lo único distintivo del
 * nombre y estaba enterrado dentro de un ráster.
 *
 * El símbolo es decorativo (`aria-hidden` dentro de BrandMark) porque el nombre ya está
 * en el texto de al lado: anunciarlo otra vez sería repetir lo mismo dos veces.
 */
export function Logo() {
  return (
    <Link
      to="/"
      aria-label="Cryptosh1f, go to the market"
      className="absolute top-6 left-6 flex items-center gap-2 text-lg no-underline"
    >
      <BrandMark className="h-9 w-9 sm:h-11 sm:w-11" />
      <span className="font-nunito tracking-tight">
        <span className="font-normal text-fg">Crypto</span>
        <span className="font-bold text-accent">sh1f</span>
      </span>
    </Link>
  );
}

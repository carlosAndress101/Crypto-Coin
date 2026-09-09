/**
 * Símbolo de marca de Cryptosh1f — "the shift mark".
 *
 * Un trazo continuo que sube en dos escalones de altura desigual (4 y 6 unidades, 2:3) y
 * termina en un chaflán de 45°. La desigualdad es deliberada: dos escalones iguales
 * producen el icono de gráfico de barras que usa media categoría; la proporción 2:3 hace
 * que el recorrido lea como una trayectoria concreta y no como un pictograma genérico.
 * El chaflán final convierte la escalera en flecha sin añadir una punta aparte, que es lo
 * primero que se pierde a 16 px.
 *
 * Es un solo `path`: a tamaño de favicon quedan tres trazos cian sobre un cuadrado oscuro,
 * que es exactamente lo que se puede distinguir en una pestaña.
 *
 * Los colores salen de los tokens del tema, así que el símbolo cambia con la paleta sin
 * tocar este archivo. `public/favicon.svg` es el mismo dibujo con los valores en crudo,
 * porque ahí no hay variables CSS.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={className}
      role="presentation"
    >
      <rect width="32" height="32" rx="8" fill="var(--color-surface-raised)" />
      <path
        d="M6 23H11.5V19H17V13H22L26.5 8.5"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import type { ListPath } from "@/app/paths";

const LINKS: readonly { to: ListPath; label: string }[] = [
  { to: "/", label: "Crypto" },
  { to: "/trending", label: "Trending" },
  { to: "/saved", label: "Saved" },
];

/**
 * Navegación principal.
 *
 * El estado activo se calcula aquí en vez de delegarlo en `activeProps`, porque ninguna
 * de las dos opciones automáticas es correcta para la pestaña "Crypto": exacta la apagaría
 * en `/bitcoin`, donde la lista de mercado sigue siendo la vista de fondo, y difusa la
 * encendería en `/trending` y `/saved`, que empiezan por "/". Ese era justamente el
 * defecto del `NavLink to="/" end={false}` anterior: dos pestañas marcadas a la vez.
 *
 * `aria-current="page"` es lo que convierte el color en un estado accesible, y solo cuenta
 * dentro de un `<nav>` con nombre: de ahí el `aria-label`.
 */
export function Navigation() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const active: ListPath = pathname.startsWith("/trending")
    ? "/trending"
    : pathname.startsWith("/saved")
      ? "/saved"
      : "/";

  return (
    <nav
      aria-label="Main"
      className="mt-20 flex w-[90%] justify-around rounded-md border border-solid border-accent sm:mt-24 sm:w-[80%] sm:rounded-lg lg:mt-16 lg:w-[40%]"
    >
      {LINKS.map(({ to, label }) => {
        const isActive = to === active;
        return (
          <Link
            key={to}
            to={to}
            aria-current={isActive ? "page" : undefined}
            className={`m-2.5 w-full cursor-pointer rounded border-0 text-center text-base font-semibold capitalize transition-colors ${
              isActive
                ? "bg-accent text-fg-inverse"
                : "bg-surface-control text-fg-muted hover:text-accent"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

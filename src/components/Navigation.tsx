import { NavLink } from "react-router";

const LINKS = [
  { to: "/", label: "Crypto", end: false },
  { to: "/trending", label: "Trending", end: true },
  { to: "/saved", label: "Saved", end: false },
] as const;

/**
 * Navegación principal. `aria-current="page"` lo pone NavLink solo, pero solo cuenta
 * como estado accesible si el elemento es un enlace de navegación dentro de un `<nav>`
 * con nombre: de ahí el `aria-label`.
 */
export function Navigation() {
  return (
    <nav
      aria-label="Main"
      className="mt-20 flex w-[90%] justify-around rounded-md border border-solid border-accent sm:mt-24 sm:w-[80%] sm:rounded-lg lg:mt-16 lg:w-[40%]"
    >
      {LINKS.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `m-2.5 w-full cursor-pointer rounded border-0 text-center text-base font-semibold capitalize transition-colors ${
              isActive
                ? "bg-accent text-fg-inverse"
                : "bg-surface-control text-fg-muted hover:text-accent"
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

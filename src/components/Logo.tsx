import { Link } from "react-router";
import logo from "@/assets/logo.png";

export function Logo() {
  return (
    <Link
      to="/"
      className="absolute top-6 left-6 flex items-center text-lg text-accent no-underline"
    >
      <img src={logo} alt="" width={64} height={64} className="w-12 sm:w-16" />
      <span className="sr-only">Cryptosh1f home</span>
    </Link>
  );
}

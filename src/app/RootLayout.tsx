import { Outlet } from "react-router";
import { Logo } from "@/components/Logo";
import { Navigation } from "@/components/Navigation";

export default function RootLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-surface-base font-nunito text-fg">
      <header className="flex w-full flex-col items-center">
        <Logo />
        <Navigation />
      </header>

      <main className="flex w-full flex-col items-center">
        <Outlet />
      </main>
    </div>
  );
}

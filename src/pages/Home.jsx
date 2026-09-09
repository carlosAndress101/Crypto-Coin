import { Outlet } from "react-router";
import Logo from "../components/Logo";
import Navegation from "../components/Navegation";
import { CryptoProvider } from "../context/CryptoContext";
import { TrendingProvider } from "../context/TrendingContext";
import { StorageProvider } from "../context/StorageContext";

function Home() {
  return (
    <CryptoProvider>
      <TrendingProvider>
        <StorageProvider>
          <main className="w-full h-full flex flex-col first-letter:content-center items-center relative text-fg font-nunito">
            <div className="w-screen h-screen bg-surface-base fixed -z-10" />
            <Logo />
            <Navegation />
            <Outlet />
          </main>
        </StorageProvider>
      </TrendingProvider>
    </CryptoProvider>
  );
}

export default Home;

import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

/**
 * Emite robots.txt y sitemap.xml a partir de VITE_SITE_URL.
 *
 * Antes eran dos archivos estáticos en `public/` con el dominio escrito a mano, o sea
 * tres copias del mismo dato (los dos archivos más las etiquetas Open Graph de
 * index.html) que podían desincronizarse en silencio. Ahora el dominio existe en un
 * único sitio, `.env.production`, y todo lo demás se deriva de ahí.
 *
 * Si la variable falta, el build **se detiene**: un sitemap que apunte a localhost
 * publicado en producción es peor que no tener sitemap.
 */
function siteFiles(siteUrl: string): Plugin {
  return {
    name: "cryptosh1f:site-files",

    /*
     * La sustitución la hace este plugin y no el mecanismo `%VAR%` de Vite a propósito:
     * ese solo mira las variables del modo actual, así que en `pnpm dev` no encontraba
     * VITE_SITE_URL —vive en .env.production— y dejaba el marcador literal en las
     * etiquetas Open Graph, además de imprimir un aviso por cada aparición.
     */
    transformIndexHtml(html) {
      return html.replaceAll("__SITE_URL__", siteUrl);
    },

    // Solo se ejecuta en build; en desarrollo no hay nada que emitir.
    generateBundle() {
      const robots = [
        "User-agent: *",
        "Allow: /",
        "",
        "# El detalle de una moneda es la misma página con un modal encima, así que",
        "# rastrear /{coinId} para miles de monedas no aporta contenido nuevo.",
        "Disallow: /*?",
        "",
        `Sitemap: ${siteUrl}/sitemap.xml`,
        "",
      ].join("\n");

      const pages = [
        { path: "/", changefreq: "hourly", priority: "1.0" },
        { path: "/trending", changefreq: "hourly", priority: "0.8" },
        { path: "/saved", changefreq: "monthly", priority: "0.5" },
      ];

      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...pages.map(
          ({ path, changefreq, priority }) =>
            `  <url><loc>${siteUrl}${path}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`,
        ),
        "</urlset>",
        "",
      ].join("\n");

      this.emitFile({ type: "asset", fileName: "robots.txt", source: robots });
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap });
    },
  };
}

export default defineConfig(({ mode, command }) => {
  /* El dominio vive en un único archivo, `.env.production`. En desarrollo se lee de ahí
     igualmente: duplicarlo en un `.env.development` sería exactamente la desincronización
     que este plugin existe para evitar. */
  const siteUrl = (
    loadEnv(mode, process.cwd(), "VITE_").VITE_SITE_URL ??
    loadEnv("production", process.cwd(), "VITE_").VITE_SITE_URL
  )?.replace(/\/+$/, "");

  if (command === "build" && !siteUrl) {
    throw new Error(
      "Falta VITE_SITE_URL. Es el dominio del que se derivan las etiquetas Open Graph, " +
        "robots.txt y sitemap.xml. Defínela en .env.production o en el entorno del build.",
    );
  }

  return {
    plugins: [react(), tailwindcss(), siteFiles(siteUrl ?? "")],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});

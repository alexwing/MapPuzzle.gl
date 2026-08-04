// Unprefixed on purpose: @types/node here is v15, which predates "node:".
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "logo192.png", "logo512.png", "robots.txt"],
      manifest: {
        short_name: "MapPuzzle",
        name: "MapPuzzle.xyz",
        start_url: ".",
        display: "standalone",
        theme_color: "#000000",
        background_color: "#ffffff",
        icons: [
          { src: "logo192.png", type: "image/png", sizes: "192x192" },
          { src: "logo512.png", type: "image/png", sizes: "512x512" },
        ],
      },
      workbox: {
        globIgnores: [
          "**/*.sqlite3.png",
          "**/sql-wasm.wasm",
          "**/sqlite.worker.js",
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Disable SPA navigation fallback so the service worker never hijacks
        // navigations. Deep links / external subprojects (e.g. /sevilla360,
        // /depth3dviewer) are resolved by the server as before the PWA existed.
        navigateFallback: null,
      },
    }),
  ],
  envDir: "environments",
  resolve: {
    alias: {
      // react-bootstrap-table-next / -paginator require Node's "events".
      // Resolve it to the browser-compatible npm package instead of letting
      // Vite externalize it (which broke EventEmitter -> "events.default is
      // not a constructor" when opening the puzzle selector).
      events: "events",
      // Contracts shared with the backend. Resolved to the source so there is
      // no build step; mirrored by "paths" in tsconfig.json.
      "@mappuzzle/shared": fileURLToPath(
        new URL("./packages/shared/src/index.d.ts", import.meta.url)
      ),
    },
  },
  optimizeDeps: {
    include: [
      "events",
      "react-bootstrap-table-next",
      "react-bootstrap-table2-paginator",
    ],
  },
  server: { port: 3000 },
  build: { outDir: "build" },
});

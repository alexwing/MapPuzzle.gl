// Unprefixed on purpose: @types/node here is v15, which predates "node:".
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";

const here = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = path.resolve(here, "../..");
const dataDir = path.join(repoRoot, "data");

/**
 * The editor reads the same content it writes: the map GeoJSON it edits, the
 * country flags for the icon picker and the per-piece flags it downloads. It
 * asks for them by the paths the deployed game uses, so they are served from
 * data/ here too, the same way apps/game does it.
 *
 * Read-only and dev-only: the editor is never built for deployment.
 */
function serveDataDir(): Plugin {
  const entries = ["maps", "flags", "customFlags"];
  const types: Record<string, string> = {
    ".geojson": "application/geo+json",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  };

  return {
    name: "mappuzzle:data-dir",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requested = (req as { url?: string }).url ?? "";
        const url = decodeURIComponent(requested.split("?")[0]);
        if (!entries.includes(url.split("/")[1] ?? "")) return next();

        const file = path.join(dataDir, url);
        if (!file.startsWith(dataDir) || !fs.existsSync(file)) return next();
        if (fs.statSync(file).isDirectory()) return next();

        res.setHeader(
          "Content-Type",
          types[path.extname(file).toLowerCase()] ?? "application/octet-stream"
        );
        res.setHeader("Content-Length", String(fs.statSync(file).size));
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  root: here,
  plugins: [react(), serveDataDir()],
  envDir: "environments",
  resolve: {
    alias: {
      "@mappuzzle/shared": path.join(
        repoRoot,
        "packages/shared/src/index.d.ts"
      ),
      "@mappuzzle/core": path.join(repoRoot, "packages/core/src/index.ts"),
    },
  },
  server: { port: 3001 },
});

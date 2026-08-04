// Unprefixed on purpose: @types/node here is v15, which predates "node:".
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const here = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = path.resolve(here, "../..");
const dataDir = path.join(repoRoot, "data");

/** Recursive copy, since @types/node here predates fs.cpSync. */
function copyRecursive(from: string, to: string): void {
  if (fs.statSync(from).isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from)) {
      copyRecursive(path.join(from, entry), path.join(to, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
}

/**
 * The map geometry, the flags, the sitemap and the SQLite database are produced
 * by the editor, not authored here, so they live in the repo's data/ directory
 * instead of this app's public/. The deployed site still serves them from its
 * root, so this plugin serves them from there in dev and copies them into the
 * build.
 *
 * The same directory is ASSETS_DIR in apps/backend/src/config/paths.ts, which
 * is where the editor writes them.
 */
function serveDataDir(): Plugin {
  /** Everything under data/, addressed from the site root. */
  const entries = ["maps", "flags", "customFlags"];
  const files = ["front.sqlite3.png", "sitemap.xml"];
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
        const segment = url.split("/")[1] ?? "";
        const wanted = entries.includes(segment) || files.includes(segment);
        if (!wanted) return next();

        const file = path.join(dataDir, url);
        // Refuse anything that escapes data/ through .. segments.
        if (!file.startsWith(dataDir) || !fs.existsSync(file)) return next();
        const stat = fs.statSync(file);
        if (stat.isDirectory()) return next();

        res.setHeader(
          "Content-Type",
          types[path.extname(file).toLowerCase()] ?? "application/octet-stream"
        );
        // sql.js-httpvfs reads the database in 4 KB pages over range requests
        // and refuses to start without a known length, so both are required.
        res.setHeader("Accept-Ranges", "bytes");

        const headers = (req as { headers?: Record<string, string | undefined> })
          .headers;
        const range = headers?.range;
        const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
        if (match) {
          const start = match[1] === "" ? undefined : Number(match[1]);
          const end = match[2] === "" ? undefined : Number(match[2]);
          // "bytes=-500" means the last 500 bytes.
          const from = start ?? Math.max(0, stat.size - (end ?? 0));
          const to = start === undefined ? stat.size - 1 : Math.min(end ?? stat.size - 1, stat.size - 1);
          if (from > to || from >= stat.size) {
            res.statusCode = 416;
            res.setHeader("Content-Range", `bytes */${stat.size}`);
            return res.end();
          }
          res.statusCode = 206;
          res.setHeader("Content-Range", `bytes ${from}-${to}/${stat.size}`);
          res.setHeader("Content-Length", String(to - from + 1));
          return fs.createReadStream(file, { start: from, end: to }).pipe(res);
        }

        res.setHeader("Content-Length", String(stat.size));
        fs.createReadStream(file).pipe(res);
      });
    },

    // After the bundle is written, so it is not wiped by emptyOutDir.
    closeBundle() {
      const outDir = path.resolve(here, "../../build");
      if (!fs.existsSync(outDir)) return;
      for (const name of [...entries, ...files]) {
        const from = path.join(dataDir, name);
        if (!fs.existsSync(from)) {
          this.warn(`data/${name} is missing, not copied into the build`);
          continue;
        }
        copyRecursive(from, path.join(outDir, name));
      }
    },
  };
}

export default defineConfig({
  root: here,
  plugins: [
    react(),
    serveDataDir(),
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
          // The editor is lazy-loaded authoring tooling; precaching it would
          // push it to every player anyway, which is what the split avoids.
          "**/editorDialog-*",
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
      "@mappuzzle/shared": path.join(
        repoRoot,
        "packages/shared/src/index.d.ts"
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
  // Kept at the repo root so the deploy flow (FTP the whole folder) is unchanged.
  build: { outDir: path.join(repoRoot, "build"), emptyOutDir: true },
});

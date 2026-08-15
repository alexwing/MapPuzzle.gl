import fs from "fs";
import path from "path";

/**
 * Where the backend reads and writes the content it produces.
 *
 * These used to be `path.join(__dirname, "../../../public/...")`, which only
 * resolved correctly while the backend sat next to the game's public/ and while
 * tsc emitted at one specific depth: the same expression pointed somewhere else
 * from build/ than from src/. They are configuration now, defaulting to the
 * repo's data/ directory, which is what the game's Vite build copies into the
 * deployed site.
 *
 * Override with ASSETS_DIR and TEMP_DIR when the editor runs somewhere else.
 */

/** Repo root, from either src/config/ or build/config/. */
const repoRoot = path.resolve(__dirname, "../../../..");

export const ASSETS_DIR = path.resolve(
  process.env.ASSETS_DIR ?? path.join(repoRoot, "data")
);

/** Scratch space for uploads; wiped between runs. */
export const TEMP_DIR = path.resolve(
  process.env.TEMP_DIR ?? path.join(repoRoot, "temp")
);

/**
 * Unpacked shapefiles waiting to be turned into maps.
 *
 * These persist between the upload and the generate step, which is what the
 * PostGIS tables used to do. Not versioned: they are source material, often
 * tens of megabytes, and the GeoJSON they produce is what the game needs.
 */
export const shapefilesDir = (): string =>
  path.resolve(process.env.SHAPEFILES_DIR ?? path.join(ASSETS_DIR, "shapefiles"));

/** The map geometry the game fetches: <ASSETS_DIR>/maps/<name>.geojson */
export const mapsDir = (): string => path.join(ASSETS_DIR, "maps");

/** Country flags offered by the editor's icon picker, read-only. */
export const flagsDir = (): string => path.join(ASSETS_DIR, "flags");

/**
 * The share cards, one per puzzle: <ASSETS_DIR>/og/map/<slug>.png and
 * <ASSETS_DIR>/og/flag-quiz/<slug>.png, mirroring the addresses they belong to.
 */
export const ogDir = (kind: "map" | "flag-quiz"): string =>
  path.join(ASSETS_DIR, "og", kind);

/** The site logo the share cards stamp in their corner. */
export const siteLogoPath = (): string =>
  path.join(repoRoot, "apps/game/public/logo192.png");

/** Per-piece flags downloaded from Wikipedia, plus their raster sizes. */
export const customFlagsDir = (puzzleId: number | string): string =>
  path.join(ASSETS_DIR, "customFlags", String(puzzleId));

/** Written by the editor, served from the site root. */
/**
 * Where the editor writes the sitemap.
 *
 * Two names with the same content: sitemap-index.xml is the one robots.txt
 * declares and the one Search Console is given, because Google never managed to
 * read /sitemap.xml even after the host stopped challenging crawlers. The old
 * name is still written so nothing that links to it goes stale.
 */
export const sitemapPaths = (): string[] =>
  ["sitemap-index.xml", "sitemap.xml"].map((name) => path.join(ASSETS_DIR, name));

/** Creates a directory and its parents; a no-op when it already exists. */
export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

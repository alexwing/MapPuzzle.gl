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

/** Scratch space for shapefile imports; wiped between runs. */
export const TEMP_DIR = path.resolve(
  process.env.TEMP_DIR ?? path.join(repoRoot, "temp")
);

/** The map geometry the game fetches: <ASSETS_DIR>/maps/<name>.geojson */
export const mapsDir = (): string => path.join(ASSETS_DIR, "maps");

/** Country flags offered by the editor's icon picker, read-only. */
export const flagsDir = (): string => path.join(ASSETS_DIR, "flags");

/** Per-piece flags downloaded from Wikipedia, plus their raster sizes. */
export const customFlagsDir = (puzzleId: number | string): string =>
  path.join(ASSETS_DIR, "customFlags", String(puzzleId));

/** Written by the editor, served from the site root. */
export const sitemapPath = (): string => path.join(ASSETS_DIR, "sitemap.xml");

/** Creates a directory and its parents; a no-op when it already exists. */
export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}
